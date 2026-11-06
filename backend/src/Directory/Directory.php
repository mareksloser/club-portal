<?php

declare(strict_types=1);

namespace Portal\Directory;

/** The club's teams and the portal's roles, for the link editor's choices. Source: the club IdP. */
interface Directory
{
    /**
     * @param string $accessToken the editor's own access token (scope `roles`)
     * @return array{teams: list<array{slug: string, name: string}>, roles: list<array{slug: string, description: ?string}>}
     * @throws \RuntimeException when the IdP can't be asked
     */
    public function load(string $accessToken): array;
}
