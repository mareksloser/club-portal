<?php

declare(strict_types=1);

use Portal\Controller\AuthController;
use Portal\Controller\DashboardController;
use Portal\Http\Router;

return static fn (Router $r): Router => $r
    ->add('GET', '/api/auth/config', [AuthController::class, 'config'])
    ->add('GET', '/api/dashboard', [DashboardController::class, 'show']);
