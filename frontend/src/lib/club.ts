/** Club registry: API shapes and pure helpers for display. */

export type MemberKind = 'player' | 'staff';
export type LicenceState = 'valid' | 'expiring' | 'expired' | 'unlimited' | 'missing';

export interface Season {
  id: number;
  name: string;
  startsOn: string;
  endsOn: string;
  teamCount: number;
}

export interface Team {
  id: number;
  seasonId: number;
  seasonName: string;
  name: string;
  category: string | null;
  authTeam: string | null;
  playerCount: number;
  staffCount: number;
}

export interface Person {
  id: number;
  firstName: string;
  lastName: string;
  birthDate: string | null;
  facrId: string | null;
  email: string | null;
  phone: string | null;
  note: string | null;
  authSub: string | null;
  authName: string | null;
}

export interface Licence {
  id: number;
  personId: number;
  type: string;
  number: string | null;
  issuedOn: string | null;
  validUntil: string | null;
  note: string | null;
  status: Exclude<LicenceState, 'missing'>;
  daysLeft: number | null;
}

export interface Member {
  id: number;
  teamId: number;
  kind: MemberKind;
  staffRole: string | null;
  jerseyNumber: number | null;
  person: Person;
  licences?: Licence[];
}

export interface TeamDetail extends Team {
  players: Member[];
  staff: Member[];
  warnDays: number;
}

export interface Membership {
  teamId: number;
  teamName: string;
  seasonId: number;
  seasonName: string;
  kind: MemberKind;
  staffRole: string | null;
  jerseyNumber: number | null;
}

export interface PersonDetail extends Person {
  memberships: Membership[];
  licences: Licence[];
  warnDays: number;
}

export interface Coach {
  person: Person;
  teams: { teamId: number; teamName: string; staffRole: string | null }[];
  licences: Licence[];
  status: LicenceState;
  daysLeft: number | null;
}

export interface CoachesDashboard {
  season: Season | null;
  seasons: Season[];
  warnDays: number;
  summary: { coaches: number; expired: number; expiring: number; missing: number; valid: number } | null;
  coaches: Coach[];
}

export interface Account {
  sub: string;
  name: string;
  email: string;
  active: boolean;
}

export type SeasonInput = { name: string; startsOn: string; endsOn: string; copyFrom?: number | null };
export type TeamInput = { seasonId?: number; name: string; category: string | null; authTeam: string | null };
export type PersonInput = Pick<Person, 'firstName' | 'lastName' | 'birthDate' | 'facrId' | 'email' | 'phone' | 'note'>;
export type MemberInput = { kind: MemberKind; personId?: number; person?: PersonInput; staffRole?: string | null; jerseyNumber?: number | null };
export type LicenceInput = Pick<Licence, 'type' | 'number' | 'issuedOn' | 'validUntil' | 'note'>;

/** Suggestions only; any text is accepted. */
export const LICENCE_TYPES = ['UEFA Grassroots C', 'UEFA B', 'UEFA A', 'UEFA Pro', 'UEFA Goalkeeper B', 'UEFA Goalkeeper A', 'UEFA Futsal B'];
export const STAFF_ROLES = ['Hlavní trenér', 'Asistent trenéra', 'Trenér brankářů', 'Vedoucí týmu', 'Kondiční trenér', 'Fyzioterapeut'];

export const fullName = (p: Pick<Person, 'firstName' | 'lastName'>) => `${p.firstName} ${p.lastName}`;
export const sortName = (p: Pick<Person, 'firstName' | 'lastName'>) => `${p.lastName} ${p.firstName}`;

/** "1 den", "3 dny", "5 dní" */
export function days(n: number): string {
  const abs = Math.abs(n);
  if (abs === 1) return `${abs} den`;
  if (abs >= 2 && abs <= 4) return `${abs} dny`;
  return `${abs} dní`;
}

/** "před 1 dnem", "před 3 dny" */
function daysAgo(n: number): string {
  return n === 1 ? 'před 1 dnem' : `před ${n} dny`;
}

const dateFormat = new Intl.DateTimeFormat('cs-CZ', { day: 'numeric', month: 'numeric', year: 'numeric' });

/** "2026-12-31" → "31. 12. 2026" */
export function czDate(iso: string | null): string {
  if (!iso) return '';
  const [y, m, d] = iso.split('-').map(Number);
  return dateFormat.format(new Date(y!, m! - 1, d!));
}

export const LICENCE_LABELS: Record<LicenceState, string> = {
  expired: 'Prošlá',
  expiring: 'Brzy vyprší',
  missing: 'Bez licence',
  valid: 'Platná',
  unlimited: 'Bez omezení',
};

/** The detail line next to a status: "vyprší za 55 dní", "prošla před 36 dny", "platí do 31. 12. 2026". */
export function licenceDetail(state: LicenceState, daysLeft: number | null, validUntil: string | null): string {
  if (state === 'missing') return 'žádná licence v evidenci';
  if (state === 'unlimited' || daysLeft === null) return 'bez data platnosti';
  if (state === 'expired') return `prošla ${daysAgo(-daysLeft)}`;
  if (daysLeft === 0) return 'platí poslední den';
  if (state === 'expiring') return `vyprší za ${days(daysLeft)}`;
  return `platí do ${czDate(validUntil)}`;
}

/** Birth year (ročník), the way youth football talks about age. */
export const birthYear = (iso: string | null) => (iso ? iso.slice(0, 4) : '');
