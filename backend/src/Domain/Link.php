<?php

declare(strict_types=1);

namespace Portal\Domain;

final class Link
{
    public function __construct(
        public readonly int $id,
        public readonly int $sectionId,
        /** Column heading in a `columns` section (e.g. "Trenéři"); null in `tiles` sections. */
        public readonly ?string $column,
        public readonly string $title,
        public readonly ?string $subtitle,
        public readonly string $url,
        /** "lucide:<name>" or "url:https://…" (see Icon) */
        public readonly ?string $icon,
        public readonly bool $newTab,
        public readonly int $sortOrder,
        public readonly AccessRule $access,
    ) {
    }

    /** @return array<string, mixed> */
    public function toArray(bool $withAccess): array
    {
        $data = [
            'id' => $this->id,
            'sectionId' => $this->sectionId,
            'column' => $this->column,
            'title' => $this->title,
            'subtitle' => $this->subtitle,
            'url' => $this->url,
            'icon' => $this->icon,
            'newTab' => $this->newTab,
        ];
        if ($withAccess) {
            $data['access'] = $this->access->toArray();
        }

        return $data;
    }
}
