<?php

declare(strict_types=1);

namespace Portal\Repository;

use Portal\Domain\Section;

final class PdoSectionRepository implements SectionRepository
{
    public function __construct(private readonly \PDO $pdo)
    {
    }

    public function all(): array
    {
        $rows = $this->pdo->query('SELECT id, title, layout, sort_order FROM sections ORDER BY sort_order, id')->fetchAll();

        return array_map(self::hydrate(...), $rows);
    }

    public function find(int $id): ?Section
    {
        $stmt = $this->pdo->prepare('SELECT id, title, layout, sort_order FROM sections WHERE id = ?');
        $stmt->execute([$id]);
        $row = $stmt->fetch();

        return $row ? self::hydrate($row) : null;
    }

    public function create(string $title, string $layout): Section
    {
        $next = (int) $this->pdo->query('SELECT COALESCE(MAX(sort_order) + 1, 0) FROM sections')->fetchColumn();
        $this->pdo->prepare('INSERT INTO sections (title, layout, sort_order) VALUES (?, ?, ?)')->execute([$title, $layout, $next]);

        return new Section((int) $this->pdo->lastInsertId(), $title, $layout, $next);
    }

    public function update(int $id, string $title, string $layout): void
    {
        $this->pdo->prepare('UPDATE sections SET title = ?, layout = ? WHERE id = ?')->execute([$title, $layout, $id]);
    }

    public function delete(int $id): void
    {
        $this->pdo->prepare('DELETE FROM sections WHERE id = ?')->execute([$id]);
    }

    public function reorder(array $ids): void
    {
        $this->pdo->beginTransaction();
        try {
            $stmt = $this->pdo->prepare('UPDATE sections SET sort_order = ? WHERE id = ?');
            foreach (array_values($ids) as $position => $id) {
                $stmt->execute([$position, $id]);
            }
            $this->pdo->commit();
        } catch (\Throwable $e) {
            $this->pdo->rollBack();
            throw $e;
        }
    }

    /** @param array<string, mixed> $row */
    private static function hydrate(array $row): Section
    {
        return new Section((int) $row['id'], (string) $row['title'], (string) $row['layout'], (int) $row['sort_order']);
    }
}
