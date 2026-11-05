import type { ApiClient } from './client';
import type { Dashboard, PublicConfig } from '@/lib/types';

/** In-memory API for `npm run dev:demo`: no backend, no IdP, sample apps. */
export class DemoApiClient implements ApiClient {
  private signedIn = true;

  async config(): Promise<PublicConfig> {
    return { clubName: 'SK Baník Libušín' };
  }

  async signIn() {
    this.signedIn = true;
  }

  async completeSignIn() {
    return { returnTo: null };
  }

  async logout() {
    this.signedIn = false;
  }

  async dashboard(): Promise<Dashboard | null> {
    await new Promise((resolve) => setTimeout(resolve, 250));
    return this.signedIn ? DEMO_DASHBOARD : null;
  }

  onSessionEnded(): () => void {
    return () => undefined;
  }
}

const DEMO_DASHBOARD: Dashboard = {
  member: {
    sub: 'demo',
    name: 'Jan Novák',
    email: 'jan.novak@example.cz',
    teams: [
      { slug: 'u11', name: 'Mladší přípravka', membership: 'coach' },
      { slug: 'u13', name: 'Starší přípravka', membership: 'coach' },
      { slug: 'u9', name: 'Mini žáci', membership: 'parent' },
    ],
    superadmin: true,
  },
  apps: [
    {
      clientId: 'mvr-web',
      name: 'Match Video Review',
      description: 'Rozbory zápasů s časovými značkami a taktickými kresbami.',
      url: 'https://mvr.example.cz/login',
      logoUrl: null,
      accentColor: '#128c54',
      roles: [{ role: 'coach', team: null, teamName: null }],
      access: 'role',
    },
    {
      clientId: 'pitch-web',
      name: 'Rezervace hřiště',
      description: 'Kdo kdy trénuje na Hlavním hřišti. Celé, půlka, čtvrtka.',
      url: 'https://pitch.example.cz/',
      logoUrl: null,
      accentColor: '#1d4ed8',
      roles: [
        { role: 'booker', team: 'u11', teamName: 'Mladší přípravka' },
        { role: 'booker', team: 'u13', teamName: 'Starší přípravka' },
      ],
      access: 'role',
    },
    {
      clientId: 'videoteka',
      name: 'Videotéka',
      description: 'Sestřihy a celé záznamy zápasů všech týmů.',
      url: 'https://videoteka.example.cz/',
      logoUrl: null,
      accentColor: '#d3012a',
      roles: [],
      access: 'public',
    },
    {
      clientId: 'taktika',
      name: 'Taktická tabule',
      description: null,
      url: 'https://taktika.example.cz/',
      logoUrl: null,
      accentColor: null,
      roles: [],
      access: 'superadmin',
    },
  ],
  links: { account: 'https://auth.example.cz/', admin: 'https://auth.example.cz/admin' },
};
