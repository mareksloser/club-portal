<?php

declare(strict_types=1);

namespace Portal\Club;

final class PdoClubRepository implements ClubRepository
{
    private const PERSON = 'p.id AS p_id, p.first_name, p.last_name, p.birth_date, p.facr_id, p.email, p.phone, p.note, p.auth_sub, p.auth_name';

    public function __construct(private readonly \PDO $pdo)
    {
    }

    // --- seasons -------------------------------------------------------------

    public function seasons(): array
    {
        $rows = $this->pdo->query(
            'SELECT s.*, (SELECT COUNT(*) FROM teams t WHERE t.season_id = s.id) AS team_count
             FROM seasons s ORDER BY s.starts_on DESC, s.id DESC',
        )->fetchAll();

        return array_map(self::season_(...), $rows);
    }

    public function season(int $id): ?array
    {
        $row = $this->one('SELECT s.*, (SELECT COUNT(*) FROM teams t WHERE t.season_id = s.id) AS team_count FROM seasons s WHERE s.id = ?', [$id]);

        return $row ? self::season_($row) : null;
    }

    public function seasonNameTaken(string $name, ?int $exceptId): bool
    {
        return (bool) $this->one('SELECT 1 FROM seasons WHERE name = ? AND id <> ?', [$name, $exceptId ?? 0]);
    }

    public function createSeason(array $data): int
    {
        $this->run('INSERT INTO seasons (name, starts_on, ends_on) VALUES (?, ?, ?)', [$data['name'], $data['startsOn'], $data['endsOn']]);

        return (int) $this->pdo->lastInsertId();
    }

    public function updateSeason(int $id, array $data): void
    {
        $this->run('UPDATE seasons SET name = ?, starts_on = ?, ends_on = ? WHERE id = ?', [$data['name'], $data['startsOn'], $data['endsOn'], $id]);
    }

    public function deleteSeason(int $id): void
    {
        $this->run('DELETE FROM seasons WHERE id = ?', [$id]);
    }

    public function copyTeams(int $from, int $to): void
    {
        $this->transaction(function () use ($from, $to): void {
            $teams = $this->all('SELECT id, name, category, auth_team, sort_order FROM teams WHERE season_id = ? ORDER BY sort_order, id', [$from]);
            foreach ($teams as $team) {
                $this->run('INSERT INTO teams (season_id, name, category, auth_team, sort_order) VALUES (?, ?, ?, ?, ?)', [$to, $team['name'], $team['category'], $team['auth_team'], $team['sort_order']]);
                $this->run(
                    'INSERT INTO team_members (team_id, person_id, kind, staff_role, jersey_number)
                     SELECT ?, person_id, kind, staff_role, jersey_number FROM team_members WHERE team_id = ?',
                    [(int) $this->pdo->lastInsertId(), $team['id']],
                );
            }
        });
    }

    // --- teams ---------------------------------------------------------------

    private const TEAM = "SELECT t.*, s.name AS season_name,
            (SELECT COUNT(*) FROM team_members m WHERE m.team_id = t.id AND m.kind = 'player') AS player_count,
            (SELECT COUNT(*) FROM team_members m WHERE m.team_id = t.id AND m.kind = 'staff') AS staff_count
        FROM teams t JOIN seasons s ON s.id = t.season_id";

    public function teams(int $seasonId): array
    {
        return array_map(self::team_(...), $this->all(self::TEAM . ' WHERE t.season_id = ? ORDER BY t.sort_order, t.name', [$seasonId]));
    }

    public function team(int $id): ?array
    {
        $row = $this->one(self::TEAM . ' WHERE t.id = ?', [$id]);

        return $row ? self::team_($row) : null;
    }

    public function createTeam(int $seasonId, array $data): int
    {
        $next = (int) $this->one('SELECT COALESCE(MAX(sort_order) + 1, 0) AS n FROM teams WHERE season_id = ?', [$seasonId])['n'];
        $this->run('INSERT INTO teams (season_id, name, category, auth_team, sort_order) VALUES (?, ?, ?, ?, ?)', [$seasonId, $data['name'], $data['category'], $data['authTeam'], $next]);

        return (int) $this->pdo->lastInsertId();
    }

    public function updateTeam(int $id, array $data): void
    {
        $this->run('UPDATE teams SET name = ?, category = ?, auth_team = ? WHERE id = ?', [$data['name'], $data['category'], $data['authTeam'], $id]);
    }

    public function deleteTeam(int $id): void
    {
        $this->run('DELETE FROM teams WHERE id = ?', [$id]);
    }

    // --- members -------------------------------------------------------------

    public function members(int $teamId): array
    {
        $rows = $this->all(
            'SELECT m.id, m.team_id, m.kind, m.staff_role, m.jersey_number, ' . self::PERSON . '
             FROM team_members m JOIN people p ON p.id = m.person_id
             WHERE m.team_id = ?
             ORDER BY m.kind, m.jersey_number IS NULL, m.jersey_number, p.last_name, p.first_name',
            [$teamId],
        );

        return array_map(static fn (array $r): array => [
            'id' => (int) $r['id'],
            'teamId' => (int) $r['team_id'],
            'kind' => (string) $r['kind'],
            'staffRole' => $r['staff_role'],
            'jerseyNumber' => $r['jersey_number'] !== null ? (int) $r['jersey_number'] : null,
            'person' => self::person_($r),
        ], $rows);
    }

    public function member(int $id): ?array
    {
        $row = $this->one('SELECT id, team_id, person_id, kind FROM team_members WHERE id = ?', [$id]);

        return $row ? ['id' => (int) $row['id'], 'teamId' => (int) $row['team_id'], 'personId' => (int) $row['person_id'], 'kind' => (string) $row['kind']] : null;
    }

    public function memberExists(int $teamId, int $personId, string $kind): bool
    {
        return (bool) $this->one('SELECT 1 FROM team_members WHERE team_id = ? AND person_id = ? AND kind = ?', [$teamId, $personId, $kind]);
    }

    public function addMember(int $teamId, int $personId, string $kind, ?string $staffRole, ?int $jerseyNumber): int
    {
        $this->run('INSERT INTO team_members (team_id, person_id, kind, staff_role, jersey_number) VALUES (?, ?, ?, ?, ?)', [$teamId, $personId, $kind, $staffRole, $jerseyNumber]);

        return (int) $this->pdo->lastInsertId();
    }

    public function updateMember(int $id, ?string $staffRole, ?int $jerseyNumber): void
    {
        $this->run('UPDATE team_members SET staff_role = ?, jersey_number = ? WHERE id = ?', [$staffRole, $jerseyNumber, $id]);
    }

    public function deleteMember(int $id): void
    {
        $this->run('DELETE FROM team_members WHERE id = ?', [$id]);
    }

    // --- people --------------------------------------------------------------

    public function people(?string $query, int $limit): array
    {
        $sql = 'SELECT ' . self::PERSON . ' FROM people p';
        $params = [];
        if ($query !== null && trim($query) !== '') {
            $like = '%' . addcslashes(trim($query), '%_\\') . '%';
            $sql .= " WHERE CONCAT(p.first_name, ' ', p.last_name) LIKE ? OR CONCAT(p.last_name, ' ', p.first_name) LIKE ? OR p.facr_id LIKE ? OR p.auth_name LIKE ?";
            $params = [$like, $like, $like, $like];
        }
        $sql .= ' ORDER BY p.last_name, p.first_name LIMIT ' . max(1, min($limit, 500));

        return array_map(self::person_(...), $this->all($sql, $params));
    }

    public function person(int $id): ?array
    {
        $row = $this->one('SELECT ' . self::PERSON . ' FROM people p WHERE p.id = ?', [$id]);

        return $row ? self::person_($row) : null;
    }

    public function personByAuthSub(string $sub): ?array
    {
        $row = $this->one('SELECT ' . self::PERSON . ' FROM people p WHERE p.auth_sub = ?', [$sub]);

        return $row ? self::person_($row) : null;
    }

    public function createPerson(array $data): int
    {
        $this->run(
            'INSERT INTO people (first_name, last_name, birth_date, facr_id, email, phone, note) VALUES (?, ?, ?, ?, ?, ?, ?)',
            self::personValues($data),
        );

        return (int) $this->pdo->lastInsertId();
    }

    public function updatePerson(int $id, array $data): void
    {
        $this->run(
            'UPDATE people SET first_name = ?, last_name = ?, birth_date = ?, facr_id = ?, email = ?, phone = ?, note = ? WHERE id = ?',
            [...self::personValues($data), $id],
        );
    }

    public function deletePerson(int $id): void
    {
        $this->run('DELETE FROM people WHERE id = ?', [$id]);
    }

    public function linkAccount(int $id, ?string $sub, ?string $name): void
    {
        $this->run('UPDATE people SET auth_sub = ?, auth_name = ? WHERE id = ?', [$sub, $name, $id]);
    }

    public function memberships(int $personId): array
    {
        $rows = $this->all(
            'SELECT m.kind, m.staff_role, m.jersey_number, t.id AS team_id, t.name AS team_name, s.id AS season_id, s.name AS season_name
             FROM team_members m JOIN teams t ON t.id = m.team_id JOIN seasons s ON s.id = t.season_id
             WHERE m.person_id = ? ORDER BY s.starts_on DESC, t.sort_order',
            [$personId],
        );

        return array_map(static fn (array $r): array => [
            'teamId' => (int) $r['team_id'],
            'teamName' => (string) $r['team_name'],
            'seasonId' => (int) $r['season_id'],
            'seasonName' => (string) $r['season_name'],
            'kind' => (string) $r['kind'],
            'staffRole' => $r['staff_role'],
            'jerseyNumber' => $r['jersey_number'] !== null ? (int) $r['jersey_number'] : null,
        ], $rows);
    }

    // --- licences ------------------------------------------------------------

    public function licences(array $personIds): array
    {
        $ids = array_values(array_unique(array_map('intval', $personIds)));
        if ($ids === []) {
            return [];
        }
        $marks = implode(',', array_fill(0, count($ids), '?'));
        $rows = $this->all("SELECT * FROM licences WHERE person_id IN ($marks) ORDER BY valid_until IS NULL DESC, valid_until DESC, id", $ids);

        return array_map(self::licence_(...), $rows);
    }

    public function licence(int $id): ?array
    {
        $row = $this->one('SELECT * FROM licences WHERE id = ?', [$id]);

        return $row ? self::licence_($row) : null;
    }

    public function createLicence(int $personId, array $data): int
    {
        $this->run('INSERT INTO licences (person_id, type, number, issued_on, valid_until, note) VALUES (?, ?, ?, ?, ?, ?)', [$personId, ...self::licenceValues($data)]);

        return (int) $this->pdo->lastInsertId();
    }

    public function updateLicence(int $id, array $data): void
    {
        $this->run('UPDATE licences SET type = ?, number = ?, issued_on = ?, valid_until = ?, note = ? WHERE id = ?', [...self::licenceValues($data), $id]);
    }

    public function deleteLicence(int $id): void
    {
        $this->run('DELETE FROM licences WHERE id = ?', [$id]);
    }

    public function staffInSeason(int $seasonId): array
    {
        $rows = $this->all(
            "SELECT m.staff_role, t.id AS team_id, t.name AS team_name, " . self::PERSON . "
             FROM team_members m JOIN teams t ON t.id = m.team_id JOIN people p ON p.id = m.person_id
             WHERE t.season_id = ? AND m.kind = 'staff'
             ORDER BY p.last_name, p.first_name, t.sort_order",
            [$seasonId],
        );

        return array_map(static fn (array $r): array => [
            'person' => self::person_($r),
            'teamId' => (int) $r['team_id'],
            'teamName' => (string) $r['team_name'],
            'staffRole' => $r['staff_role'],
        ], $rows);
    }

    // --- helpers -------------------------------------------------------------

    /** @param list<mixed> $params */
    private function run(string $sql, array $params): void
    {
        $this->pdo->prepare($sql)->execute($params);
    }

    /** @param list<mixed> $params @return array<string, mixed>|null */
    private function one(string $sql, array $params): ?array
    {
        $stmt = $this->pdo->prepare($sql);
        $stmt->execute($params);
        $row = $stmt->fetch(\PDO::FETCH_ASSOC);

        return $row ?: null;
    }

    /** @param list<mixed> $params @return list<array<string, mixed>> */
    private function all(string $sql, array $params): array
    {
        $stmt = $this->pdo->prepare($sql);
        $stmt->execute($params);

        return $stmt->fetchAll(\PDO::FETCH_ASSOC);
    }

    private function transaction(callable $work): void
    {
        $this->pdo->beginTransaction();
        try {
            $work();
            $this->pdo->commit();
        } catch (\Throwable $e) {
            $this->pdo->rollBack();
            throw $e;
        }
    }

    /** @param array<string, mixed> $r */
    private static function season_(array $r): array
    {
        return ['id' => (int) $r['id'], 'name' => (string) $r['name'], 'startsOn' => (string) $r['starts_on'], 'endsOn' => (string) $r['ends_on'], 'teamCount' => (int) ($r['team_count'] ?? 0)];
    }

    /** @param array<string, mixed> $r */
    private static function team_(array $r): array
    {
        return [
            'id' => (int) $r['id'],
            'seasonId' => (int) $r['season_id'],
            'seasonName' => (string) $r['season_name'],
            'name' => (string) $r['name'],
            'category' => $r['category'],
            'authTeam' => $r['auth_team'],
            'playerCount' => (int) $r['player_count'],
            'staffCount' => (int) $r['staff_count'],
        ];
    }

    /** @param array<string, mixed> $r */
    private static function person_(array $r): array
    {
        return [
            'id' => (int) $r['p_id'],
            'firstName' => (string) $r['first_name'],
            'lastName' => (string) $r['last_name'],
            'birthDate' => $r['birth_date'],
            'facrId' => $r['facr_id'],
            'email' => $r['email'],
            'phone' => $r['phone'],
            'note' => $r['note'],
            'authSub' => $r['auth_sub'],
            'authName' => $r['auth_name'],
        ];
    }

    /** @param array<string, mixed> $r */
    private static function licence_(array $r): array
    {
        return [
            'id' => (int) $r['id'],
            'personId' => (int) $r['person_id'],
            'type' => (string) $r['type'],
            'number' => $r['number'],
            'issuedOn' => $r['issued_on'],
            'validUntil' => $r['valid_until'],
            'note' => $r['note'],
        ];
    }

    /** @param array<string, ?string> $d @return list<?string> */
    private static function personValues(array $d): array
    {
        return [$d['firstName'], $d['lastName'], $d['birthDate'], $d['facrId'], $d['email'], $d['phone'], $d['note']];
    }

    /** @param array<string, ?string> $d @return list<?string> */
    private static function licenceValues(array $d): array
    {
        return [$d['type'], $d['number'], $d['issuedOn'], $d['validUntil'], $d['note']];
    }
}
