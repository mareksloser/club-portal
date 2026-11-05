<?php

declare(strict_types=1);

namespace Portal\Auth;

/** A signed-in club member, as the club IdP describes them in the access token. */
final class Member
{
    /**
     * @param list<array{slug: string, name: string, membership: string}> $teams
     * @param list<string> $roles       portal roles: "admin", "coach@u11"
     * @param list<string> $globalRoles e.g. "superadmin"
     */
    public function __construct(
        public readonly string $sub,
        public readonly string $name,
        public readonly ?string $email,
        public readonly array $teams,
        public readonly array $roles,
        public readonly array $globalRoles,
    ) {
    }

    public function isSuperadmin(): bool
    {
        return in_array('superadmin', $this->globalRoles, true);
    }

    /** Whether the member holds $role, for $team or (when $team is null) for any team or the whole club. */
    public function hasRole(string $role, ?string $team = null): bool
    {
        foreach ($this->roles as $claim) {
            [$slug, $scope] = array_pad(explode('@', $claim, 2), 2, null);
            if ($slug !== $role) {
                continue;
            }
            // A role without @team applies to every team.
            if ($team === null || $scope === null || $scope === $team) {
                return true;
            }
        }

        return false;
    }

    /** Membership in $team (null = any team), optionally of a given kind (player, coach, parent, staff). */
    public function isInTeam(?string $team, ?string $membership = null): bool
    {
        foreach ($this->teams as $t) {
            if (($team === null || $t['slug'] === $team) && ($membership === null || $t['membership'] === $membership)) {
                return true;
            }
        }

        return false;
    }

    /** @return array<string, mixed> */
    public function toArray(): array
    {
        return [
            'sub' => $this->sub,
            'name' => $this->name,
            'email' => $this->email,
            'teams' => $this->teams,
        ];
    }
}
