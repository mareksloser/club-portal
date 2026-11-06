<?php

declare(strict_types=1);

namespace Portal\Domain;

/**
 * Link icon reference. Pure.
 *   lucide:<name>   – an icon from the frontend's curated Lucide set (kebab-case name)
 *   url:https://…   – an image, e.g. an app logo from the dashboard-icons project
 */
final class Icon
{
    public static function isValid(string $icon): bool
    {
        if (str_starts_with($icon, 'lucide:')) {
            return (bool) preg_match('/^lucide:[a-z0-9-]{1,40}$/', $icon);
        }
        if (str_starts_with($icon, 'url:')) {
            $url = substr($icon, 4);

            return mb_strlen($url) <= 300 && LinkData::isHttpUrl($url);
        }

        return false;
    }
}
