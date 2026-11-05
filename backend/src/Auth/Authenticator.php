<?php

declare(strict_types=1);

namespace Portal\Auth;

use Portal\Auth\Oidc\TokenVerifier;
use Portal\Http\HttpException;
use Portal\Http\Request;

/**
 * Resolves the bearer token (an access token from the club IdP) to a Member.
 * Editors are members with the portal role `admin` (EDITOR_ROLE) or the global `superadmin`.
 */
final class Authenticator
{
    /** @var array<string, ?Member> per-request memo */
    private array $resolved = [];

    public function __construct(
        private readonly TokenVerifier $verifier,
        private readonly ClaimsMapper $mapper,
        private readonly string $editorRole = 'admin',
    ) {
    }

    /** null = anonymous visitor (no token). An invalid token is a 401, so the SPA ends the session. */
    public function member(Request $request): ?Member
    {
        $token = $request->bearerToken();
        if ($token === null) {
            return null;
        }
        $member = $this->resolved[$token] ??= $this->resolve($token);

        return $member ?? throw HttpException::unauthorized('Přihlášení vypršelo, přihlaste se prosím znovu.');
    }

    public function requireMember(Request $request): Member
    {
        return $this->member($request) ?? throw HttpException::unauthorized('Přihlaste se.');
    }

    public function requireEditor(Request $request): Member
    {
        $member = $this->requireMember($request);
        if (!$this->isEditor($member)) {
            throw HttpException::forbidden('Rozcestník mohou upravovat jen jeho správci.');
        }

        return $member;
    }

    public function isEditor(?Member $member): bool
    {
        return $member !== null && ($member->isSuperadmin() || $member->hasRole($this->editorRole));
    }

    private function resolve(string $token): ?Member
    {
        $claims = $this->verifier->verify($token);

        return $claims === null ? null : $this->mapper->map($claims);
    }
}
