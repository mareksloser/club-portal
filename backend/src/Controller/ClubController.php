<?php

declare(strict_types=1);

namespace Portal\Controller;

use Portal\Auth\Authenticator;
use Portal\Club\ClubService;
use Portal\Directory\Directory;
use Portal\Http\HttpException;
use Portal\Http\Request;
use Portal\Http\Response;

/** Club registry API: seasons, teams, people, licences and the coaches dashboard. Editors only. */
final class ClubController
{
    public function __construct(
        private readonly Authenticator $auth,
        private readonly ClubService $club,
        private readonly Directory $directory,
    ) {
    }

    public function seasons(Request $r): Response { $this->auth->requireEditor($r); return Response::json($this->club->seasons()); }
    public function season(Request $r): Response { $this->auth->requireEditor($r); return Response::json($this->club->season($r->intParam('id'))); }
    public function createSeason(Request $r): Response { $this->auth->requireEditor($r); return Response::json($this->club->createSeason($r->json()), 201); }
    public function updateSeason(Request $r): Response { $this->auth->requireEditor($r); return Response::json($this->club->updateSeason($r->intParam('id'), $r->json())); }
    public function deleteSeason(Request $r): Response { $this->auth->requireEditor($r); $this->club->deleteSeason($r->intParam('id')); return Response::noContent(); }

    public function team(Request $r): Response { $this->auth->requireEditor($r); return Response::json($this->club->team($r->intParam('id'))); }
    public function createTeam(Request $r): Response { $this->auth->requireEditor($r); return Response::json($this->club->createTeam($r->json()), 201); }
    public function updateTeam(Request $r): Response { $this->auth->requireEditor($r); return Response::json($this->club->updateTeam($r->intParam('id'), $r->json())); }
    public function deleteTeam(Request $r): Response { $this->auth->requireEditor($r); $this->club->deleteTeam($r->intParam('id')); return Response::noContent(); }

    public function addMember(Request $r): Response { $this->auth->requireEditor($r); return Response::json($this->club->addMember($r->intParam('id'), $r->json()), 201); }
    public function updateMember(Request $r): Response { $this->auth->requireEditor($r); return Response::json($this->club->updateMember($r->intParam('id'), $r->json())); }
    public function removeMember(Request $r): Response { $this->auth->requireEditor($r); return Response::json($this->club->removeMember($r->intParam('id'))); }

    public function people(Request $r): Response
    {
        $this->auth->requireEditor($r);
        $q = $r->query['q'] ?? null;

        return Response::json(['people' => $this->club->people(is_string($q) ? $q : null)]);
    }

    public function person(Request $r): Response { $this->auth->requireEditor($r); return Response::json($this->club->person($r->intParam('id'))); }
    public function createPerson(Request $r): Response { $this->auth->requireEditor($r); return Response::json($this->club->createPerson($r->json()), 201); }
    public function updatePerson(Request $r): Response { $this->auth->requireEditor($r); return Response::json($this->club->updatePerson($r->intParam('id'), $r->json())); }
    public function deletePerson(Request $r): Response { $this->auth->requireEditor($r); $this->club->deletePerson($r->intParam('id')); return Response::noContent(); }
    public function linkAccount(Request $r): Response { $this->auth->requireEditor($r); return Response::json($this->club->linkAccount($r->intParam('id'), $r->json())); }

    public function addLicence(Request $r): Response { $this->auth->requireEditor($r); return Response::json($this->club->addLicence($r->intParam('id'), $r->json()), 201); }
    public function updateLicence(Request $r): Response { $this->auth->requireEditor($r); return Response::json($this->club->updateLicence($r->intParam('id'), $r->json())); }
    public function deleteLicence(Request $r): Response { $this->auth->requireEditor($r); return Response::json($this->club->deleteLicence($r->intParam('id'))); }

    public function coaches(Request $r): Response
    {
        $this->auth->requireEditor($r);
        $season = filter_var($r->query['season'] ?? null, FILTER_VALIDATE_INT, ['options' => ['min_range' => 1]]);

        return Response::json($this->club->coaches($season === false ? null : $season));
    }

    /** Club accounts to link a person with (searched in the IdP with the editor's own token). */
    public function accounts(Request $r): Response
    {
        $this->auth->requireEditor($r);
        $q = trim((string) ($r->query['q'] ?? ''));
        if (mb_strlen($q) < 2) {
            return Response::json(['users' => []]);
        }
        try {
            $users = self::matchAllWords($this->directory->searchUsers((string) $r->bearerToken(), self::longestWord($q)), $q);
        } catch (\RuntimeException $e) {
            error_log('[portal] account search failed: ' . $e->getMessage());
            throw new HttpException($e->getCode() === 403
                ? 'Hledat v klubových účtech může jen správce s rolí admin u Rozcestníku (nebo superadmin).'
                : 'Klubové účty se nepodařilo prohledat. Má team-auth endpoint /api/directory/users?', 502);
        }

        return Response::json(['users' => $users])->withHeaders(['Cache-Control' => 'private, no-store']);
    }

    /** The IdP matches the whole query as one string, so it gets the most selective word only. Pure. */
    public static function longestWord(string $q): string
    {
        $words = preg_split('/\s+/u', trim($q), -1, PREG_SPLIT_NO_EMPTY) ?: [''];
        usort($words, static fn (string $a, string $b): int => mb_strlen($b) <=> mb_strlen($a));

        return $words[0];
    }

    /**
     * Keeps accounts whose name or e-mail contains every word of $q ("Šloser Marek" finds Marek Šloser). Pure.
     *
     * @param list<array{sub: string, name: string, email: string, active: bool}> $users
     * @return list<array{sub: string, name: string, email: string, active: bool}>
     */
    public static function matchAllWords(array $users, string $q): array
    {
        $words = preg_split('/\s+/u', mb_strtolower(trim($q)), -1, PREG_SPLIT_NO_EMPTY) ?: [];

        return array_values(array_filter($users, static function (array $u) use ($words): bool {
            $haystack = mb_strtolower($u['name'] . ' ' . $u['email']);
            foreach ($words as $word) {
                if (!str_contains($haystack, $word)) {
                    return false;
                }
            }

            return true;
        }));
    }
}
