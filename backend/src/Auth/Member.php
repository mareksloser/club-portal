<?php

declare(strict_types=1);

namespace Portal\Auth;

/** A signed-in club member, as the club IdP describes them in the access token. */
final class Member
{
    /**
     * @param list<array{slug: string, name: string, membership: string}> $teams
     * @param list<string> $globalRoles
     */
    public function __construct(
        public readonly string $sub,
        public readonly string $name,
        public readonly ?string $email,
        public readonly array $teams,
        public readonly array $globalRoles,
    ) {
    }

    public function isSuperadmin(): bool
    {
        return in_array('superadmin', $this->globalRoles, true);
    }

    /** @return array<string, mixed> */
    public function toArray(): array
    {
        return [
            'sub' => $this->sub,
            'name' => $this->name,
            'email' => $this->email,
            'teams' => $this->teams,
            'superadmin' => $this->isSuperadmin(),
        ];
    }
}
