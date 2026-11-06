import type { AccessRule, AccessType, Directory, Membership } from './types';

/** Labels for access rules, for the editor. Pure. */

export const ACCESS_TYPES: { type: AccessType; label: string; hint: string }[] = [
  { type: 'public', label: 'Všichni', hint: 'I bez přihlášení' },
  { type: 'members', label: 'Přihlášení členové', hint: 'Kdokoli s klubovým účtem' },
  { type: 'team', label: 'Tým', hint: 'Členové týmu, případně jen trenéři, hráči nebo rodiče' },
  { type: 'role', label: 'Role', hint: 'Držitelé role rozcestníku v klubovém účtu' },
  { type: 'editors', label: 'Jen správci', hint: 'Jen ti, kdo rozcestník upravují' },
];

export const MEMBERSHIPS: { value: Membership; label: string; plural: string }[] = [
  { value: 'coach', label: 'trenér', plural: 'Trenéři' },
  { value: 'player', label: 'hráč', plural: 'Hráči' },
  { value: 'parent', label: 'rodič', plural: 'Rodiče' },
  { value: 'staff', label: 'realizační tým', plural: 'Realizační tým' },
];

export function membershipLabel(value: string): string {
  return MEMBERSHIPS.find((m) => m.value === value)?.label ?? value;
}

const teamName = (slug: string, directory?: Directory | null) => directory?.teams.find((t) => t.slug === slug)?.name ?? slug;

/** "Trenéři, Mladší přípravka" / "Role vybor" / "Všichni" */
export function describeAccess(rule: AccessRule, directory?: Directory | null): string {
  switch (rule.type) {
    case 'public':
      return 'Všichni';
    case 'members':
      return 'Přihlášení členové';
    case 'editors':
      return 'Jen správci';
    case 'team': {
      const who = MEMBERSHIPS.find((m) => m.value === rule.value)?.plural ?? 'Všichni členové';
      return rule.team ? `${who}, ${teamName(rule.team, directory)}` : `${who} všech týmů`;
    }
    case 'role': {
      const role = rule.value ?? '?';
      return rule.team ? `Role ${role}, ${teamName(rule.team, directory)}` : `Role ${role}`;
    }
  }
}

export const DEFAULT_ACCESS: AccessRule = { type: 'members', team: null, value: null };
