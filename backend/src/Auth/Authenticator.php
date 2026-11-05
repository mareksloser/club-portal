<?php

declare(strict_types=1);

namespace Portal\Auth;

use Portal\Auth\Oidc\TokenVerifier;
use Portal\Http\HttpException;
use Portal\Http\Request;

/**
 * Resolves the bearer token (an access token from the club IdP) to a Member.
 * Every club account may use the portal; there is no "no access" case here.
 */
final class Authenticator
{
    /** @var array<string, ?Member> per-request memo */
    private array $resolved = [];

    public function __construct(
        private readonly TokenVerifier $verifier,
        private readonly ClaimsMapper $mapper,
    ) {
    }

    public function requireMember(Request $request): Member
    {
        $token = $request->bearerToken();
        $member = $token === null ? null : ($this->resolved[$token] ??= $this->resolve($token));

        return $member ?? throw HttpException::unauthorized('Přihlášení vypršelo, přihlaste se prosím znovu.');
    }

    private function resolve(string $token): ?Member
    {
        $claims = $this->verifier->verify($token);

        return $claims === null ? null : $this->mapper->map($claims);
    }
}
