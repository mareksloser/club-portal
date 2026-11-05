import type { ApiClient } from './client';
import { ApiError } from './client';
import type { AccessType, Dashboard, Directory, Link, LinkInput, PublicConfig, Section, SectionInput } from '@/lib/types';

/** In-memory API for `pnpm dev:demo`: no backend, no IdP. You are an editor of a sample portal. */
export class DemoApiClient implements ApiClient {
  private signedIn = true;
  private nextId = 100;
  private sections: Omit<Section, 'links'>[] = [
    { id: 1, title: 'Aplikace', layout: 'tiles' },
    { id: 2, title: 'Záložky', layout: 'columns' },
  ];
  private links: Link[] = [
    link(1, 1, null, 'Videorozbory', 'mvr.mareksloser.cz', 'lucide:clapperboard', 'members'),
    link(2, 1, null, 'Rezervace hřiště', 'pitch.mareksloser.cz', 'lucide:calendar-days', 'team', null, 'coach'),
    link(3, 1, null, 'Videotéka', 'Sestřihy zápasů všech týmů', 'lucide:film', 'public'),
    link(4, 1, null, 'Taktická tabule', 'Animace herních situací', 'lucide:presentation', 'team', null, 'coach'),
    link(5, 1, null, 'Statistiky', 'Góly, karty, minuty z FAČR', 'lucide:chart-column', 'members'),
    link(6, 1, null, 'Docházka U11', 'Tréninky a zápasy', 'lucide:list-checks', 'team', 'u11', null),
    link(7, 1, null, 'Klubový účet', 'Heslo, dvoufázové ověření', 'lucide:shield-check', 'members'),
    link(8, 1, null, 'Správa účtů', 'auth.mareksloser.cz/admin', 'lucide:settings', 'editors'),
    link(9, 2, 'Klub', 'Web klubu', null, 'lucide:globe', 'public'),
    link(10, 2, 'Klub', 'Facebook', null, 'lucide:message-circle', 'public'),
    link(11, 2, 'Klub', 'Rozpis zápasů', null, 'lucide:calendar-check', 'public'),
    link(12, 2, 'Trenéři', 'Metodika FAČR', null, 'lucide:book-open', 'team', null, 'coach'),
    link(13, 2, 'Trenéři', 'Sdílený disk', null, 'lucide:folder', 'team', null, 'coach'),
    link(14, 2, 'Výbor', 'Zápisy ze schůzí', null, 'lucide:file-text', 'role', null, 'vybor'),
    link(15, 2, 'Výbor', 'Rozpočet', null, 'lucide:wallet', 'role', null, 'vybor'),
  ];

  async config(): Promise<PublicConfig> {
    return { clubName: 'SK Baník Libušín', issuer: 'https://auth.example.cz', weather: { lat: 50.1683, lon: 14.0546 } };
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
  onSessionEnded(): () => void {
    return () => undefined;
  }

  async dashboard(): Promise<Dashboard> {
    await pause();
    const editor = this.signedIn;
    const visible = (l: Link) => editor || l.access!.type === 'public';
    return {
      member: this.signedIn
        ? { sub: 'demo', name: 'Jan Novák', email: 'jan.novak@example.cz', teams: [{ slug: 'u11', name: 'Mladší přípravka', membership: 'coach' }] }
        : null,
      editor,
      sections: this.sections
        .map((s) => ({
          ...s,
          links: this.links
            .filter((l) => l.sectionId === s.id && visible(l))
            .map((l) => (editor ? { ...l, visibleToMe: l.access!.type !== 'role' && l.access!.type !== 'editors' } : { ...l, access: undefined })),
        }))
        .filter((s) => editor || s.links.length > 0),
    };
  }

  async directory(): Promise<Directory> {
    return {
      teams: [
        { slug: 'a-tym', name: 'A-tým' },
        { slug: 'u13', name: 'Starší přípravka' },
        { slug: 'u11', name: 'Mladší přípravka' },
        { slug: 'u9', name: 'Mini žáci' },
      ],
      roles: [
        { slug: 'admin', description: 'Upravuje rozcestník' },
        { slug: 'vybor', description: 'Výbor klubu' },
      ],
    };
  }

  async createSection(input: SectionInput) {
    const section = { id: this.nextId++, ...checkSection(input) };
    this.sections.push(section);
    return section;
  }
  async updateSection(id: number, input: SectionInput) {
    const section = this.sections.find((s) => s.id === id) ?? notFound();
    Object.assign(section, checkSection(input));
    return section;
  }
  async deleteSection(id: number) {
    this.sections = this.sections.filter((s) => s.id !== id);
    this.links = this.links.filter((l) => l.sectionId !== id);
  }
  async reorderSections(ids: number[]) {
    this.sections = ids.map((id) => this.sections.find((s) => s.id === id) ?? notFound());
  }
  async createLink(input: LinkInput) {
    const created: Link = { id: this.nextId++, ...checkLink(input) };
    this.links.push(created);
    return created;
  }
  async updateLink(id: number, input: LinkInput) {
    const index = this.links.findIndex((l) => l.id === id);
    if (index < 0) notFound();
    const updated: Link = { id, ...checkLink(input) };
    const moved = this.links[index]!.sectionId !== updated.sectionId;
    this.links.splice(index, 1);
    if (moved) this.links.push(updated);
    else this.links.splice(index, 0, updated);
    return updated;
  }
  async deleteLink(id: number) {
    this.links = this.links.filter((l) => l.id !== id);
  }
  async reorderLinks(sectionId: number, ids: number[]) {
    const others = this.links.filter((l) => l.sectionId !== sectionId);
    this.links = [...others, ...ids.map((id) => this.links.find((l) => l.id === id) ?? notFound())];
  }
}

function link(id: number, sectionId: number, column: string | null, title: string, subtitle: string | null, icon: string, type: AccessType, team: string | null = null, value: string | null = null): Link {
  return { id, sectionId, column, title, subtitle, url: 'https://example.cz/', icon, newTab: false, access: { type, team, value } };
}

const pause = () => new Promise((resolve) => setTimeout(resolve, 150));
const notFound = (): never => {
  throw new ApiError('Nenalezeno.', 404);
};

function checkSection(input: SectionInput): SectionInput {
  if (!input.title.trim()) throw new ApiError('Formulář obsahuje chyby.', 422, { title: 'Název sekce je povinný (max. 60 znaků).' });
  return { title: input.title.trim(), layout: input.layout };
}

function checkLink(input: LinkInput): LinkInput {
  const fields: Record<string, string> = {};
  if (!input.title.trim()) fields.title = 'Název je povinný (max. 80 znaků).';
  if (!/^https?:\/\/[^/]+/i.test(input.url)) fields.url = 'Zadej celou adresu začínající https:// (nebo http://).';
  if (input.access.type === 'role' && !input.access.value) fields['access.value'] = 'Vyber roli.';
  if (input.access.type === 'team' && !input.access.team && !input.access.value) fields['access.team'] = 'Vyber tým, nebo typ členství (např. trenéři všech týmů).';
  if (Object.keys(fields).length) throw new ApiError('Formulář obsahuje chyby.', 422, fields);
  return input;
}
