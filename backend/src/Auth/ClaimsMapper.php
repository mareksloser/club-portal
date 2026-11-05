<?php

declare(strict_types=1);

namespace Portal\Auth;

/** Access-token claims from the club IdP → Member. Pure, no I/O. */
final class ClaimsMapper
{
    /** @param array<string, mixed> $claims verified claims (sub is guaranteed) */
    public function map(array $claims): Member
    {
        $email = trim((string) ($claims['email'] ?? ''));
        $name = trim((string) ($claims['name'] ?? $claims['preferred_username'] ?? ''));

        $teams = [];
        foreach (is_array($claims['teams'] ?? null) ? $claims['teams'] : [] as $team) {
            if (!is_array($team) || !is_string($team['slug'] ?? null) || $team['slug'] === '') {
                continue;
            }
            $teams[] = [
                'slug' => $team['slug'],
                'name' => is_string($team['name'] ?? null) && $team['name'] !== '' ? $team['name'] : $team['slug'],
                'membership' => is_string($team['membership'] ?? null) ? $team['membership'] : 'player',
            ];
        }

        return new Member(
            (string) $claims['sub'],
            mb_substr($name !== '' ? $name : $email, 0, 120),
            $email !== '' ? $email : null,
            $teams,
            self::strings($claims['roles'] ?? []),
            self::strings($claims['global_roles'] ?? []),
        );
    }

    /** @return list<string> */
    private static function strings(mixed $value): array
    {
        return is_array($value) ? array_values(array_filter($value, 'is_string')) : [];
    }
}
