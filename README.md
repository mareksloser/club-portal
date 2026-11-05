# Club portal (rozcestník)

The club's launchpad for SK Baník Libušín: sign in once with the club account and see a tile for every
application you can use (Match Video Review, pitch booking, …), your teams, and links to your account.

```
frontend/   React 18 + TypeScript, TanStack Router/Query, Tailwind (same stack and look as MVR)
backend/    PHP 8.2+, no framework (PSR-4), no database
```

## How permissions work

The portal has **no permissions of its own**. Who may open what lives only in the club IdP
([team-auth](https://github.com/mareksloser/team-auth)):

- an application is listed when the user has **any of its roles** (the same roles that go into its tokens),
- or when it is marked *visible to every signed-in user* (e.g. a public gallery),
- a `superadmin` additionally sees every other application, in a separate "Ostatní aplikace klubu" section.

Which applications appear, their URL, description and order are set in the IdP admin
(*Aplikace → detail → Rozcestník*); logo and colour come from *Vzhled přihlášení*.
The portal reads the list from `GET {issuer}/api/apps` with the user's own access token (scope `apps`).

```
browser ──PKCE──▶ team-auth            (sign-in, tokens with scope `apps`)
browser ──Bearer─▶ portal /api/dashboard
                   └─ verifies the token (RS256, iss, aud = portal-web, exp)
                   └─ GET team-auth /api/apps with the same token ──▶ tiles
```

## Quick start (local)

```bash
# 1) backend
cd backend
cp .env.example .env            # OIDC_ISSUER, OIDC_CLIENT_ID=portal-web, CLUB_NAME
php -S localhost:8081 -t public

# 2) frontend (second terminal) — Vite proxies /api to :8081
cd frontend
pnpm install
pnpm dev
```

Demo without a backend and IdP: `pnpm dev:demo` (sample apps and teams, in the browser only).
`pnpm build:demo` produces a single file `dist-demo/index.html`.

## Setup in the IdP (team-auth)

Requires team-auth with the application catalogue (`GET /api/apps`, scope `apps`).

1. *Aplikace → Nová aplikace*: client_id `portal-web`, **public** client, grants Authorization Code + Refresh Token,
   scopes `openid profile email roles teams apps offline_access`, redirect URIs
   `https://<portal-host>/auth/callback` and `http://localhost:5173/auth/callback` for development.
   The portal needs no roles: every club account may use it.
2. For each application that should appear: *Aplikace → detail → Rozcestník* – tick *Zobrazit v rozcestníku*,
   set the URL (its `/login` when the app redirects straight to the club login, like MVR) and a short description.
3. Add the portal origin to the IdP's `CORS_ALLOW_ORIGIN`.

## Deployment

1. `cd frontend && pnpm build` and copy the contents of `frontend/dist/` into `backend/public/`.
2. Point the web root at `backend/public/`. An `.htaccess` is included for Apache
   (rewrite to `index.php` and passing the `Authorization` header). For nginx:
   `try_files $uri /index.php?$query_string;`
3. PHP extensions: `mbstring`, `openssl`. PHP must reach the IdP over HTTPS (`allow_url_fopen`)
   for its public keys and the app catalogue; keys are cached in `backend/tmp/cache/` (needs write access).

## API

| Method | Path | Who |
|---|---|---|
| GET | `/api/auth/config` | anyone (IdP issuer, client_id, club name) |
| GET | `/api/dashboard` | signed in: `{member, apps, links}`; `401` without a valid token, `502` when the IdP catalogue is unreachable |

## Architecture and testability

There are no tests yet, but the code is prepared so they can be added without refactoring
(the same conventions as MVR).

**Backend**
- `Controller/` only reads the request and calls a service; `Service/DashboardService::compose()` is pure.
- `Auth/Oidc/TokenVerifier` + `JwksProvider` (shared with MVR), `Auth/ClaimsMapper` (pure: claims → `Member`).
- `Catalog/AppCatalog` is an interface; `HttpAppCatalog` takes an injectable HTTP call, so it's testable offline.
  `Catalog/AppTile::fromArray()` is pure and drops entries with non-http(s) URLs (they end up in `href`/`src`).
- All wiring is in `config/services.php` (`Container::set` can be overridden in a test). Time goes through `Support/Clock`.
- Routes are full paths (`/api/...`), so they don't depend on how the web server mounts the app.

**Frontend**
- `src/api/` — the `ApiClient` interface, injected via React context: `HttpApiClient` (injectable `fetch`
  and `AuthSession`) and `DemoApiClient` (in-memory).
- `src/auth/session.ts` — `AuthSession` and its `oidc-client-ts` implementation (Authorization Code + PKCE,
  refresh token renewal), the same as MVR plus the `apps` scope.
- Pure functions: `src/lib/labels.ts` (role and team labels, greeting), `src/lib/apps.ts` (own vs. admin-only apps),
  `src/lib/color.ts` (readable text on an app's accent, same rule as team-auth).

## Roadmap

1. **Widgets on the tiles** – each app may expose `GET /api/portal/summary` with a common shape
   (`{items: [{label, value, url}]}`), e.g. MVR: unseen reviews; pitch booking: today's bookings for my teams.
   The portal backend would collect them behind a `SummaryProvider` interface (one adapter per app, like video sources in MVR).
   Needs a way to call the apps on the user's behalf (token exchange in team-auth, or a client-credentials call with `sub`).
2. A "back to the portal" link in each app's user menu.
3. Club announcements on the home screen.
