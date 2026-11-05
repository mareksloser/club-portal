<?php

declare(strict_types=1);

namespace Portal\Catalog;

/** One application the user may open, as listed by the IdP catalogue. */
final class AppTile
{
    /** @param list<array{role: string, team: ?string, teamName: ?string}> $roles */
    public function __construct(
        public readonly string $clientId,
        public readonly string $name,
        public readonly ?string $description,
        public readonly string $url,
        public readonly ?string $logoUrl,
        public readonly ?string $accentColor,
        public readonly array $roles,
        public readonly string $access,
    ) {
    }

    /**
     * Defensive parsing of one catalogue entry. Pure. Returns null for anything unusable:
     * the URLs end up in href/src attributes, so only http(s) is accepted.
     *
     * @param mixed $data
     */
    public static function fromArray(mixed $data): ?self
    {
        if (!is_array($data)) {
            return null;
        }
        $clientId = self::string($data['clientId'] ?? null);
        $name = self::string($data['name'] ?? null);
        $url = self::httpUrl($data['url'] ?? null);
        if ($clientId === null || $name === null || $url === null) {
            return null;
        }

        $roles = [];
        foreach (is_array($data['roles'] ?? null) ? $data['roles'] : [] as $role) {
            $slug = is_array($role) ? self::string($role['role'] ?? null) : null;
            if ($slug !== null) {
                $roles[] = ['role' => $slug, 'team' => self::string($role['team'] ?? null), 'teamName' => self::string($role['teamName'] ?? null)];
            }
        }

        $accent = self::string($data['accentColor'] ?? null);
        $access = self::string($data['access'] ?? null);

        return new self(
            $clientId,
            $name,
            self::string($data['description'] ?? null),
            $url,
            self::httpUrl($data['logoUrl'] ?? null),
            $accent !== null && preg_match('/^#[0-9a-fA-F]{6}$/', $accent) ? strtolower($accent) : null,
            $roles,
            in_array($access, ['role', 'public', 'superadmin'], true) ? $access : 'role',
        );
    }

    /** @return array<string, mixed> */
    public function toArray(): array
    {
        return [
            'clientId' => $this->clientId,
            'name' => $this->name,
            'description' => $this->description,
            'url' => $this->url,
            'logoUrl' => $this->logoUrl,
            'accentColor' => $this->accentColor,
            'roles' => $this->roles,
            'access' => $this->access,
        ];
    }

    private static function string(mixed $value): ?string
    {
        return is_string($value) && trim($value) !== '' ? trim($value) : null;
    }

    private static function httpUrl(mixed $value): ?string
    {
        $value = self::string($value);
        if ($value === null) {
            return null;
        }
        $scheme = strtolower((string) parse_url($value, PHP_URL_SCHEME));

        return in_array($scheme, ['http', 'https'], true) && parse_url($value, PHP_URL_HOST) ? $value : null;
    }
}
