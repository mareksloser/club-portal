<?php

declare(strict_types=1);

use Portal\Auth\Authenticator;
use Portal\Auth\ClaimsMapper;
use Portal\Auth\Oidc;
use Portal\Config\Env;
use Portal\Controller;
use Portal\Directory\Directory;
use Portal\Directory\HttpDirectory;
use Portal\Http\Kernel;
use Portal\Http\Router;
use Portal\Repository;
use Portal\Service\DashboardService;
use Portal\Service\EditorService;
use Portal\Support\Clock;
use Portal\Support\Container;
use Portal\Support\SystemClock;

/** All wiring in one place. Tests can build a Container and override any entry. */
return static function (Container $c): void {
    $issuer = static fn (): string => rtrim(Env::get('OIDC_ISSUER'), '/');

    $c->set(Clock::class, fn () => new SystemClock());
    $c->set(\PDO::class, fn () => new \PDO(
        Env::get('DB_DSN', 'mysql:host=127.0.0.1;dbname=portal;charset=utf8mb4'),
        Env::get('DB_USER', 'root'),
        Env::get('DB_PASSWORD', ''),
        [
            \PDO::ATTR_ERRMODE => \PDO::ERRMODE_EXCEPTION,
            \PDO::ATTR_DEFAULT_FETCH_MODE => \PDO::FETCH_ASSOC,
            \PDO::ATTR_EMULATE_PREPARES => false,
        ],
    ));

    // Repositories
    $c->set(Repository\SectionRepository::class, fn (Container $c) => new Repository\PdoSectionRepository($c->get(\PDO::class)));
    $c->set(Repository\LinkRepository::class, fn (Container $c) => new Repository\PdoLinkRepository($c->get(\PDO::class)));

    // Auth: sign-in happens at the club IdP (OIDC); the portal only verifies its access tokens.
    $c->set(Oidc\JwksProvider::class, fn (Container $c) => new Oidc\HttpJwksProvider(
        $issuer() . '/.well-known/jwks.json',
        Env::path('OIDC_JWKS_CACHE', dirname(__DIR__), 'tmp/cache/jwks.json'),
        $c->get(Clock::class),
    ));
    $c->set(Oidc\TokenVerifier::class, fn (Container $c) => new Oidc\TokenVerifier(
        $c->get(Oidc\JwksProvider::class),
        $c->get(Clock::class),
        $issuer(),
        Env::get('OIDC_CLIENT_ID', 'portal-web'),
    ));
    $c->set(Authenticator::class, fn (Container $c) => new Authenticator(
        $c->get(Oidc\TokenVerifier::class),
        new ClaimsMapper(),
        Env::get('EDITOR_ROLE', 'admin'),
    ));
    $c->set(Directory::class, fn () => new HttpDirectory($issuer() . '/api/directory'));

    // Services
    $c->set(DashboardService::class, fn (Container $c) => new DashboardService(
        $c->get(Repository\SectionRepository::class),
        $c->get(Repository\LinkRepository::class),
    ));
    $c->set(EditorService::class, fn (Container $c) => new EditorService(
        $c->get(Repository\SectionRepository::class),
        $c->get(Repository\LinkRepository::class),
    ));

    // Controllers
    $c->set(Controller\AuthController::class, fn () => new Controller\AuthController(
        $issuer(),
        Env::get('OIDC_CLIENT_ID', 'portal-web'),
        Env::get('CLUB_NAME', 'SK Baník Libušín'),
        is_numeric(Env::get('WEATHER_LAT', '')) && is_numeric(Env::get('WEATHER_LON', ''))
            ? ['lat' => (float) Env::get('WEATHER_LAT'), 'lon' => (float) Env::get('WEATHER_LON')]
            : null,
    ));
    $c->set(Controller\DashboardController::class, fn (Container $c) => new Controller\DashboardController(
        $c->get(Authenticator::class),
        $c->get(DashboardService::class),
    ));
    $c->set(Controller\EditorController::class, fn (Container $c) => new Controller\EditorController(
        $c->get(Authenticator::class),
        $c->get(EditorService::class),
        $c->get(Directory::class),
    ));

    // HTTP
    $c->set(Router::class, fn (Container $c) => (require __DIR__ . '/routes.php')(new Router($c)));
    $c->set(Kernel::class, fn (Container $c) => new Kernel(
        $c->get(Router::class),
        Env::list('CORS_ORIGINS'),
        Env::bool('APP_DEBUG'),
    ));
};
