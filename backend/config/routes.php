<?php

declare(strict_types=1);

use Portal\Controller\AuthController;
use Portal\Controller\ClubController;
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
    ->add('DELETE', '/links/{id}', [EditorController::class, 'deleteLink'])

    // Club registry (editors)
    ->add('GET', '/club/seasons', [ClubController::class, 'seasons'])
    ->add('POST', '/club/seasons', [ClubController::class, 'createSeason'])
    ->add('GET', '/club/seasons/{id}', [ClubController::class, 'season'])
    ->add('PUT', '/club/seasons/{id}', [ClubController::class, 'updateSeason'])
    ->add('DELETE', '/club/seasons/{id}', [ClubController::class, 'deleteSeason'])
    ->add('POST', '/club/teams', [ClubController::class, 'createTeam'])
    ->add('GET', '/club/teams/{id}', [ClubController::class, 'team'])
    ->add('PUT', '/club/teams/{id}', [ClubController::class, 'updateTeam'])
    ->add('DELETE', '/club/teams/{id}', [ClubController::class, 'deleteTeam'])
    ->add('POST', '/club/teams/{id}/members', [ClubController::class, 'addMember'])
    ->add('PUT', '/club/members/{id}', [ClubController::class, 'updateMember'])
    ->add('DELETE', '/club/members/{id}', [ClubController::class, 'removeMember'])
    ->add('GET', '/club/people', [ClubController::class, 'people'])
    ->add('POST', '/club/people', [ClubController::class, 'createPerson'])
    ->add('GET', '/club/people/{id}', [ClubController::class, 'person'])
    ->add('PUT', '/club/people/{id}', [ClubController::class, 'updatePerson'])
    ->add('DELETE', '/club/people/{id}', [ClubController::class, 'deletePerson'])
    ->add('PUT', '/club/people/{id}/account', [ClubController::class, 'linkAccount'])
    ->add('POST', '/club/people/{id}/licences', [ClubController::class, 'addLicence'])
    ->add('PUT', '/club/licences/{id}', [ClubController::class, 'updateLicence'])
    ->add('DELETE', '/club/licences/{id}', [ClubController::class, 'deleteLicence'])
    ->add('GET', '/club/coaches', [ClubController::class, 'coaches'])
    ->add('GET', '/club/accounts', [ClubController::class, 'accounts']);
