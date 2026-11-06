<?php

declare(strict_types=1);

namespace Portal\Domain;

/** A block on the dashboard: `tiles` (icon grid, like "Aplikace") or `columns` (bookmark lists grouped by column). */
final class Section
{
    public const LAYOUTS = ['tiles', 'columns'];

    public function __construct(
        public readonly int $id,
        public readonly string $title,
        public readonly string $layout,
        public readonly int $sortOrder,
    ) {
    }

    /** @return array<string, mixed> */
    public function toArray(): array
    {
        return ['id' => $this->id, 'title' => $this->title, 'layout' => $this->layout];
    }
}
