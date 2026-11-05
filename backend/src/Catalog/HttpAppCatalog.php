<?php

declare(strict_types=1);

namespace Portal\Catalog;

/**
 * Reads GET {issuer}/api/apps from team-auth with the user's own access token
 * (it needs the `apps` scope). The HTTP call is injectable, so this is testable offline.
 */
final class HttpAppCatalog implements AppCatalog
{
    /** @var \Closure(string, string): (array{int, string}|null) */
    private readonly \Closure $fetch;

    /** @param (\Closure(string $url, string $token): (array{int, string}|null))|null $fetch returns [status, body] or null on network failure */
    public function __construct(private readonly string $catalogUrl, ?\Closure $fetch = null)
    {
        $this->fetch = $fetch ?? self::httpGet(...);
    }

    public function appsFor(string $accessToken): array
    {
        $result = ($this->fetch)($this->catalogUrl, $accessToken);
        if ($result === null) {
            throw CatalogException::unavailable("cannot reach {$this->catalogUrl}");
        }
        [$status, $body] = $result;
        if ($status === 401) {
            throw CatalogException::tokenRejected();
        }
        if ($status === 403) {
            // The token is valid but lacks the `apps` scope: a client configuration problem, not the user's.
            throw CatalogException::unavailable('the access token has no `apps` scope (check the portal client in the IdP)');
        }
        $data = $status === 200 ? json_decode($body, true) : null;
        if (!is_array($data) || !is_array($data['apps'] ?? null)) {
            throw CatalogException::unavailable("unexpected answer from {$this->catalogUrl} (HTTP $status)");
        }

        return array_values(array_filter(array_map(AppTile::fromArray(...), $data['apps'])));
    }

    /** @return array{int, string}|null */
    private static function httpGet(string $url, string $token): ?array
    {
        $context = stream_context_create(['http' => [
            'timeout' => 5,
            'ignore_errors' => true, // read 4xx bodies instead of failing
            'header' => "Accept: application/json\r\nAuthorization: Bearer $token\r\n",
        ]]);
        $body = @file_get_contents($url, false, $context);
        if ($body === false) {
            error_log("[portal] cannot reach $url: " . (error_get_last()['message'] ?? 'unknown error'));
            return null;
        }
        $status = 0;
        foreach ($http_response_header ?? [] as $line) { // last status line wins (redirects)
            if (preg_match('#^HTTP/\S+\s+(\d{3})#', $line, $m)) {
                $status = (int) $m[1];
            }
        }

        return [$status, $body];
    }
}
