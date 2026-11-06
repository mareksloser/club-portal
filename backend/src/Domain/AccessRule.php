<?php

declare(strict_types=1);

namespace Portal\Domain;

use Portal\Auth\Member;

/**
 * Who may see a link. One rule per link; pure, no I/O.
 *
 *   public   – everyone, also without signing in
 *   members  – every signed-in club member
 *   team     – members of a team (team = null: any team), optionally only players / coaches / parents / staff
 *   role     – holders of a portal role from the IdP (e.g. vybor), optionally limited to a team
 *   editors  – only the portal's editors
 */
final class AccessRule
{
    public const TYPES = ['public', 'members', 'team', 'role', 'editors'];
    public const MEMBERSHIPS = ['player', 'coach', 'parent', 'staff'];

    private function __construct(
        public readonly string $type,
        public readonly ?string $team = null,
        /** membership for `team`, role slug for `role` */
        public readonly ?string $value = null,
    ) {
    }

    /** From trusted storage (the database). Unknown values fall back to the safest rule. */
    public static function fromStorage(string $type, ?string $team, ?string $value): self
    {
        return in_array($type, self::TYPES, true) ? new self($type, $team, $value) : new self('editors');
    }

    /**
     * From user input.
     *
     * @param array<string, mixed> $input {type, team?, value?}
     * @param array<string, string> $errors filled with field => message
     */
    public static function fromInput(array $input, array &$errors): self
    {
        $type = is_string($input['type'] ?? null) ? $input['type'] : '';
        $team = self::slug($input['team'] ?? null);
        $value = self::slug($input['value'] ?? null);

        switch ($type) {
            case 'public':
            case 'members':
            case 'editors':
                return new self($type);
            case 'team':
                if ($value !== null && !in_array($value, self::MEMBERSHIPS, true)) {
                    $errors['access.value'] = 'Neznámý typ členství.';
                }
                if ($team === null && $value === null) {
                    $errors['access.team'] = 'Vyber tým, nebo typ členství (např. trenéři všech týmů).';
                }
                return new self('team', $team, $value);
            case 'role':
                if ($value === null) {
                    $errors['access.value'] = 'Vyber roli.';
                }
                return new self('role', $team, $value);
            default:
                $errors['access.type'] = 'Vyber, kdo odkaz uvidí.';
                return new self('editors');
        }
    }

    public function allows(?Member $member, bool $isEditor): bool
    {
        if ($isEditor) {
            return true; // editors see (and manage) everything
        }

        return match ($this->type) {
            'public' => true,
            'members' => $member !== null,
            'team' => $member !== null && $member->isInTeam($this->team, $this->value),
            'role' => $member !== null && $this->value !== null && $member->hasRole($this->value, $this->team),
            default => false,
        };
    }

    /** @return array{type: string, team: ?string, value: ?string} */
    public function toArray(): array
    {
        return ['type' => $this->type, 'team' => $this->team, 'value' => $this->value];
    }

    private static function slug(mixed $value): ?string
    {
        if (!is_string($value) || trim($value) === '') {
            return null;
        }
        $value = strtolower(trim($value));

        return preg_match('/^[a-z0-9][a-z0-9_-]{0,49}$/', $value) ? $value : null;
    }
}
