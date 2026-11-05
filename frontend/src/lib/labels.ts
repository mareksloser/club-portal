import type { AppAccess, Membership, RoleGrant, Team } from './types';

/**
 * Human labels for role slugs used across club apps. Each app defines its own roles in the IdP,
 * so unknown slugs are shown as they are. Pure functions, no I/O.
 */
const ROLE_LABELS: Record<string, string> = {
  admin: 'Správce',
  coach: 'Trenér',
  player: 'Hráč',
  parent: 'Rodič',
  staff: 'Realizační tým',
  viewer: 'Náhled',
  manager: 'Vedoucí',
  booker: 'Rezervace',
  editor: 'Editor',
};

const MEMBERSHIP_LABELS: Record<Membership, string> = {
  player: 'hráč',
  coach: 'trenér',
  parent: 'rodič',
  staff: 'realizační tým',
};

export function roleLabel(slug: string): string {
  return ROLE_LABELS[slug] ?? slug;
}

export function membershipLabel(membership: string): string {
  return MEMBERSHIP_LABELS[membership as Membership] ?? membership;
}

/**
 * "Trenér (Mladší přípravka, Starší přípravka), Hráč" – roles with their teams,
 * a role without a team applies to the whole club and wins over team-limited ones.
 */
export function describeRoles(roles: RoleGrant[]): string {
  const byRole = new Map<string, { everywhere: boolean; teams: string[] }>();
  for (const { role, team, teamName } of roles) {
    const entry = byRole.get(role) ?? { everywhere: false, teams: [] };
    if (team === null) entry.everywhere = true;
    else if (!entry.teams.includes(teamName ?? team)) entry.teams.push(teamName ?? team);
    byRole.set(role, entry);
  }
  return [...byRole.entries()]
    .map(([role, { everywhere, teams }]) => (everywhere || teams.length === 0 ? roleLabel(role) : `${roleLabel(role)} (${teams.join(', ')})`))
    .join(', ');
}

/** What the tile says about the member's access. */
export function accessLabel(access: AppAccess, roles: RoleGrant[]): string {
  if (access === 'public') return 'Přístupné všem členům';
  if (access === 'superadmin') return 'Vidíte jako správce účtů';
  return describeRoles(roles);
}

export function teamLine(team: Team): { name: string; membership: string } {
  return { name: team.name, membership: membershipLabel(team.membership) };
}

/** Czech greeting by local hour. */
export function greeting(date: Date): string {
  const h = date.getHours();
  if (h < 5) return 'Dobrou noc';
  if (h < 10) return 'Dobré ráno';
  if (h < 18) return 'Dobrý den';
  return 'Dobrý večer';
}

/** "Jan Novák" → "JN"; one word → first two letters. */
export function initials(name: string): string {
  const parts = name.split(/\s+/).filter(Boolean);
  if (parts.length === 1) return parts[0]!.slice(0, 2).toUpperCase();
  return parts
    .slice(0, 2)
    .map((p) => p[0]!.toUpperCase())
    .join('');
}
