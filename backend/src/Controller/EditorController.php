<?php

declare(strict_types=1);

namespace Portal\Controller;

use Portal\Auth\Authenticator;
use Portal\Directory\Directory;
use Portal\Http\HttpException;
use Portal\Http\Request;
use Portal\Http\Response;
use Portal\Service\EditorService;

/** Edit mode: sections, links, their order, and the team/role choices for access rules. Editors only. */
final class EditorController
{
    public function __construct(
        private readonly Authenticator $auth,
        private readonly EditorService $editor,
        private readonly Directory $directory,
    ) {
    }

    public function createSection(Request $request): Response
    {
        $this->auth->requireEditor($request);

        return Response::json($this->editor->createSection($request->json())->toArray(), 201);
    }

    public function updateSection(Request $request): Response
    {
        $this->auth->requireEditor($request);

        return Response::json($this->editor->updateSection($request->intParam('id'), $request->json())->toArray());
    }

    public function deleteSection(Request $request): Response
    {
        $this->auth->requireEditor($request);
        $this->editor->deleteSection($request->intParam('id'));

        return Response::noContent();
    }

    public function reorderSections(Request $request): Response
    {
        $this->auth->requireEditor($request);
        $this->editor->reorderSections($request->json()['ids'] ?? null);

        return Response::noContent();
    }

    public function createLink(Request $request): Response
    {
        $member = $this->auth->requireEditor($request);

        return Response::json($this->editor->createLink($request->json(), $member)->toArray(true), 201);
    }

    public function updateLink(Request $request): Response
    {
        $this->auth->requireEditor($request);

        return Response::json($this->editor->updateLink($request->intParam('id'), $request->json())->toArray(true));
    }

    public function deleteLink(Request $request): Response
    {
        $this->auth->requireEditor($request);
        $this->editor->deleteLink($request->intParam('id'));

        return Response::noContent();
    }

    public function reorderLinks(Request $request): Response
    {
        $this->auth->requireEditor($request);
        $this->editor->reorderLinks($request->intParam('id'), $request->json()['ids'] ?? null);

        return Response::noContent();
    }

    public function directory(Request $request): Response
    {
        $this->auth->requireEditor($request);
        try {
            $data = $this->directory->load((string) $request->bearerToken());
        } catch (\RuntimeException $e) {
            error_log('[portal] directory unavailable: ' . $e->getMessage());
            throw new HttpException('Seznam týmů a rolí se nepodařilo načíst z klubového účtu.', 502);
        }

        return Response::json($data)->withHeaders(['Cache-Control' => 'private, no-store']);
    }
}
