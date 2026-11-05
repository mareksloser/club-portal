import type { ApiClient } from './client';
import { ApiError } from './client';
import type { AuthSession } from '@/auth/session';
import type { Dashboard, PublicConfig } from '@/lib/types';

/** REST client for the PHP backend (see README for the endpoint list). Tokens come from the club IdP. */
export class HttpApiClient implements ApiClient {
  private readonly endedListeners = new Set<() => void>();

  constructor(
    private readonly baseUrl: string,
    private readonly auth: AuthSession,
    private readonly loadConfig: () => Promise<PublicConfig>,
    private readonly fetchImpl: typeof fetch = (...a) => fetch(...a),
  ) {}

  onSessionEnded(listener: () => void): () => void {
    this.endedListeners.add(listener);
    const unsubscribe = this.auth.onEnded(listener);
    return () => {
      this.endedListeners.delete(listener);
      unsubscribe();
    };
  }

  config(): Promise<PublicConfig> {
    return this.loadConfig();
  }

  async signIn({ returnTo }: { returnTo?: string } = {}) {
    await this.auth.signIn(returnTo);
  }

  async completeSignIn() {
    return { returnTo: await this.auth.completeSignIn() };
  }

  async logout() {
    await this.auth.signOut();
  }

  async dashboard(): Promise<Dashboard | null> {
    const token = await this.auth.accessToken();
    if (!token) return null;
    const res = await this.fetchImpl(`${this.baseUrl}/dashboard`, {
      headers: { Accept: 'application/json', Authorization: `Bearer ${token}` },
    });
    const data = await res.json().catch(() => ({}));
    if (res.status === 401) {
      // The backend rejected our token: the session is over (e.g. signed out elsewhere).
      await this.auth.forget();
      this.endedListeners.forEach((listener) => listener());
      return null;
    }
    if (!res.ok) throw new ApiError(data.error ?? `HTTP ${res.status}`, res.status, data.fields ?? {});
    return data as Dashboard;
  }
}
