<?php

declare(strict_types=1);

namespace Portal\Controller;

use Portal\Auth\Authenticator;
use Portal\Http\Request;
use Portal\Http\Response;
use Portal\Service\DashboardService;

final class DashboardController
{
    public function __construct(
        private readonly Authenticator $auth,
        private readonly DashboardService $dashboard,
    ) {
    }

    public function show(Request $request): Response
    {
        $member = $this->auth->requireMember($request);

        return Response::json($this->dashboard->forMember($member, (string) $request->bearerToken()))
            ->withHeaders(['Cache-Control' => 'private, no-store']);
    }
}
