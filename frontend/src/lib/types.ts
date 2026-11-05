/** Shapes of the portal API (backend/src/Service/DashboardService.php). */

export type Membership = 'player' | 'coach' | 'parent' | 'staff';

export interface Team {
  slug: string;
  name: string;
  membership: Membership | string;
}

export interface Member {
  sub: string;
  name: string;
  email: string | null;
  teams: Team[];
  superadmin: boolean;
}

export interface RoleGrant {
  role: string;
  team: string | null;
  teamName: string | null;
}

/** Why the member sees the app: their own role, the app is public, or only as superadmin. */
export type AppAccess = 'role' | 'public' | 'superadmin';

export interface PortalApp {
  clientId: string;
  name: string;
  description: string | null;
  url: string;
  logoUrl: string | null;
  accentColor: string | null;
  roles: RoleGrant[];
  access: AppAccess;
}

export interface Dashboard {
  member: Member;
  apps: PortalApp[];
  links: { account: string; admin: string | null };
}

export interface PublicConfig {
  clubName: string;
}
