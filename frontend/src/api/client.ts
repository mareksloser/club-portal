import type { Dashboard, Directory, Link, LinkInput, PublicConfig, Section, SectionInput } from '@/lib/types';

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
}
