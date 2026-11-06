<?php

declare(strict_types=1);

namespace Portal\Club;

/**
 * Storage of the club registry. Rows are plain arrays in the API's camelCase shape;
 * dates are 'Y-m-d' strings. Implemented with PDO; tests can use an in-memory fake.
 *
 * @phpstan-type Season array{id: int, name: string, startsOn: string, endsOn: string, teamCount: int}
 * @phpstan-type Team array{id: int, seasonId: int, seasonName: string, name: string, category: ?string, authTeam: ?string, playerCount: int, staffCount: int}
 * @phpstan-type Person array{id: int, firstName: string, lastName: string, birthDate: ?string, facrId: ?string, email: ?string, phone: ?string, note: ?string, authSub: ?string, authName: ?string}
 * @phpstan-type Member array{id: int, teamId: int, kind: string, staffRole: ?string, jerseyNumber: ?int, person: Person}
 * @phpstan-type Licence array{id: int, personId: int, type: string, number: ?string, issuedOn: ?string, validUntil: ?string, note: ?string}
 */
interface ClubRepository
{
    /** @return list<Season> newest first */
    public function seasons(): array;
    /** @return Season|null */
    public function season(int $id): ?array;
    public function seasonNameTaken(string $name, ?int $exceptId): bool;
    /** @param array{name: string, startsOn: string, endsOn: string} $data */
    public function createSeason(array $data): int;
    /** @param array{name: string, startsOn: string, endsOn: string} $data */
    public function updateSeason(int $id, array $data): void;
    public function deleteSeason(int $id): void;
    /** Copies the teams of $from into $to, with their players and staff. */
    public function copyTeams(int $from, int $to): void;

    /** @return list<Team> */
    public function teams(int $seasonId): array;
    /** @return Team|null */
    public function team(int $id): ?array;
    /** @param array{name: string, category: ?string, authTeam: ?string} $data */
    public function createTeam(int $seasonId, array $data): int;
    /** @param array{name: string, category: ?string, authTeam: ?string} $data */
    public function updateTeam(int $id, array $data): void;
    public function deleteTeam(int $id): void;

    /** @return list<Member> players by jersey number then name, staff by name */
    public function members(int $teamId): array;
    /** @return array{id: int, teamId: int, personId: int, kind: string}|null */
    public function member(int $id): ?array;
    public function memberExists(int $teamId, int $personId, string $kind): bool;
    public function addMember(int $teamId, int $personId, string $kind, ?string $staffRole, ?int $jerseyNumber): int;
    public function updateMember(int $id, ?string $staffRole, ?int $jerseyNumber): void;
    public function deleteMember(int $id): void;

    /** @return list<Person> by last name; $query matches name, FAČR id or linked account */
    public function people(?string $query, int $limit): array;
    /** @return Person|null */
    public function person(int $id): ?array;
    /** @return Person|null */
    public function personByAuthSub(string $sub): ?array;
    /** @param array<string, ?string> $data first_name … note */
    public function createPerson(array $data): int;
    /** @param array<string, ?string> $data */
    public function updatePerson(int $id, array $data): void;
    public function deletePerson(int $id): void;
    public function linkAccount(int $id, ?string $sub, ?string $name): void;
    /** @return list<array{teamId: int, teamName: string, seasonId: int, seasonName: string, kind: string, staffRole: ?string, jerseyNumber: ?int}> newest season first */
    public function memberships(int $personId): array;

    /**
     * @param list<int> $personIds
     * @return list<Licence>
     */
    public function licences(array $personIds): array;
    /** @return Licence|null */
    public function licence(int $id): ?array;
    /** @param array{type: string, number: ?string, issuedOn: ?string, validUntil: ?string, note: ?string} $data */
    public function createLicence(int $personId, array $data): int;
    /** @param array{type: string, number: ?string, issuedOn: ?string, validUntil: ?string, note: ?string} $data */
    public function updateLicence(int $id, array $data): void;
    public function deleteLicence(int $id): void;

    /** @return list<array{person: Person, teamId: int, teamName: string, staffRole: ?string}> */
    public function staffInSeason(int $seasonId): array;
}
