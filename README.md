# Club portal (rozcestník)

The start page of SK Baník Libušín: date, greeting, weather, and the club's links in sections – app tiles and
bookmark columns. Editors manage everything right on the page (*Upravit*); each link carries one rule saying
who may see it. Visitors without an account see the public links, members sign in with the club account.

```
frontend/   React 18 + TypeScript, TanStack Router/Query, Tailwind, Radix
backend/    PHP 8.2+, no framework (PSR-4), PDO + MySQL 8 / MariaDB
```

## Who sees what

Every link has one rule, set in its edit dialog (*Kdo odkaz uvidí*):

| Rule | Visible to |
|---|---|
| Všichni | everyone, also without signing in |
| Přihlášení členové | anyone signed in with a club account |
| Tým | members of a team (or of any team), optionally only coaches / players / parents / staff |
| Role | holders of a portal role in the club account (e.g. `vybor`), optionally only for one team |
| Jen správci | the portal's editors |

Teams, memberships and roles are read from the access token (`teams`, `roles` claims), so the portal keeps
no copy of them. A member who is in no matching team or role simply doesn't get the link from the API.
Editors (the portal role `admin`, configurable via `EDITOR_ROLE`, or the global `superadmin`) see and manage
everything; in edit mode each link shows its rule, and an eye icon marks links they'd not see otherwise.
Sections without any visible link are hidden.

## Club registry (Evidence klubu)

Editors get *Evidence klubu* on the start page (`/klub`):

- **Seasons** (`2026/27`, start and end date). A new season can take over the teams of an earlier one,
  including their players and staff, so only the changes need editing.
- **Teams** in a season (name, category, optionally the matching team in the club account).
- **Players** (jersey number) and **staff** (function: hlavní trenér, asistent, vedoucí týmu…). A person is
  kept once in the registry (`/klub/lide`) and can be in several teams and seasons.
- **Link to a club account**: on a person's page, search the club accounts and link one. Needs team-auth's
  `GET /api/directory/users` and the role `admin` on `portal-web` (or superadmin).
- **Coaching licences** per person (type, number, issued, valid until, note).
- **Coaches dashboard** (`/klub/treneri`): the season's staff with their licences, most urgent first:
  expired, ending within `LICENCE_WARNING_DAYS` (default 90), without a licence, valid. A coach's state
  follows their licence that is valid the longest.

The registry is personal data (also of children), so it is only for the portal's editors.
Existing databases: run `backend/database/migrations/002_club_registry.sql` once.

## Quick start (local)

```bash
# 1) database
mysql -uroot -e "CREATE DATABASE portal CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci"
mysql -uroot portal < backend/database/schema.sql
mysql -uroot portal < backend/database/seed.sql      # optional starting content

# 2) backend
cd backend
cp .env.example .env            # DB_*, OIDC_ISSUER, OIDC_CLIENT_ID=portal-web, CLUB_NAME, WEATHER_*
php -S localhost:8081 -t public

# 3) frontend (second terminal) — Vite proxies /api to :8081
cd frontend
pnpm install
pnpm dev
```

Demo without a backend and IdP: `pnpm dev:demo` (you are an editor, data lives in the browser).
`pnpm build:demo` produces a single file `dist-demo/index.html`.

## Setup in the IdP (team-auth)

1. *Aplikace → Nová aplikace*: client_id `portal-web`, **public** client, grants Authorization Code + Refresh Token,
   scopes `openid profile email roles teams offline_access`, redirect URIs
   `https://<portal-host>/auth/callback` and `http://localhost:5173/auth/callback` for development.
2. Roles of `portal-web`: `admin` (edits the portal) plus any roles you want to use in link rules
   (e.g. `vybor` – výbor klubu). Grant them to users, optionally limited to a team.
3. Add the portal origin to the IdP's `CORS_ALLOW_ORIGIN`.
4. For team and role pick-lists in the editor, team-auth needs `GET /api/directory` (included in team-auth
   since the "Directory API" change). Without it the editor still works, slugs are typed by hand.

## Deployment

1. `cd frontend && pnpm build` and copy the contents of `frontend/dist/` into `backend/public/`.
2. Point the web root at `backend/public/`. The `.htaccess` (the same file comes with the frontend build,
   so copying `dist/` over it is fine) sends `/api/*` to `index.php`, other unknown paths to `index.html`,
   and passes the `Authorization` header. For nginx:
   `location /api/ { try_files $uri /index.php?$query_string; }` and `location / { try_files $uri /index.html; }`.

   Check: `https://<portal-host>/api/auth/config` must return JSON. If it returns the HTML page,
   the rewrite sends `/api` to the SPA (an old `.htaccess`, or `AllowOverride` off).
3. PHP extensions: `pdo_mysql`, `mbstring`, `openssl`. PHP must reach the IdP over HTTPS (`allow_url_fopen`)
   for its public keys and the directory; keys are cached in `backend/tmp/cache/` (needs write access).
4. Weather comes from [Open-Meteo](https://open-meteo.com) straight from the browser (no key);
   set `WEATHER_LAT`/`WEATHER_LON`, or leave them empty to hide it.

## API

All responses are JSON. Requests are authorized with the club IdP's access token (`Authorization: Bearer …`).

| Method | Path | Who |
|---|---|---|
| GET | `/api/auth/config` | anyone (IdP, club name, weather location) |
| GET | `/api/dashboard` | anyone: `{member, editor, sections[{id, title, layout, links[]}]}` filtered by the rules |
| GET | `/api/directory` | editor (teams and portal roles from the IdP) |
| POST | `/api/sections` | editor `{title, layout: tiles \| columns}` |
| PUT / DELETE | `/api/sections/{id}` | editor (deleting removes its links) |
| PUT | `/api/sections/order` | editor `{ids: [...]}` – all section ids in the new order |
| POST | `/api/links` | editor `{sectionId, column, title, subtitle, url, icon, newTab, access: {type, team, value}}` |
| PUT / DELETE | `/api/links/{id}` | editor |
| PUT | `/api/sections/{id}/links/order` | editor `{ids: [...]}` – all link ids of the section |
| GET, POST | `/club/seasons` | editor; POST `{name, startsOn, endsOn, copyFrom?}` |
| GET, PUT, DELETE | `/club/seasons/{id}` | editor (GET includes the teams) |
| POST | `/club/teams` | editor `{seasonId, name, category, authTeam}` |
| GET, PUT, DELETE | `/club/teams/{id}` | editor (GET includes players and staff with licence state) |
| POST | `/club/teams/{id}/members` | editor `{kind: player \| staff, personId \| person: {...}, jerseyNumber?, staffRole?}` |
| PUT, DELETE | `/club/members/{id}` | editor |
| GET, POST | `/club/people` | editor; GET `?q=` searches name, FAČR id, linked account |
| GET, PUT, DELETE | `/club/people/{id}` | editor (GET includes teams and licences) |
| PUT | `/club/people/{id}/account` | editor `{sub, name, email}` or `{sub: null}` to unlink |
| POST | `/club/people/{id}/licences` | editor `{type, number, issuedOn, validUntil, note}` |
| PUT, DELETE | `/club/licences/{id}` | editor |
| GET | `/club/coaches?season=` | editor: coaches dashboard (default: the current season) |
| GET | `/club/accounts?q=` | editor: club accounts to link (from team-auth) |

Validation errors: `422 {"error": "...", "fields": {"field": "message"}}`. A reorder with a stale list of ids
gets `409` (someone changed the page meanwhile). Icons are `lucide:<name>` from the curated set in
`frontend/src/lib/icons.ts`, or `url:https://…` for an image (e.g. an app logo from dashboard-icons).

## Architecture and testability

There are no tests yet, but the code is prepared so they can be added without refactoring
(the same conventions as MVR).

**Backend**
- `Controller/` only reads the request and calls a service; logic lives in `Service/`.
- `Club/` is the registry: `ClubService` (validation, orchestration), `ClubRepository` + `PdoClubRepository`,
  and pure `LicenceStatus`, `CoachDashboard::compose()`, `ClubService::currentSeasonId()`, `Input`.
- `Domain/AccessRule` is the whole permission model: pure, `allows(?Member, isEditor)`.
  `DashboardService::compose()` (filtering) and `EditorService::permutation()` (reorder check) are pure too;
  `Domain/LinkData` and `Domain/Icon` validate input without I/O.
- Repositories have interfaces (`Repository/*Repository.php`) and PDO implementations.
- Sign-in: `Auth/Oidc/TokenVerifier` + `JwksProvider` (shared with MVR), `Auth/ClaimsMapper` (pure: claims → `Member`).
  `Directory/HttpDirectory` takes an injectable HTTP call.
- All wiring is in `config/services.php` (`Container::set` can be overridden in a test). Routes are full paths.

**Frontend**
- `src/api/` — the `ApiClient` interface, injected via React context: `HttpApiClient` and `DemoApiClient`.
- `src/auth/session.ts` — `oidc-client-ts` session (Authorization Code + PKCE, refresh), same as MVR.
- `src/features/club/` — the registry screens; `lib/club.ts` holds its types and pure display helpers
  (licence wording with Czech plurals, dates).
- Pure functions: `lib/access.ts` (rule labels), `lib/links.ts` (columns, reordering), `lib/icons.ts`,
  `lib/date.ts`, `lib/weather.ts`.
- One dark theme; all colours are CSS variables in `src/index.css` (`--accent` re-colours the portal).
