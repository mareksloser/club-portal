<?php

declare(strict_types=1);

use Portal\Controller\AuthController;
use Portal\Controller\DashboardController;
use Portal\Controller\EditorController;
use Portal\Http\Router;

// Full paths; fixed segments (…/order) come before {id} so they win.
return static fn (Router $r): Router => $r
    ->add('GET', '/auth/config', [AuthController::class, 'config'])
    ->add('GET', '/dashboard', [DashboardController::class, 'show'])

    ->add('GET', '/directory', [EditorController::class, 'directory'])
    ->add('POST', '/sections', [EditorController::class, 'createSection'])
    ->add('PUT', '/sections/order', [EditorController::class, 'reorderSections'])
    ->add('PUT', '/sections/{id}', [EditorController::class, 'updateSection'])
    ->add('DELETE', '/sections/{id}', [EditorController::class, 'deleteSection'])
    ->add('PUT', '/sections/{id}/links/order', [EditorController::class, 'reorderLinks'])
    ->add('POST', '/links', [EditorController::class, 'createLink'])
    ->add('PUT', '/links/{id}', [EditorController::class, 'updateLink'])
    ->add('DELETE', '/links/{id}', [EditorController::class, 'deleteLink']);
