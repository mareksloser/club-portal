<?php

declare(strict_types=1);

namespace Portal\Repository;

use Portal\Domain\Link;
use Portal\Domain\LinkData;

interface LinkRepository
{
    /** @return list<Link> by section, then display order */
    public function all(): array;

    public function find(int $id): ?Link;

    /** Appended at the end of its section. */
    public function create(LinkData $data, string $createdBy): Link;

    /** Moving to another section appends it there. */
    public function update(int $id, LinkData $data): Link;

    public function delete(int $id): void;

    /** @return list<int> ids of the section's links in display order */
    public function idsInSection(int $sectionId): array;

    /** @param list<int> $ids every link id of the section, in the new order */
    public function reorder(int $sectionId, array $ids): void;
}
