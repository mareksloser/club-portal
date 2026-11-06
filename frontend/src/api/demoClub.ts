import type { ClubApi } from './client';
import { ApiError } from './client';
import type { Coach, Licence, LicenceInput, LicenceState, Member, MemberKind, Person, PersonInput, Season, Team } from '@/lib/club';

/** In-memory club registry for the demo; mirrors the backend's rules closely enough to click through. */
const WARN = 90;

type Row<T> = T & { id: number };
const today = () => new Date(new Date().toDateString());
const iso = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
const inDays = (n: number) => iso(new Date(today().getTime() + n * 86_400_000));

export function createDemoClub(): ClubApi {
  let next = 1000;
  const seasons: Row<Omit<Season, 'teamCount'>>[] = [
    { id: 1, name: '2025/26', startsOn: '2025-07-01', endsOn: '2026-06-30' },
    { id: 2, name: '2026/27', startsOn: '2026-07-01', endsOn: '2027-06-30' },
  ];
  const teams: Row<{ seasonId: number; name: string; category: string | null; authTeam: string | null }>[] = [
    { id: 10, seasonId: 2, name: 'Mladší přípravka', category: 'U11', authTeam: 'u11' },
    { id: 11, seasonId: 2, name: 'Starší přípravka', category: 'U13', authTeam: 'u13' },
    { id: 12, seasonId: 2, name: 'A-tým', category: 'Muži', authTeam: 'a-tym' },
    { id: 13, seasonId: 1, name: 'Mladší přípravka', category: 'U11', authTeam: 'u11' },
  ];
  const p = (id: number, firstName: string, lastName: string, birthDate: string | null, extra: Partial<Person> = {}): Person => ({
    id, firstName, lastName, birthDate, facrId: null, email: null, phone: null, note: null, authSub: null, authName: null, ...extra,
  });
  const people: Person[] = [
    p(1, 'Jan', 'Novák', '1984-05-12', { authSub: 'demo', authName: 'Jan Novák <jan.novak@example.cz>', facrId: '84051234' }),
    p(2, 'Petra', 'Svobodová', '1990-02-01'),
    p(3, 'Karel', 'Dvořák', '1979-11-30', { authSub: 'u-k', authName: 'Karel Dvořák <karel@example.cz>' }),
    p(4, 'Tomáš', 'Černý', '1995-07-21'),
    p(5, 'Lukáš', 'Procházka', '1988-01-15'),
    p(20, 'Matyáš', 'Kučera', '2016-04-03', { facrId: '16040321' }),
    p(21, 'Vojtěch', 'Veselý', '2016-09-12'),
    p(22, 'Adam', 'Horák', '2017-01-22', { authSub: 'u-parent', authName: 'Martin Horák <horak@example.cz>' }),
    p(23, 'Ondřej', 'Němec', '2016-06-30'),
    p(24, 'Filip', 'Marek', '2016-11-05'),
    p(25, 'Šimon', 'Pokorný', '2017-03-17'),
  ];
  const members: Row<{ teamId: number; personId: number; kind: MemberKind; staffRole: string | null; jerseyNumber: number | null }>[] = [
    { id: 1, teamId: 10, personId: 1, kind: 'staff', staffRole: 'Hlavní trenér', jerseyNumber: null },
    { id: 2, teamId: 10, personId: 2, kind: 'staff', staffRole: 'Asistent trenéra', jerseyNumber: null },
    { id: 3, teamId: 11, personId: 3, kind: 'staff', staffRole: 'Hlavní trenér', jerseyNumber: null },
    { id: 4, teamId: 11, personId: 1, kind: 'staff', staffRole: 'Trenér brankářů', jerseyNumber: null },
    { id: 5, teamId: 12, personId: 4, kind: 'staff', staffRole: 'Hlavní trenér', jerseyNumber: null },
    { id: 6, teamId: 12, personId: 5, kind: 'staff', staffRole: 'Vedoucí týmu', jerseyNumber: null },
    ...[20, 21, 22, 23, 24, 25].map((personId, i) => ({ id: 10 + i, teamId: 10, personId, kind: 'player' as const, staffRole: null, jerseyNumber: [7, 10, 1, 4, 9, null][i]! })),
    { id: 30, teamId: 13, personId: 1, kind: 'staff', staffRole: 'Hlavní trenér', jerseyNumber: null },
  ];
  const licences: Omit<Licence, 'status' | 'daysLeft'>[] = [
    { id: 1, personId: 1, type: 'UEFA B', number: 'B-2231', issuedOn: '2023-06-01', validUntil: inDays(48), note: 'Doškolovací seminář přihlášen' },
    { id: 2, personId: 1, type: 'UEFA Grassroots C', number: null, issuedOn: '2019-05-01', validUntil: '2022-05-01', note: null },
    { id: 3, personId: 3, type: 'UEFA A', number: 'A-118', issuedOn: '2024-03-01', validUntil: inDays(640), note: null },
    { id: 4, personId: 4, type: 'UEFA B', number: null, issuedOn: '2022-01-10', validUntil: inDays(-23), note: null },
    { id: 5, personId: 2, type: 'UEFA Grassroots C', number: null, issuedOn: '2025-09-01', validUntil: inDays(1020), note: null },
  ];

  const pause = () => new Promise((r) => setTimeout(r, 120));
  const notFound = (what: string): never => {
    throw new ApiError(`${what} neexistuje.`, 404);
  };
  const invalid = (fields: Record<string, string>): never => {
    throw new ApiError('Formulář obsahuje chyby.', 422, fields);
  };
  const state = (validUntil: string | null): { status: Licence['status']; daysLeft: number | null } => {
    if (!validUntil) return { status: 'unlimited', daysLeft: null };
    const [y, m, d] = validUntil.split('-').map(Number);
    const n = Math.round((new Date(y!, m! - 1, d!).getTime() - today().getTime()) / 86_400_000);
    return { status: n < 0 ? 'expired' : n <= WARN ? 'expiring' : 'valid', daysLeft: n };
  };
  const licencesOf = (personId: number): Licence[] =>
    licences
      .filter((l) => l.personId === personId)
      .map((l) => ({ ...l, ...state(l.validUntil) }))
      .sort((a, b) => (b.validUntil ?? '9999').localeCompare(a.validUntil ?? '9999'));
  const person = (id: number) => people.find((x) => x.id === id) ?? notFound('Osoba');
  const teamRow = (id: number) => teams.find((t) => t.id === id) ?? notFound('Tým');
  const teamOut = (t: (typeof teams)[number]): Team => ({
    ...t,
    seasonName: seasons.find((s) => s.id === t.seasonId)!.name,
    playerCount: members.filter((m) => m.teamId === t.id && m.kind === 'player').length,
    staffCount: members.filter((m) => m.teamId === t.id && m.kind === 'staff').length,
  });
  const seasonOut = (s: (typeof seasons)[number]): Season => ({ ...s, teamCount: teams.filter((t) => t.seasonId === s.id).length });
  const sorted = <T extends { person: Person }>(rows: T[]) => rows.sort((a, b) => a.person.lastName.localeCompare(b.person.lastName, 'cs'));
  const teamDetail = (id: number) => {
    const t = teamRow(id);
    const rows: Member[] = members.filter((m) => m.teamId === id).map((m) => ({ ...m, person: person(m.personId) }));
    return {
      ...teamOut(t),
      players: sorted(rows.filter((m) => m.kind === 'player')).sort((a, b) => (a.jerseyNumber ?? 999) - (b.jerseyNumber ?? 999)),
      staff: sorted(rows.filter((m) => m.kind === 'staff')).map((m) => ({ ...m, licences: licencesOf(m.person.id) })),
      warnDays: WARN,
    };
  };
  const personDetail = (id: number) => ({
    ...person(id),
    memberships: members
      .filter((m) => m.personId === id)
      .map((m) => {
        const t = teamOut(teamRow(m.teamId));
        return { teamId: t.id, teamName: t.name, seasonId: t.seasonId, seasonName: t.seasonName, kind: m.kind, staffRole: m.staffRole, jerseyNumber: m.jerseyNumber };
      })
      .sort((a, b) => b.seasonName.localeCompare(a.seasonName)),
    licences: licencesOf(id),
    warnDays: WARN,
  });
  const checkPerson = (input: PersonInput, prefix = '') => {
    const f: Record<string, string> = {};
    if (!input.firstName?.trim()) f[`${prefix}firstName`] = 'Jméno je povinné.';
    if (!input.lastName?.trim()) f[`${prefix}lastName`] = 'Příjmení je povinné.';
    if (Object.keys(f).length) invalid(f);
  };
  const checkLicence = (input: LicenceInput) => {
    if (!input.type?.trim()) invalid({ type: 'Typ licence je povinné.' });
  };
  const currentId = () => {
    const t = iso(today());
    return seasons.find((s) => s.startsOn <= t && t <= s.endsOn)?.id ?? seasons[seasons.length - 1]?.id ?? null;
  };

  return {
    async seasons() {
      await pause();
      return { seasons: [...seasons].sort((a, b) => b.startsOn.localeCompare(a.startsOn)).map(seasonOut), currentId: currentId() };
    },
    async season(id) {
      await pause();
      const s = seasons.find((x) => x.id === id) ?? notFound('Sezona');
      return { ...seasonOut(s), teams: teams.filter((t) => t.seasonId === id).map(teamOut) };
    },
    async createSeason(input) {
      if (!input.name.trim()) invalid({ name: 'Název sezony je povinné.' });
      if (seasons.some((s) => s.name === input.name)) invalid({ name: 'Sezona s tímto názvem už existuje.' });
      if (!input.startsOn || !input.endsOn || input.endsOn <= input.startsOn) invalid({ endsOn: 'Konec musí být po začátku.' });
      const s = { id: next++, name: input.name.trim(), startsOn: input.startsOn, endsOn: input.endsOn };
      seasons.push(s);
      if (input.copyFrom) {
        for (const t of teams.filter((x) => x.seasonId === input.copyFrom)) {
          const copy = { ...t, id: next++, seasonId: s.id };
          teams.push(copy);
          members.filter((m) => m.teamId === t.id).forEach((m) => members.push({ ...m, id: next++, teamId: copy.id }));
        }
      }
      return seasonOut(s);
    },
    async updateSeason(id, input) {
      const s = seasons.find((x) => x.id === id) ?? notFound('Sezona');
      Object.assign(s, { name: input.name, startsOn: input.startsOn, endsOn: input.endsOn });
      return seasonOut(s);
    },
    async deleteSeason(id) {
      const ids = teams.filter((t) => t.seasonId === id).map((t) => t.id);
      seasons.splice(seasons.findIndex((s) => s.id === id), 1);
      for (const tid of ids) teams.splice(teams.findIndex((t) => t.id === tid), 1);
    },
    async team(id) {
      await pause();
      return teamDetail(id);
    },
    async createTeam(input) {
      if (!input.name.trim()) invalid({ name: 'Název týmu je povinné.' });
      const t = { id: next++, seasonId: input.seasonId, name: input.name.trim(), category: input.category, authTeam: input.authTeam };
      teams.push(t);
      return teamDetail(t.id);
    },
    async updateTeam(id, input) {
      Object.assign(teamRow(id), { name: input.name, category: input.category, authTeam: input.authTeam });
      return teamDetail(id);
    },
    async deleteTeam(id) {
      teams.splice(teams.findIndex((t) => t.id === id), 1);
    },
    async addMember(teamId, input) {
      let personId = input.personId;
      if (!personId) {
        checkPerson(input.person!, 'person.');
        personId = next++;
        people.push({ ...input.person!, id: personId, authSub: null, authName: null });
      } else if (members.some((m) => m.teamId === teamId && m.personId === personId && m.kind === input.kind)) {
        invalid({ personId: input.kind === 'player' ? 'Už je v soupisce hráčů.' : 'Už je v realizačním týmu.' });
      }
      members.push({ id: next++, teamId, personId, kind: input.kind, staffRole: input.staffRole ?? null, jerseyNumber: input.jerseyNumber ?? null });
      return teamDetail(teamId);
    },
    async updateMember(id, input) {
      const m = members.find((x) => x.id === id) ?? notFound('Člen týmu');
      if (input.jerseyNumber != null && (input.jerseyNumber < 0 || input.jerseyNumber > 99)) invalid({ jerseyNumber: 'Číslo dresu musí být celé číslo od 0 do 99.' });
      Object.assign(m, { staffRole: input.staffRole ?? null, jerseyNumber: input.jerseyNumber ?? null });
      return teamDetail(m.teamId);
    },
    async removeMember(id) {
      const i = members.findIndex((x) => x.id === id);
      const teamId = members[i]!.teamId;
      members.splice(i, 1);
      return teamDetail(teamId);
    },
    async people(query) {
      await pause();
      const q = query.trim().toLocaleLowerCase('cs');
      const list = people
        .filter((x) => !q || `${x.firstName} ${x.lastName} ${x.lastName} ${x.facrId ?? ''} ${x.authName ?? ''}`.toLocaleLowerCase('cs').includes(q))
        .sort((a, b) => a.lastName.localeCompare(b.lastName, 'cs'));
      return { people: list };
    },
    async person(id) {
      await pause();
      return personDetail(id);
    },
    async createPerson(input) {
      checkPerson(input);
      const x = { ...input, id: next++, authSub: null, authName: null };
      people.push(x);
      return personDetail(x.id);
    },
    async updatePerson(id, input) {
      checkPerson(input);
      Object.assign(person(id), input);
      return personDetail(id);
    },
    async deletePerson(id) {
      people.splice(people.findIndex((x) => x.id === id), 1);
      for (let i = members.length - 1; i >= 0; i--) if (members[i]!.personId === id) members.splice(i, 1);
    },
    async linkAccount(id, account) {
      if (account) {
        const other = people.find((x) => x.authSub === account.sub && x.id !== id);
        if (other) invalid({ sub: `Účet už je propojený s osobou ${other.firstName} ${other.lastName}.` });
      }
      Object.assign(person(id), account ? { authSub: account.sub, authName: `${account.name} <${account.email}>` } : { authSub: null, authName: null });
      return personDetail(id);
    },
    async addLicence(personId, input) {
      checkLicence(input);
      licences.push({ ...input, id: next++, personId });
      return personDetail(personId);
    },
    async updateLicence(id, input) {
      checkLicence(input);
      const l = licences.find((x) => x.id === id) ?? notFound('Licence');
      Object.assign(l, input);
      return personDetail(l.personId);
    },
    async deleteLicence(id) {
      const i = licences.findIndex((x) => x.id === id);
      const personId = licences[i]!.personId;
      licences.splice(i, 1);
      return personDetail(personId);
    },
    async coaches(seasonId) {
      await pause();
      const id = seasonId ?? currentId();
      const season = seasons.find((s) => s.id === id);
      const all = [...seasons].sort((a, b) => b.startsOn.localeCompare(a.startsOn)).map(seasonOut);
      if (!season) return { season: null, seasons: all, warnDays: WARN, summary: null, coaches: [] };
      const teamIds = teams.filter((t) => t.seasonId === id).map((t) => t.id);
      const byPerson = new Map<number, Coach>();
      for (const m of members.filter((x) => x.kind === 'staff' && teamIds.includes(x.teamId))) {
        const coach = byPerson.get(m.personId) ?? { person: person(m.personId), teams: [], licences: licencesOf(m.personId), status: 'missing' as LicenceState, daysLeft: null };
        coach.teams.push({ teamId: m.teamId, teamName: teamRow(m.teamId).name, staffRole: m.staffRole });
        byPerson.set(m.personId, coach);
      }
      const order: Record<LicenceState, number> = { expired: 0, expiring: 1, missing: 2, valid: 3, unlimited: 4 };
      const coaches = [...byPerson.values()].map((c) => ({ ...c, status: c.licences[0]?.status ?? ('missing' as LicenceState), daysLeft: c.licences[0]?.daysLeft ?? null }));
      coaches.sort((a, b) => order[a.status] - order[b.status] || (a.daysLeft ?? 1e9) - (b.daysLeft ?? 1e9));
      const count = (s: LicenceState) => coaches.filter((c) => c.status === s).length;
      return {
        season: seasonOut(season),
        seasons: all,
        warnDays: WARN,
        summary: { coaches: coaches.length, expired: count('expired'), expiring: count('expiring'), missing: count('missing'), valid: count('valid') + count('unlimited') },
        coaches,
      };
    },
    async accounts(query) {
      await pause();
      const all = [
        { sub: 'u-novak', name: 'Jan Novák', email: 'jan.novak@example.cz', active: true },
        { sub: 'u-svob', name: 'Petra Svobodová', email: 'petra@example.cz', active: true },
        { sub: 'u-cerny', name: 'Tomáš Černý', email: 'tomas.cerny@example.cz', active: true },
        { sub: 'u-proch', name: 'Lukáš Procházka', email: 'lukas@example.cz', active: false },
      ];
      const q = query.trim().toLocaleLowerCase('cs');
      return { users: q.length < 2 ? [] : all.filter((u) => `${u.name} ${u.email}`.toLocaleLowerCase('cs').includes(q)) };
    },
  };
}
