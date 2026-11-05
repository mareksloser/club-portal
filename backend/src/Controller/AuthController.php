<?php

declare(strict_types=1);

namespace Portal\Controller;

use Portal\Http\Request;
use Portal\Http\Response;

final class AuthController
{
    public function __construct(
        private readonly string $issuer,
        private readonly string $clientId,
        private readonly string $clubName,
    ) {
    }

    /** Public: where the SPA should send users to sign in. Keeps the frontend build environment-agnostic. */
    public function config(Request $request): Response
    {
        return Response::json([
            'issuer' => rtrim($this->issuer, '/'),
            'clientId' => $this->clientId,
            'clubName' => $this->clubName,
        ]);
    }
}
