<?php

declare(strict_types=1);

namespace Portal\Support;

/** Injected wherever "now" matters, so time can be frozen in tests. */
interface Clock
{
    public function now(): \DateTimeImmutable;
}
