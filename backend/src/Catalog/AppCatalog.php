<?php

declare(strict_types=1);

namespace Portal\Catalog;

/** Source of the applications a user may open. The IdP is the only authority on permissions. */
interface AppCatalog
{
    /**
     * @param string $accessToken the user's access token (sent on to the IdP)
     * @return list<AppTile> in display order
     * @throws CatalogException
     */
    public function appsFor(string $accessToken): array;
}
