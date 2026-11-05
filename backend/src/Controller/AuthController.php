<?php

declare(strict_types=1);

namespace Portal\Controller;

use Portal\Http\Request;
use Portal\Http\Response;

final class AuthController
{
    /** @param array{lat: float, lon: float}|null $weather */
    public function __construct(
        private readonly string $issuer,
        private readonly string $clientId,
        private readonly string $clubName,
        private readonly ?array $weather,
    ) {
    }

    /** Public: where to sign in and what the page shows before anyone signs in. */
    public function config(Request $request): Response
    {
        return Response::json([
            'issuer' => rtrim($this->issuer, '/'),
            'clientId' => $this->clientId,
            'clubName' => $this->clubName,
            'weather' => $this->weather,
        ]);
    }
}
