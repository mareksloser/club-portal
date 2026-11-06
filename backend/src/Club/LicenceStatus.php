<?php

declare(strict_types=1);

namespace Portal\Club;

/**
 * Where a licence stands on a given day. Pure, so the dashboard rules are testable
 * with a fixed date.
 *
 *   valid     – valid for more than $warnDays
 *   expiring  – ends within $warnDays (inclusive), still valid today
 *   expired   – the last valid day is in the past
 *   unlimited – no end date
 */
final class LicenceStatus
{
    public const ORDER = ['expired' => 0, 'expiring' => 1, 'missing' => 2, 'valid' => 3, 'unlimited' => 4];

    private function __construct(
        public readonly string $status,
        /** days until the last valid day (negative = days since it expired); null when unlimited */
        public readonly ?int $daysLeft,
    ) {
    }

    public static function of(?\DateTimeImmutable $validUntil, \DateTimeImmutable $today, int $warnDays): self
    {
        if ($validUntil === null) {
            return new self('unlimited', null);
        }
        $days = (int) $today->setTime(0, 0)->diff($validUntil->setTime(0, 0))->format('%r%a');

        return new self(match (true) {
            $days < 0 => 'expired',
            $days <= $warnDays => 'expiring',
            default => 'valid',
        }, $days);
    }

    /** @return array{status: string, daysLeft: ?int} */
    public function toArray(): array
    {
        return ['status' => $this->status, 'daysLeft' => $this->daysLeft];
    }
}
