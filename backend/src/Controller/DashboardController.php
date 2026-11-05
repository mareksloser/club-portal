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

    /** Anonymous visitors get the public links; signed-in members what their rules allow. */
    public function show(Request $request): Response
    {
        $member = $this->auth->member($request);

        return Response::json($this->dashboard->forVisitor($member, $this->auth->isEditor($member)))
            ->withHeaders(['Cache-Control' => 'private, no-store']);
    }
}
