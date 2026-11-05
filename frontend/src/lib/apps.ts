import type { PortalApp } from './types';

/**
 * Splits the catalogue into the member's own apps (a role, or public) and the ones listed
 * only because they are a superadmin, so the first list always matches their real access. Pure.
 */
export function splitApps(apps: PortalApp[]): { own: PortalApp[]; adminOnly: PortalApp[] } {
  return {
    own: apps.filter((app) => app.access !== 'superadmin'),
    adminOnly: apps.filter((app) => app.access === 'superadmin'),
  };
}
