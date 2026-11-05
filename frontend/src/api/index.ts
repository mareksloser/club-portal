import type { ApiClient } from './client';
import { DemoApiClient } from './demo';
import { HttpApiClient } from './http';
import { OidcAuthSession } from '@/auth/session';
import type { PublicConfig } from '@/lib/types';

export const isDemo = import.meta.env.VITE_API_MODE === 'demo';

type ServerConfig = PublicConfig & { issuer: string; clientId: string };

export function createApiClient(): ApiClient {
  if (isDemo) return new DemoApiClient();
  const base = import.meta.env.VITE_API_BASE ?? '/api';
  // One request serves both the OIDC settings and the public config.
  let pending: Promise<ServerConfig> | null = null;
  const load = () =>
    (pending ??= fetchConfig(base).catch((e: unknown) => {
      pending = null; // backend down: try again next time
      throw e;
    }));
  return new HttpApiClient(base, new OidcAuthSession(load), load);
}

async function fetchConfig(base: string): Promise<ServerConfig> {
  const res = await fetch(`${base}/auth/config`, { headers: { Accept: 'application/json' } });
  if (!res.ok) throw new Error(`Nepodařilo se načíst nastavení přihlášení (HTTP ${res.status}).`);
  return (await res.json()) as ServerConfig;
}

export type { ApiClient } from './client';
