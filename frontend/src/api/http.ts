import type { ApiClient } from './client';
import { ApiError } from './client';
import type { AuthSession } from '@/auth/session';
import type { Dashboard, PublicConfig } from '@/lib/types';

/** REST client for the PHP backend. Tokens come from the club IdP. */
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

  private async request<T>(method: string, path: string, body?: unknown): Promise<T> {
    const token = await this.auth.accessToken();
    const res = await this.fetchImpl(`${this.baseUrl}${path}`, {
      method,
      headers: {
        Accept: 'application/json',
        ...(body !== undefined ? { 'Content-Type': 'application/json' } : {}),
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
    if (res.status === 204) return undefined as T;
    const data = await readJson(res, path);
    if (res.status === 401 && token) {
      // The backend rejected our token: the session is over (e.g. signed out elsewhere).
      await this.auth.forget();
      this.endedListeners.forEach((listener) => listener());
    }
    if (!res.ok) throw new ApiError(data.error ?? `HTTP ${res.status}`, res.status, data.fields ?? {});
    return data as T;
  }

  config() {
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

  async dashboard(): Promise<Dashboard> {
    try {
      return await this.request<Dashboard>('GET', '/dashboard');
    } catch (e) {
      // Token rejected: the session-ended listeners already ran; show the public page.
      if (e instanceof ApiError && e.status === 401) return this.request<Dashboard>('GET', '/dashboard');
      throw e;
    }
  }

  directory: ApiClient['directory'] = () => this.request('GET', '/directory');
  createSection: ApiClient['createSection'] = (input) => this.request('POST', '/sections', input);
  updateSection: ApiClient['updateSection'] = (id, input) => this.request('PUT', `/sections/${id}`, input);
  deleteSection: ApiClient['deleteSection'] = (id) => this.request('DELETE', `/sections/${id}`);
  reorderSections: ApiClient['reorderSections'] = (ids) => this.request('PUT', '/sections/order', { ids });
  createLink: ApiClient['createLink'] = (input) => this.request('POST', '/links', input);
  updateLink: ApiClient['updateLink'] = (id, input) => this.request('PUT', `/links/${id}`, input);
  deleteLink: ApiClient['deleteLink'] = (id) => this.request('DELETE', `/links/${id}`);
  reorderLinks: ApiClient['reorderLinks'] = (sectionId, ids) => this.request('PUT', `/sections/${sectionId}/links/order`, { ids });
}

/**
 * The API always answers JSON. HTML here means the request never reached PHP — typically the
 * web server's rewrite rules send /api to index.html (see README → Deployment).
 */
async function readJson(res: Response, path: string): Promise<Record<string, any>> {
  const type = res.headers.get('content-type') ?? '';
  if (!type.includes('json')) {
    throw new ApiError(`Server na /api${path} nevrací API, ale ${type.includes('html') ? 'HTML stránku' : `„${type || 'neznámý obsah'}“`} (HTTP ${res.status}). Zkontroluj přesměrování v .htaccess.`, res.status);
  }
  return res.json().catch(() => ({}));
}
