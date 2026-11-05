<?php

declare(strict_types=1);

namespace Portal\Service;

use Portal\Auth\Member;
use Portal\Catalog\AppCatalog;
use Portal\Catalog\AppTile;
use Portal\Catalog\CatalogException;
use Portal\Http\HttpException;

/** Everything the portal's home screen shows for one member. */
final class DashboardService
{
    public function __construct(
        private readonly AppCatalog $catalog,
        private readonly string $issuer,
    ) {
    }

    /** @return array{member: array<string, mixed>, apps: list<array<string, mixed>>, links: array{account: string, admin: ?string}} */
    public function forMember(Member $member, string $accessToken): array
    {
        try {
            $apps = $this->catalog->appsFor($accessToken);
        } catch (CatalogException $e) {
            if ($e->isTokenRejected()) {
                throw HttpException::unauthorized('Přihlášení vypršelo, přihlaste se prosím znovu.');
            }
            error_log('[portal] app catalogue unavailable: ' . $e->getMessage());
            throw new HttpException('Seznam aplikací se teď nepodařilo načíst. Zkuste to za chvíli znovu.', 502);
        }

        return self::compose($member, $apps, rtrim($this->issuer, '/'));
    }

    /**
     * Pure: the response body.
     *
     * @param list<AppTile> $apps
     * @return array{member: array<string, mixed>, apps: list<array<string, mixed>>, links: array{account: string, admin: ?string}}
     */
    public static function compose(Member $member, array $apps, string $issuer): array
    {
        return [
            'member' => $member->toArray(),
            'apps' => array_map(static fn (AppTile $app): array => $app->toArray(), $apps),
            'links' => [
                'account' => $issuer . '/',
                'admin' => $member->isSuperadmin() ? $issuer . '/admin' : null,
            ],
        ];
    }
}
