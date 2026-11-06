import type { Dashboard, Directory, Link, LinkInput, PublicConfig, Section, SectionInput } from '@/lib/types';
import type {
  Account, CoachesDashboard, LicenceInput, MemberInput, Person, PersonDetail, PersonInput, Season, SeasonInput, Team, TeamDetail, TeamInput,
} from '@/lib/club';

export class ApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly fields: Record<string, string> = {},
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

/**
 * The one boundary between UI and data. `HttpApiClient` talks to the PHP backend,
 * `DemoApiClient` keeps everything in memory — and tests can pass their own fake.
 */
export interface ApiClient {
  config(): Promise<PublicConfig>;
  /** HTTP: redirects to the club login. Demo: signs in right away. */
  signIn(options?: { returnTo?: string }): Promise<void>;
  /** After the redirect back from the club login: where to continue. */
  completeSignIn(): Promise<{ returnTo: string | null }>;
  logout(): Promise<void>;
  /** Signed-in or not: anonymous visitors get the public links. */
  dashboard(): Promise<Dashboard>;
  /** The sign-in ended elsewhere (other device, admin, expiry). Returns an unsubscribe function. */
  onSessionEnded(listener: () => void): () => void;

  // Edit mode (editors only)
  directory(): Promise<Directory>;
  createSection(input: SectionInput): Promise<Omit<Section, 'links'>>;
  updateSection(id: number, input: SectionInput): Promise<Omit<Section, 'links'>>;
  deleteSection(id: number): Promise<void>;
  reorderSections(ids: number[]): Promise<void>;
  createLink(input: LinkInput): Promise<Link>;
  updateLink(id: number, input: LinkInput): Promise<Link>;
  deleteLink(id: number): Promise<void>;
  reorderLinks(sectionId: number, ids: number[]): Promise<void>;

  // Club registry (editors only)
  club: ClubApi;
}

export interface ClubApi {
  seasons(): Promise<{ seasons: Season[]; currentId: number | null }>;
  season(id: number): Promise<Season & { teams: Team[] }>;
  createSeason(input: SeasonInput): Promise<Season>;
  updateSeason(id: number, input: SeasonInput): Promise<Season>;
  deleteSeason(id: number): Promise<void>;
  team(id: number): Promise<TeamDetail>;
  createTeam(input: TeamInput & { seasonId: number }): Promise<TeamDetail>;
  updateTeam(id: number, input: TeamInput): Promise<TeamDetail>;
  deleteTeam(id: number): Promise<void>;
  addMember(teamId: number, input: MemberInput): Promise<TeamDetail>;
  updateMember(id: number, input: { staffRole?: string | null; jerseyNumber?: number | null }): Promise<TeamDetail>;
  removeMember(id: number): Promise<TeamDetail>;
  people(query: string): Promise<{ people: Person[] }>;
  person(id: number): Promise<PersonDetail>;
  createPerson(input: PersonInput): Promise<PersonDetail>;
  updatePerson(id: number, input: PersonInput): Promise<PersonDetail>;
  deletePerson(id: number): Promise<void>;
  linkAccount(id: number, account: Pick<Account, 'sub' | 'name' | 'email'> | null): Promise<PersonDetail>;
  addLicence(personId: number, input: LicenceInput): Promise<PersonDetail>;
  updateLicence(id: number, input: LicenceInput): Promise<PersonDetail>;
  deleteLicence(id: number): Promise<PersonDetail>;
  coaches(seasonId?: number | null): Promise<CoachesDashboard>;
  accounts(query: string): Promise<{ users: Account[] }>;
}
