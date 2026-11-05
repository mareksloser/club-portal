<?php

declare(strict_types=1);

namespace Portal\Service;

use Portal\Auth\Member;
use Portal\Domain\Link;
use Portal\Domain\Section;
use Portal\Repository\LinkRepository;
use Portal\Repository\SectionRepository;

/** What the home screen shows to one visitor. */
final class DashboardService
{
    public function __construct(
        private readonly SectionRepository $sections,
        private readonly LinkRepository $links,
    ) {
    }

    /** @return array<string, mixed> */
    public function forVisitor(?Member $member, bool $isEditor): array
    {
        return self::compose($this->sections->all(), $this->links->all(), $member, $isEditor);
    }

    /**
     * Pure: visitors get only the links their access rules allow and no empty sections.
     * Editors get everything, including each link's rule and whether they'd see it as a regular member.
     *
     * @param list<Section> $sections
     * @param list<Link>    $links
     * @return array<string, mixed>
     */
    public static function compose(array $sections, array $links, ?Member $member, bool $isEditor): array
    {
        $bySection = [];
        foreach ($links as $link) {
            if (!$link->access->allows($member, $isEditor)) {
                continue;
            }
            $row = $link->toArray($isEditor);
            if ($isEditor) {
                $row['visibleToMe'] = $link->access->allows($member, false);
            }
            $bySection[$link->sectionId][] = $row;
        }

        $out = [];
        foreach ($sections as $section) {
            $rows = $bySection[$section->id] ?? [];
            if ($rows === [] && !$isEditor) {
                continue;
            }
            $out[] = $section->toArray() + ['links' => $rows];
        }

        return [
            'member' => $member?->toArray(),
            'editor' => $isEditor,
            'sections' => $out,
        ];
    }
}
