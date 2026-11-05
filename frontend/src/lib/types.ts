/** Shapes of the portal API (see backend/README). */

export type AccessType = 'public' | 'members' | 'team' | 'role' | 'editors';
export type Membership = 'player' | 'coach' | 'parent' | 'staff';
export type Layout = 'tiles' | 'columns';

/** Who may see a link. `value` = membership for `team`, role slug for `role`. */
export interface AccessRule {
  type: AccessType;
  team: string | null;
  value: string | null;
}

export interface Team {
  slug: string;
  name: string;
  membership: Membership | string;
}

export interface Member {
  sub: string;
  name: string;
  email: string | null;
  teams: Team[];
}

export interface Link {
  id: number;
  sectionId: number;
  column: string | null;
  title: string;
  subtitle: string | null;
  url: string;
  /** "lucide:<name>" | "url:https://…" | null */
  icon: string | null;
  newTab: boolean;
  /** Editors only */
  access?: AccessRule;
  /** Editors only: whether they'd see it without the editor role */
  visibleToMe?: boolean;
}

export interface Section {
  id: number;
  title: string;
  layout: Layout;
  links: Link[];
}

export interface Dashboard {
  member: Member | null;
  editor: boolean;
  sections: Section[];
}

export interface PublicConfig {
  clubName: string;
  /** Club IdP; its root is the member's account page */
  issuer?: string;
  weather: { lat: number; lon: number } | null;
}

export interface Directory {
  teams: { slug: string; name: string }[];
  roles: { slug: string; description: string | null }[];
}

export type SectionInput = { title: string; layout: Layout };

export type LinkInput = {
  sectionId: number;
  column: string | null;
  title: string;
  subtitle: string | null;
  url: string;
  icon: string | null;
  newTab: boolean;
  access: AccessRule;
};
