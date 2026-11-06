<?php

declare(strict_types=1);

namespace Portal\Repository;

use Portal\Domain\Section;

interface SectionRepository
{
    /** @return list<Section> in display order */
    public function all(): array;

    public function find(int $id): ?Section;

    /** Appended at the end. */
    public function create(string $title, string $layout): Section;

    public function update(int $id, string $title, string $layout): void;

    /** Removes the section with its links. */
    public function delete(int $id): void;

    /** @param list<int> $ids every section id, in the new order */
    public function reorder(array $ids): void;
}
