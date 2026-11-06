import { createBrowserHistory, createMemoryHistory, createRootRoute, createRoute, createRouter, Outlet } from '@tanstack/react-router';
import { NotFoundPage } from './NotFoundPage';
import { HomePage } from '@/features/home/HomePage';
import { LoginPage } from '@/features/auth/LoginPage';
import { AuthCallbackPage } from '@/features/auth/AuthCallbackPage';
import { SeasonsPage } from '@/features/club/SeasonsPage';
import { TeamPage } from '@/features/club/TeamPage';
import { PeoplePage } from '@/features/club/PeoplePage';
import { PersonPage } from '@/features/club/PersonPage';
import { CoachesPage } from '@/features/club/CoachesPage';
import { isDemo } from '@/api';
import { safeRedirect } from '@/lib/redirect';

const root = createRootRoute({ component: Outlet, notFoundComponent: NotFoundPage });

/** ?redirect=/… brings the user back after login. Only same-site paths (no open redirect). */
const loginSearch = (s: Record<string, unknown>): { redirect?: string } => {
  const redirect = safeRedirect(s.redirect);
  return redirect ? { redirect } : {};
};

/** ?sezona=12 */
const seasonSearch = (s: Record<string, unknown>): { sezona?: number } => {
  const id = Number(s.sezona);
  return Number.isInteger(id) && id > 0 ? { sezona: id } : {};
};

const routes = [
  createRoute({ getParentRoute: () => root, path: '/', component: HomePage }),
  createRoute({ getParentRoute: () => root, path: '/login', component: LoginPage, validateSearch: loginSearch }),
  createRoute({ getParentRoute: () => root, path: '/auth/callback', component: AuthCallbackPage }),
  createRoute({ getParentRoute: () => root, path: '/klub', component: SeasonsPage, validateSearch: seasonSearch }),
  createRoute({ getParentRoute: () => root, path: '/klub/tym/$teamId', component: TeamPage }),
  createRoute({ getParentRoute: () => root, path: '/klub/lide', component: PeoplePage }),
  createRoute({ getParentRoute: () => root, path: '/klub/lide/$personId', component: PersonPage }),
  createRoute({ getParentRoute: () => root, path: '/klub/treneri', component: CoachesPage, validateSearch: seasonSearch }),
];

export const router = createRouter({
  routeTree: root.addChildren(routes),
  // The single-file demo runs inside a hosted viewer, where path URLs don't belong to us.
  history: isDemo ? createMemoryHistory({ initialEntries: ['/'] }) : createBrowserHistory(),
});

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router;
  }
}
