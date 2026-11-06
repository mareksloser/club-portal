<?php

declare(strict_types=1);

namespace Portal\Service;

use Portal\Auth\Member;
use Portal\Domain\Link;
use Portal\Domain\LinkData;
use Portal\Domain\Section;
use Portal\Http\HttpException;
use Portal\Repository\LinkRepository;
use Portal\Repository\SectionRepository;

/** Changes made in the portal's edit mode. Callers have already checked the editor role. */
final class EditorService
{
    public function __construct(
        private readonly SectionRepository $sections,
        private readonly LinkRepository $links,
    ) {
    }

    /** @param array<string, mixed> $input */
    public function createSection(array $input): Section
    {
        [$title, $layout] = self::sectionInput($input);

        return $this->sections->create($title, $layout);
    }

    /** @param array<string, mixed> $input */
    public function updateSection(int $id, array $input): Section
    {
        $this->section($id);
        [$title, $layout] = self::sectionInput($input);
        $this->sections->update($id, $title, $layout);

        return $this->section($id);
    }

    public function deleteSection(int $id): void
    {
        $this->section($id);
        $this->sections->delete($id);
    }

    /** @param mixed $ids */
    public function reorderSections(mixed $ids): void
    {
        $current = array_map(static fn (Section $s): int => $s->id, $this->sections->all());
        $this->sections->reorder(self::permutation($ids, $current));
    }

    /** @param array<string, mixed> $input */
    public function createLink(array $input, Member $author): Link
    {
        $data = LinkData::fromInput($input);
        $this->section($data->sectionId);

        return $this->links->create($data, $author->sub);
    }

    /** @param array<string, mixed> $input */
    public function updateLink(int $id, array $input): Link
    {
        $this->link($id);
        $data = LinkData::fromInput($input);
        $this->section($data->sectionId);

        return $this->links->update($id, $data);
    }

    public function deleteLink(int $id): void
    {
        $this->link($id);
        $this->links->delete($id);
    }

    /** @param mixed $ids */
    public function reorderLinks(int $sectionId, mixed $ids): void
    {
        $this->section($sectionId);
        $this->links->reorder($sectionId, self::permutation($ids, $this->links->idsInSection($sectionId)));
    }

    /**
     * Pure: the new order must contain exactly the current ids (so a stale page can't drop or duplicate any).
     *
     * @param list<int> $current
     * @return list<int>
     */
    public static function permutation(mixed $ids, array $current): array
    {
        $ids = is_array($ids) ? array_values($ids) : [];
        $ints = array_map(static fn (mixed $id): int => is_int($id) ? $id : (int) filter_var($id, FILTER_VALIDATE_INT), $ids);
        $sortedNew = $ints;
        $sortedCurrent = $current;
        sort($sortedNew);
        sort($sortedCurrent);
        if ($sortedNew !== $sortedCurrent) {
            throw new HttpException('Pořadí se mezitím změnilo, obnov stránku a zkus to znovu.', 409);
        }

        return $ints;
    }

    /**
     * @param array<string, mixed> $input
     * @return array{string, string}
     */
    private static function sectionInput(array $input): array
    {
        $errors = [];
        $title = trim(preg_replace('/\s+/u', ' ', (string) ($input['title'] ?? '')) ?? '');
        if ($title === '' || mb_strlen($title) > 60) {
            $errors['title'] = 'Název sekce je povinný (max. 60 znaků).';
        }
        $layout = (string) ($input['layout'] ?? 'tiles');
        if (!in_array($layout, Section::LAYOUTS, true)) {
            $errors['layout'] = 'Vyber vzhled sekce.';
        }
        if ($errors) {
            throw HttpException::validation($errors);
        }

        return [$title, $layout];
    }

    private function section(int $id): Section
    {
        return $this->sections->find($id) ?? throw HttpException::notFound('Sekce neexistuje.');
    }

    private function link(int $id): Link
    {
        return $this->links->find($id) ?? throw HttpException::notFound('Odkaz neexistuje.');
    }
}
