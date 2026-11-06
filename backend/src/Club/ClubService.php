<?php

declare(strict_types=1);

namespace Portal\Club;

use Portal\Http\HttpException;
use Portal\Support\Clock;

/** The club registry: seasons → teams → players and staff, people and their coaching licences. */
final class ClubService
{
    public const KINDS = ['player', 'staff'];

    public function __construct(
        private readonly ClubRepository $repo,
        private readonly Clock $clock,
        private readonly int $warnDays = 90,
    ) {
    }

    // --- seasons -------------------------------------------------------------

    /** @return array{seasons: list<array<string, mixed>>, currentId: ?int} */
    public function seasons(): array
    {
        $seasons = $this->repo->seasons();

        return ['seasons' => $seasons, 'currentId' => self::currentSeasonId($seasons, $this->clock->now())];
    }

    /** @return array<string, mixed> season with its teams */
    public function season(int $id): array
    {
        return $this->seasonOr404($id) + ['teams' => $this->repo->teams($id)];
    }

    /** @param array<string, mixed> $input {name, startsOn, endsOn, copyFrom?} */
    public function createSeason(array $input): array
    {
        $data = $this->seasonInput($input, null);
        $in = new Input($input);
        $copyFrom = $in->int('copyFrom', 1, PHP_INT_MAX, label: 'Sezona ke zkopírování');
        if ($copyFrom !== null && $this->repo->season($copyFrom) === null) {
            $in->error('copyFrom', 'Sezona ke zkopírování neexistuje.');
        }
        $in->throwIfInvalid();

        $id = $this->repo->createSeason($data);
        if ($copyFrom !== null) {
            $this->repo->copyTeams($copyFrom, $id);
        }

        return $this->season($id);
    }

    /** @param array<string, mixed> $input */
    public function updateSeason(int $id, array $input): array
    {
        $this->seasonOr404($id);
        $this->repo->updateSeason($id, $this->seasonInput($input, $id));

        return $this->season($id);
    }

    public function deleteSeason(int $id): void
    {
        $this->seasonOr404($id);
        $this->repo->deleteSeason($id);
    }

    /**
     * The season running today, else the next one to start, else the latest. Pure.
     *
     * @param list<array{id: int, startsOn: string, endsOn: string}> $seasons
     */
    public static function currentSeasonId(array $seasons, \DateTimeImmutable $now): ?int
    {
        $today = $now->format('Y-m-d');
        $upcoming = null;
        foreach ($seasons as $s) {
            if ($s['startsOn'] <= $today && $today <= $s['endsOn']) {
                return $s['id'];
            }
            if ($s['startsOn'] > $today && ($upcoming === null || $s['startsOn'] < $upcoming['startsOn'])) {
                $upcoming = $s;
            }
        }

        return $upcoming['id'] ?? ($seasons[0]['id'] ?? null);
    }

    // --- teams ---------------------------------------------------------------

    /** @return array<string, mixed> team with players and staff (staff with licence state) */
    public function team(int $id): array
    {
        $team = $this->teamOr404($id);
        $members = $this->repo->members($id);
        $staffIds = array_map(static fn (array $m): int => $m['person']['id'], array_filter($members, static fn (array $m): bool => $m['kind'] === 'staff'));
        $licences = $this->licenceStates($this->repo->licences($staffIds));

        $players = [];
        $staff = [];
        foreach ($members as $m) {
            if ($m['kind'] === 'player') {
                $players[] = $m;
            } else {
                $mine = array_values(array_filter($licences, static fn (array $l): bool => $l['personId'] === $m['person']['id']));
                $staff[] = $m + ['licences' => $mine];
            }
        }

        return $team + ['players' => $players, 'staff' => $staff, 'warnDays' => $this->warnDays];
    }

    /** @param array<string, mixed> $input {seasonId, name, category, authTeam} */
    public function createTeam(array $input): array
    {
        $in = new Input($input);
        $seasonId = $in->int('seasonId', 1, PHP_INT_MAX, required: true, label: 'Sezona');
        $data = self::teamInput($in);
        if ($seasonId !== null && $this->repo->season($seasonId) === null) {
            $in->error('seasonId', 'Sezona neexistuje.');
        }
        $in->throwIfInvalid();

        return $this->team($this->repo->createTeam((int) $seasonId, $data));
    }

    /** @param array<string, mixed> $input */
    public function updateTeam(int $id, array $input): array
    {
        $this->teamOr404($id);
        $in = new Input($input);
        $data = self::teamInput($in);
        $in->throwIfInvalid();
        $this->repo->updateTeam($id, $data);

        return $this->team($id);
    }

    public function deleteTeam(int $id): void
    {
        $this->teamOr404($id);
        $this->repo->deleteTeam($id);
    }

    // --- members -------------------------------------------------------------

    /**
     * Adds someone to the team: an existing person (personId), a new one (person: {...}),
     * or a club account (account: {sub, name, email}) — the person linked to that account,
     * created and linked on first use.
     *
     * @param array<string, mixed> $input {kind, personId | person | account, staffRole?, jerseyNumber?}
     */
    public function addMember(int $teamId, array $input): array
    {
        $this->teamOr404($teamId);
        $in = new Input($input);
        $kind = $in->choice('kind', self::KINDS, 'Vyber, jestli jde o hráče, nebo člena realizačního týmu.');
        [$staffRole, $jersey] = self::memberInput($in, $kind);
        $personId = $in->int('personId', 1, PHP_INT_MAX, label: 'Osoba');
        $newPerson = null;
        $account = null;
        if ($personId === null && is_array($input['account'] ?? null)) {
            $account = $this->accountInput($input['account'], $in);
            $personId = $account !== null ? ($this->repo->personByAuthSub($account['sub'])['id'] ?? null) : null;
            if ($personId === null && $account !== null) {
                $newPerson = self::personFromAccount($account['name'], $account['email']);
            }
            if ($personId !== null && $kind !== null && $this->repo->memberExists($teamId, $personId, $kind)) {
                $in->error('personId', $kind === 'player' ? 'Už je v soupisce hráčů.' : 'Už je v realizačním týmu.');
            }
        } elseif ($personId === null) {
            if (!is_array($input['person'] ?? null)) {
                $in->error('personId', 'Vyber osobu, nebo vyplň novou.');
            } else {
                $newPerson = $this->personInput($input['person'], 'person.');
            }
        } elseif ($this->repo->person($personId) === null) {
            $in->error('personId', 'Osoba neexistuje.');
        } elseif ($kind !== null && $this->repo->memberExists($teamId, $personId, $kind)) {
            $in->error('personId', $kind === 'player' ? 'Už je v soupisce hráčů.' : 'Už je v realizačním týmu.');
        }
        $in->throwIfInvalid();

        if ($personId === null) {
            $personId = $this->repo->createPerson((array) $newPerson);
            if ($account !== null) {
                $this->repo->linkAccount($personId, $account['sub'], $account['label']);
            }
        }
        $this->repo->addMember($teamId, $personId, (string) $kind, $staffRole, $jersey);

        return $this->team($teamId);
    }

    /** @param array<string, mixed> $input {staffRole?, jerseyNumber?} */
    public function updateMember(int $id, array $input): array
    {
        $member = $this->repo->member($id) ?? throw HttpException::notFound('Člen týmu neexistuje.');
        $in = new Input($input);
        [$staffRole, $jersey] = self::memberInput($in, $member['kind']);
        $in->throwIfInvalid();
        $this->repo->updateMember($id, $staffRole, $jersey);

        return $this->team($member['teamId']);
    }

    public function removeMember(int $id): array
    {
        $member = $this->repo->member($id) ?? throw HttpException::notFound('Člen týmu neexistuje.');
        $this->repo->deleteMember($id);

        return $this->team($member['teamId']);
    }

    // --- people --------------------------------------------------------------

    /** @return list<array<string, mixed>> */
    public function people(?string $query): array
    {
        return $this->repo->people($query, 200);
    }

    /** @return array<string, mixed> person with memberships and licences */
    public function person(int $id): array
    {
        $person = $this->personOr404($id);

        return $person + [
            'memberships' => $this->repo->memberships($id),
            'licences' => $this->licenceStates($this->repo->licences([$id])),
            'warnDays' => $this->warnDays,
        ];
    }

    /** @param array<string, mixed> $input */
    public function createPerson(array $input): array
    {
        return $this->person($this->repo->createPerson($this->personInput($input)));
    }

    /** @param array<string, mixed> $input */
    public function updatePerson(int $id, array $input): array
    {
        $this->personOr404($id);
        $this->repo->updatePerson($id, $this->personInput($input));

        return $this->person($id);
    }

    public function deletePerson(int $id): void
    {
        $this->personOr404($id);
        $this->repo->deletePerson($id);
    }

    /**
     * Links the person to a club account (picked from the IdP's user search), or unlinks with sub = null.
     *
     * @param array<string, mixed> $input {sub, name, email}
     */
    public function linkAccount(int $id, array $input): array
    {
        $this->personOr404($id);
        $in = new Input($input);
        $sub = $in->text('sub', 64);
        if ($sub === null) {
            $this->repo->linkAccount($id, null, null);

            return $this->person($id);
        }
        $name = $in->text('name', 120) ?? '';
        $email = $in->text('email', 150);
        $other = $this->repo->personByAuthSub($sub);
        if ($other !== null && $other['id'] !== $id) {
            $in->error('sub', sprintf('Účet už je propojený s osobou %s %s.', $other['firstName'], $other['lastName']));
        }
        $in->throwIfInvalid();
        $this->repo->linkAccount($id, $sub, self::accountLabel($sub, $name, $email));

        return $this->person($id);
    }

    // --- licences ------------------------------------------------------------

    /** @param array<string, mixed> $input */
    public function addLicence(int $personId, array $input): array
    {
        $this->personOr404($personId);
        $this->repo->createLicence($personId, self::licenceInput($input));

        return $this->person($personId);
    }

    /** @param array<string, mixed> $input */
    public function updateLicence(int $id, array $input): array
    {
        $licence = $this->repo->licence($id) ?? throw HttpException::notFound('Licence neexistuje.');
        $this->repo->updateLicence($id, self::licenceInput($input));

        return $this->person($licence['personId']);
    }

    public function deleteLicence(int $id): array
    {
        $licence = $this->repo->licence($id) ?? throw HttpException::notFound('Licence neexistuje.');
        $this->repo->deleteLicence($id);

        return $this->person($licence['personId']);
    }

    /** @return array<string, mixed> */
    public function coaches(?int $seasonId): array
    {
        $seasons = $this->repo->seasons();
        $seasonId ??= self::currentSeasonId($seasons, $this->clock->now());
        if ($seasonId === null) {
            return ['season' => null, 'seasons' => [], 'warnDays' => $this->warnDays, 'summary' => null, 'coaches' => []];
        }
        $season = $this->seasonOr404($seasonId);
        $staff = $this->repo->staffInSeason($seasonId);
        $licences = $this->repo->licences(array_map(static fn (array $s): int => $s['person']['id'], $staff));

        return ['season' => $season, 'seasons' => $seasons]
            + CoachDashboard::compose($staff, $licences, $this->clock->now(), $this->warnDays);
    }

    // --- input ---------------------------------------------------------------

    /** @param mixed $data @return array{sub: string, name: string, email: ?string, label: string}|null */
    private function accountInput(mixed $data, Input $in): ?array
    {
        $account = new Input(is_array($data) ? $data : []);
        $sub = $account->text('sub', 64);
        $name = $account->text('name', 120);
        if ($sub === null || $name === null) {
            $in->error('personId', 'Vyber klubový účet ze seznamu.');

            return null;
        }
        $email = $account->text('email', 150);

        return ['sub' => $sub, 'name' => $name, 'email' => $email, 'label' => self::accountLabel($sub, $name, $email)];
    }

    /** "Jan Novák <jan@x.cz>" Pure. */
    public static function accountLabel(string $sub, string $name, ?string $email): string
    {
        $label = trim($name . ($email !== null && $email !== '' ? " <$email>" : ''));

        return mb_substr($label !== '' ? $label : $sub, 0, 150);
    }

    /**
     * A registry person from an account's display name: "Jan Novák" → Jan / Novák,
     * "Anna Marie Nová" → Anna Marie / Nová, a single word becomes the surname. Pure.
     *
     * @return array<string, ?string>
     */
    public static function personFromAccount(string $name, ?string $email): array
    {
        $parts = preg_split('/\s+/u', trim($name)) ?: [];
        $last = (string) array_pop($parts);
        $first = implode(' ', $parts);

        return [
            'firstName' => mb_substr($first !== '' ? $first : $last, 0, 60),
            'lastName' => mb_substr($last, 0, 60),
            'birthDate' => null,
            'facrId' => null,
            'email' => $email !== null && filter_var($email, FILTER_VALIDATE_EMAIL) ? mb_substr($email, 0, 150) : null,
            'phone' => null,
            'note' => null,
        ];
    }

    /** @param array<string, mixed> $input @return array{name: string, startsOn: string, endsOn: string} */
    private function seasonInput(array $input, ?int $id): array
    {
        $in = new Input($input);
        $name = $in->text('name', 20, required: true, label: 'Název sezony');
        $starts = $in->date('startsOn', required: true, label: 'Začátek');
        $ends = $in->date('endsOn', required: true, label: 'Konec');
        if ($starts && $ends && $ends <= $starts) {
            $in->error('endsOn', 'Konec musí být po začátku.');
        }
        if ($name !== null && $this->repo->seasonNameTaken($name, $id)) {
            $in->error('name', 'Sezona s tímto názvem už existuje.');
        }
        $in->throwIfInvalid();

        return ['name' => (string) $name, 'startsOn' => $starts->format('Y-m-d'), 'endsOn' => $ends->format('Y-m-d')];
    }

    /** @return array{name: string, category: ?string, authTeam: ?string} */
    private static function teamInput(Input $in): array
    {
        $name = $in->text('name', 80, required: true, label: 'Název týmu');
        $category = $in->text('category', 40, label: 'Kategorie');
        $authTeam = $in->text('authTeam', 50, label: 'Tým v klubovém účtu');
        if ($authTeam !== null && !preg_match('/^[a-z0-9][a-z0-9_-]*$/', $authTeam)) {
            $in->error('authTeam', 'Vyber tým z klubového účtu.');
        }

        return ['name' => (string) $name, 'category' => $category, 'authTeam' => $authTeam];
    }

    /** @return array{?string, ?int} staff role, jersey number */
    private static function memberInput(Input $in, ?string $kind): array
    {
        return $kind === 'staff'
            ? [$in->text('staffRole', 40, label: 'Funkce'), null]
            : [null, $in->int('jerseyNumber', 0, 99, label: 'Číslo dresu')];
    }

    /** @param array<string, mixed> $input @return array<string, ?string> */
    private function personInput(array $input, string $prefix = ''): array
    {
        $in = new Input($input);
        $data = [
            'firstName' => $in->text('firstName', 60, required: true, label: 'Jméno'),
            'lastName' => $in->text('lastName', 60, required: true, label: 'Příjmení'),
            'birthDate' => $in->date('birthDate', label: 'Datum narození')?->format('Y-m-d'),
            'facrId' => $in->text('facrId', 20, label: 'ID FAČR'),
            'email' => $in->text('email', 150, label: 'E-mail'),
            'phone' => $in->text('phone', 30, label: 'Telefon'),
            'note' => $in->text('note', 500, label: 'Poznámka'),
        ];
        if ($data['email'] !== null && !filter_var($data['email'], FILTER_VALIDATE_EMAIL)) {
            $in->error('email', 'Zadej platný e-mail.');
        }
        if ($data['birthDate'] !== null && $data['birthDate'] > $this->clock->now()->format('Y-m-d')) {
            $in->error('birthDate', 'Datum narození nemůže být v budoucnosti.');
        }
        if ($in->errors()) {
            $errors = [];
            foreach ($in->errors() as $field => $message) {
                $errors[$prefix . $field] = $message;
            }
            throw HttpException::validation($errors);
        }

        return $data;
    }

    /** @param array<string, mixed> $input @return array{type: string, number: ?string, issuedOn: ?string, validUntil: ?string, note: ?string} */
    private static function licenceInput(array $input): array
    {
        $in = new Input($input);
        $type = $in->text('type', 60, required: true, label: 'Typ licence');
        $number = $in->text('number', 40, label: 'Číslo licence');
        $issued = $in->date('issuedOn', label: 'Datum vydání');
        $until = $in->date('validUntil', label: 'Platnost do');
        if ($issued && $until && $until < $issued) {
            $in->error('validUntil', 'Platnost musí končit až po vydání.');
        }
        $note = $in->text('note', 255, label: 'Poznámka');
        $in->throwIfInvalid();

        return ['type' => (string) $type, 'number' => $number, 'issuedOn' => $issued?->format('Y-m-d'), 'validUntil' => $until?->format('Y-m-d'), 'note' => $note];
    }

    /** @param list<array<string, mixed>> $licences @return list<array<string, mixed>> */
    private function licenceStates(array $licences): array
    {
        $today = $this->clock->now();

        return array_map(fn (array $l): array => $l + LicenceStatus::of(
            $l['validUntil'] !== null ? new \DateTimeImmutable($l['validUntil']) : null,
            $today,
            $this->warnDays,
        )->toArray(), $licences);
    }

    private function seasonOr404(int $id): array
    {
        return $this->repo->season($id) ?? throw HttpException::notFound('Sezona neexistuje.');
    }

    private function teamOr404(int $id): array
    {
        return $this->repo->team($id) ?? throw HttpException::notFound('Tým neexistuje.');
    }

    private function personOr404(int $id): array
    {
        return $this->repo->person($id) ?? throw HttpException::notFound('Osoba neexistuje.');
    }
}
