<?php

declare(strict_types=1);

namespace Portal\Club;

/**
 * Staff of a season with their licences, most urgent first. Pure: today's date and the
 * warning window come in as arguments.
 *
 * A coach's overall state comes from their best licence (the one valid the longest):
 * an expired UEFA C next to a valid UEFA B is fine.
 */
final class CoachDashboard
{
    /**
     * @param list<array{person: array<string, mixed>, teamId: int, teamName: string, staffRole: ?string}> $staff
     * @param list<array<string, mixed>> $licences of those people
     * @return array{warnDays: int, summary: array<string, int>, coaches: list<array<string, mixed>>}
     */
    public static function compose(array $staff, array $licences, \DateTimeImmutable $today, int $warnDays): array
    {
        $byPerson = [];
        foreach ($staff as $row) {
            $id = (int) $row['person']['id'];
            $byPerson[$id] ??= ['person' => $row['person'], 'teams' => [], 'licences' => []];
            $byPerson[$id]['teams'][] = ['teamId' => $row['teamId'], 'teamName' => $row['teamName'], 'staffRole' => $row['staffRole']];
        }
        foreach ($licences as $licence) {
            $id = (int) $licence['personId'];
            if (isset($byPerson[$id])) {
                $until = $licence['validUntil'] !== null ? new \DateTimeImmutable($licence['validUntil']) : null;
                $byPerson[$id]['licences'][] = $licence + LicenceStatus::of($until, $today, $warnDays)->toArray();
            }
        }

        $summary = ['coaches' => 0, 'expired' => 0, 'expiring' => 0, 'missing' => 0, 'valid' => 0];
        $coaches = [];
        foreach ($byPerson as $coach) {
            usort($coach['licences'], self::byValidity(...));
            $best = $coach['licences'][0] ?? null;
            $coach['status'] = $best['status'] ?? 'missing';
            $coach['daysLeft'] = $best['daysLeft'] ?? null;
            $summary['coaches']++;
            $summary[$coach['status'] === 'unlimited' ? 'valid' : $coach['status']]++;
            $coaches[] = $coach;
        }

        usort($coaches, static fn (array $a, array $b): int => [
            LicenceStatus::ORDER[$a['status']], $a['daysLeft'] ?? PHP_INT_MAX, $a['person']['lastName'], $a['person']['firstName'],
        ] <=> [
            LicenceStatus::ORDER[$b['status']], $b['daysLeft'] ?? PHP_INT_MAX, $b['person']['lastName'], $b['person']['firstName'],
        ]);

        return ['warnDays' => $warnDays, 'summary' => $summary, 'coaches' => $coaches];
    }

    /** Longest valid first: unlimited, then the latest end date. */
    private static function byValidity(array $a, array $b): int
    {
        return [$b['validUntil'] === null, $b['validUntil'] ?? ''] <=> [$a['validUntil'] === null, $a['validUntil'] ?? ''];
    }
}
