import type { Dashboard, PublicConfig } from '@/lib/types';

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
  /** Public settings (club name). */
  config(): Promise<PublicConfig>;
  /** HTTP: redirects to the club login. Demo: signs in right away. */
  signIn(options?: { returnTo?: string }): Promise<void>;
  /** After the redirect back from the club login: where to continue. */
  completeSignIn(): Promise<{ returnTo: string | null }>;
  /** Signs out here and at the club login. */
  logout(): Promise<void>;
  /** The home screen; null when nobody is signed in. */
  dashboard(): Promise<Dashboard | null>;
  /**
   * The sign-in ended without signing out here (signed out on another device, by an admin,
   * or the session expired). Returns an unsubscribe function.
   */
  onSessionEnded(listener: () => void): () => void;
}
