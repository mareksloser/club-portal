<?php

declare(strict_types=1);

use Portal\Auth\Authenticator;
use Portal\Auth\ClaimsMapper;
use Portal\Auth\Oidc;
use Portal\Catalog\AppCatalog;
use Portal\Catalog\HttpAppCatalog;
use Portal\Config\Env;
use Portal\Controller;
use Portal\Http\Kernel;
use Portal\Http\Router;
use Portal\Service\DashboardService;
use Portal\Support\Clock;
use Portal\Support\Container;
use Portal\Support\SystemClock;

/** All wiring in one place. Tests can build a Container and override any entry. */
return static function (Container $c): void {
    $issuer = static fn (): string => rtrim(Env::get('OIDC_ISSUER'), '/');

    $c->set(Clock::class, fn () => new SystemClock());

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
    $c->set(ClaimsMapper::class, fn () => new ClaimsMapper());
    $c->set(Authenticator::class, fn (Container $c) => new Authenticator(
        $c->get(Oidc\TokenVerifier::class),
        $c->get(ClaimsMapper::class),
    ));

    // Which apps a member may open: the IdP's catalogue
    $c->set(AppCatalog::class, fn () => new HttpAppCatalog($issuer() . '/api/apps'));
    $c->set(DashboardService::class, fn (Container $c) => new DashboardService($c->get(AppCatalog::class), $issuer()));

    // Controllers
    $c->set(Controller\AuthController::class, fn () => new Controller\AuthController(
        $issuer(),
        Env::get('OIDC_CLIENT_ID', 'portal-web'),
        Env::get('CLUB_NAME', 'SK Baník Libušín'),
    ));
    $c->set(Controller\DashboardController::class, fn (Container $c) => new Controller\DashboardController(
        $c->get(Authenticator::class),
        $c->get(DashboardService::class),
    ));

    // HTTP
    $c->set(Router::class, fn (Container $c) => (require __DIR__ . '/routes.php')(new Router($c)));
    $c->set(Kernel::class, fn (Container $c) => new Kernel(
        $c->get(Router::class),
        Env::list('CORS_ORIGINS'),
        Env::bool('APP_DEBUG'),
    ));
};
