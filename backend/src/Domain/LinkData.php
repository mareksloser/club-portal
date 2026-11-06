<?php

declare(strict_types=1);

namespace Portal\Domain;

use Portal\Http\HttpException;

/** Validated input for creating or updating a link. Pure. */
final class LinkData
{
    private function __construct(
        public readonly int $sectionId,
        public readonly ?string $column,
        public readonly string $title,
        public readonly ?string $subtitle,
        public readonly string $url,
        public readonly ?string $icon,
        public readonly bool $newTab,
        public readonly AccessRule $access,
    ) {
    }

    /**
     * @param array<string, mixed> $input
     * @throws HttpException 422 with field errors
     */
    public static function fromInput(array $input): self
    {
        $errors = [];

        $sectionId = filter_var($input['sectionId'] ?? null, FILTER_VALIDATE_INT, ['options' => ['min_range' => 1]]);
        if ($sectionId === false) {
            $errors['sectionId'] = 'Vyber sekci.';
        }

        $title = self::text($input['title'] ?? null, 80);
        if ($title === null) {
            $errors['title'] = 'Název je povinný (max. 80 znaků).';
        }
        $subtitle = self::text($input['subtitle'] ?? null, 120);
        $column = self::text($input['column'] ?? null, 40);

        $url = trim((string) ($input['url'] ?? ''));
        if (!self::isHttpUrl($url) || mb_strlen($url) > 500) {
            $errors['url'] = 'Zadej celou adresu začínající https:// (nebo http://).';
        }

        $icon = trim((string) ($input['icon'] ?? ''));
        if ($icon === '') {
            $icon = null;
        } elseif (!Icon::isValid($icon)) {
            $errors['icon'] = 'Vyber ikonu ze seznamu, nebo zadej adresu obrázku (https://…).';
        }

        $access = AccessRule::fromInput(is_array($input['access'] ?? null) ? $input['access'] : [], $errors);

        if ($errors) {
            throw HttpException::validation($errors);
        }

        return new self((int) $sectionId, $column, (string) $title, $subtitle, $url, $icon, (bool) ($input['newTab'] ?? false), $access);
    }

    public static function isHttpUrl(string $url): bool
    {
        $scheme = strtolower((string) parse_url($url, PHP_URL_SCHEME));

        return in_array($scheme, ['http', 'https'], true) && (string) parse_url($url, PHP_URL_HOST) !== '';
    }

    private static function text(mixed $value, int $max): ?string
    {
        $value = is_string($value) ? trim(preg_replace('/\s+/u', ' ', $value) ?? '') : '';

        return $value === '' || mb_strlen($value) > $max ? null : $value;
    }
}
