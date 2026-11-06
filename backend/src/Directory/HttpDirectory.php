<?php

declare(strict_types=1);

namespace Portal\Directory;

/** Reads GET {issuer}/api/directory from team-auth. The HTTP call is injectable for tests. */
final class HttpDirectory implements Directory
{
    /** @var \Closure(string, string): (array{int, string}|null) */
    private readonly \Closure $fetch;

    /** @param (\Closure(string $url, string $token): (array{int, string}|null))|null $fetch returns [status, body] or null */
    public function __construct(private readonly string $url, ?\Closure $fetch = null)
    {
        $this->fetch = $fetch ?? self::httpGet(...);
    }

    public function load(string $accessToken): array
    {
        $result = ($this->fetch)($this->url, $accessToken);
        [$status, $body] = $result ?? [0, ''];
        $data = $status === 200 ? json_decode($body, true) : null;
        if (!is_array($data)) {
            throw new \RuntimeException("{$this->url} answered HTTP $status");
        }

        return self::parse($data);
    }

    /**
     * Pure, defensive.
     *
     * @param array<string, mixed> $data
     * @return array{teams: list<array{slug: string, name: string}>, roles: list<array{slug: string, description: ?string}>}
     */
    public static function parse(array $data): array
    {
        $teams = [];
        foreach (is_array($data['teams'] ?? null) ? $data['teams'] : [] as $t) {
            if (is_array($t) && is_string($t['slug'] ?? null)) {
                $teams[] = ['slug' => $t['slug'], 'name' => is_string($t['name'] ?? null) ? $t['name'] : $t['slug']];
            }
        }
        $roles = [];
        foreach (is_array($data['roles'] ?? null) ? $data['roles'] : [] as $r) {
            if (is_array($r) && is_string($r['slug'] ?? null)) {
                $roles[] = ['slug' => $r['slug'], 'description' => is_string($r['description'] ?? null) ? $r['description'] : null];
            }
        }

        return ['teams' => $teams, 'roles' => $roles];
    }

    /** @return array{int, string}|null */
    private static function httpGet(string $url, string $token): ?array
    {
        $context = stream_context_create(['http' => [
            'timeout' => 5,
            'ignore_errors' => true,
            'header' => "Accept: application/json\r\nAuthorization: Bearer $token\r\n",
        ]]);
        $body = @file_get_contents($url, false, $context);
        if ($body === false) {
            error_log("[portal] cannot reach $url: " . (error_get_last()['message'] ?? 'unknown error'));
            return null;
        }
        $status = 0;
        foreach ($http_response_header ?? [] as $line) {
            if (preg_match('#^HTTP/\S+\s+(\d{3})#', $line, $m)) {
                $status = (int) $m[1];
            }
        }

        return [$status, $body];
    }
}
