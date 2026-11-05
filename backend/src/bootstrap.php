<?php

declare(strict_types=1);

// Composer autoloader when available, otherwise a minimal PSR-4 fallback.
$composer = __DIR__ . '/../vendor/autoload.php';
if (is_file($composer)) {
    require $composer;
} else {
    spl_autoload_register(static function (string $class): void {
        if (str_starts_with($class, 'Portal\\')) {
            $file = __DIR__ . '/' . str_replace('\\', '/', substr($class, 7)) . '.php';
            if (is_file($file)) {
                require $file;
            }
        }
    });
}

// Environment: .env is loaded here so that public/index.php and bin/* scripts behave the same.
if (class_exists(\Dotenv\Dotenv::class)) {
    \Dotenv\Dotenv::createImmutable(dirname(__DIR__))->safeLoad();
}
