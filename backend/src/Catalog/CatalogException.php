<?php

declare(strict_types=1);

namespace Portal\Catalog;

final class CatalogException extends \RuntimeException
{
    public static function tokenRejected(): self
    {
        return new self('The IdP rejected the access token.', 401);
    }

    public static function unavailable(string $reason): self
    {
        return new self($reason, 502);
    }

    public function isTokenRejected(): bool
    {
        return $this->getCode() === 401;
    }
}
