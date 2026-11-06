<?php

declare(strict_types=1);

namespace Portal\Repository;

use Portal\Domain\AccessRule;
use Portal\Domain\Link;
use Portal\Domain\LinkData;

final class PdoLinkRepository implements LinkRepository
{
    private const COLUMNS = 'id, section_id, column_name, title, subtitle, url, icon, new_tab, sort_order, access_type, access_team, access_value';

    public function __construct(private readonly \PDO $pdo)
    {
    }

    public function all(): array
    {
        $rows = $this->pdo->query('SELECT ' . self::COLUMNS . ' FROM links ORDER BY section_id, sort_order, id')->fetchAll();

        return array_map(self::hydrate(...), $rows);
    }

    public function find(int $id): ?Link
    {
        $stmt = $this->pdo->prepare('SELECT ' . self::COLUMNS . ' FROM links WHERE id = ?');
        $stmt->execute([$id]);
        $row = $stmt->fetch();

        return $row ? self::hydrate($row) : null;
    }

    public function create(LinkData $data, string $createdBy): Link
    {
        $this->pdo->prepare(
            'INSERT INTO links (section_id, column_name, title, subtitle, url, icon, new_tab, sort_order, access_type, access_team, access_value, created_by)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
        )->execute([...self::values($data), $this->nextOrder($data->sectionId), ...self::accessValues($data), $createdBy]);

        return $this->find((int) $this->pdo->lastInsertId()) ?? throw new \LogicException('Link vanished after insert');
    }

    public function update(int $id, LinkData $data): Link
    {
        $current = $this->find($id) ?? throw new \LogicException("Link $id does not exist");
        $order = $current->sectionId === $data->sectionId ? $current->sortOrder : $this->nextOrder($data->sectionId);
        $this->pdo->prepare(
            'UPDATE links SET section_id = ?, column_name = ?, title = ?, subtitle = ?, url = ?, icon = ?, new_tab = ?,
                sort_order = ?, access_type = ?, access_team = ?, access_value = ? WHERE id = ?',
        )->execute([...self::values($data), $order, ...self::accessValues($data), $id]);

        return $this->find($id) ?? throw new \LogicException("Link $id vanished after update");
    }

    public function delete(int $id): void
    {
        $this->pdo->prepare('DELETE FROM links WHERE id = ?')->execute([$id]);
    }

    public function idsInSection(int $sectionId): array
    {
        $stmt = $this->pdo->prepare('SELECT id FROM links WHERE section_id = ? ORDER BY sort_order, id');
        $stmt->execute([$sectionId]);

        return array_map('intval', $stmt->fetchAll(\PDO::FETCH_COLUMN));
    }

    public function reorder(int $sectionId, array $ids): void
    {
        $this->pdo->beginTransaction();
        try {
            $stmt = $this->pdo->prepare('UPDATE links SET sort_order = ? WHERE id = ? AND section_id = ?');
            foreach (array_values($ids) as $position => $id) {
                $stmt->execute([$position, $id, $sectionId]);
            }
            $this->pdo->commit();
        } catch (\Throwable $e) {
            $this->pdo->rollBack();
            throw $e;
        }
    }

    private function nextOrder(int $sectionId): int
    {
        $stmt = $this->pdo->prepare('SELECT COALESCE(MAX(sort_order) + 1, 0) FROM links WHERE section_id = ?');
        $stmt->execute([$sectionId]);

        return (int) $stmt->fetchColumn();
    }

    /** @return list<mixed> section_id … new_tab */
    private static function values(LinkData $d): array
    {
        return [$d->sectionId, $d->column, $d->title, $d->subtitle, $d->url, $d->icon, $d->newTab ? 1 : 0];
    }

    /** @return list<?string> access_type, access_team, access_value */
    private static function accessValues(LinkData $d): array
    {
        return [$d->access->type, $d->access->team, $d->access->value];
    }

    /** @param array<string, mixed> $row */
    private static function hydrate(array $row): Link
    {
        return new Link(
            (int) $row['id'],
            (int) $row['section_id'],
            $row['column_name'] !== null ? (string) $row['column_name'] : null,
            (string) $row['title'],
            $row['subtitle'] !== null ? (string) $row['subtitle'] : null,
            (string) $row['url'],
            $row['icon'] !== null ? (string) $row['icon'] : null,
            (bool) $row['new_tab'],
            (int) $row['sort_order'],
            AccessRule::fromStorage((string) $row['access_type'], $row['access_team'], $row['access_value']),
        );
    }
}
