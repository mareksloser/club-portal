import {
  Activity, Baby, Banknote, Bell, BookOpen, Building2, Bus, CalendarCheck, CalendarDays, Camera, Car, ChartColumn, ChartLine,
  Clapperboard, ClipboardList, Cloud, Coffee, Cone, Database, Dumbbell, FileText, Film, Flag, Folder, Globe, Goal,
  GraduationCap, Handshake, HeartPulse, House, Image, KeyRound, Link, ListChecks, Lock, Mail, MapPin, Medal, Megaphone,
  MessageCircle, Newspaper, Phone, Presentation, Puzzle, Receipt, Server, Settings, ShieldCheck, Shirt, Star, Store,
  Ticket, Timer, Trophy, UserRound, Users, Utensils, Video, Volleyball, Wallet, Wrench, type LucideIcon,
} from 'lucide-react';

/**
 * Curated icon set for links (kebab-case name → component). Only these are bundled, so the app
 * stays small; the backend accepts any `lucide:<name>`, unknown names fall back to a link icon.
 */
export const ICONS: Record<string, LucideIcon> = {
  'clapperboard': Clapperboard, 'video': Video, 'film': Film, 'camera': Camera, 'image': Image,
  'calendar-days': CalendarDays, 'calendar-check': CalendarCheck, 'timer': Timer, 'bell': Bell,
  'trophy': Trophy, 'medal': Medal, 'goal': Goal, 'volleyball': Volleyball, 'cone': Cone, 'dumbbell': Dumbbell,
  'shirt': Shirt, 'flag': Flag, 'activity': Activity, 'heart-pulse': HeartPulse,
  'users': Users, 'user-round': UserRound, 'baby': Baby, 'handshake': Handshake, 'graduation-cap': GraduationCap,
  'presentation': Presentation, 'clipboard-list': ClipboardList, 'list-checks': ListChecks, 'puzzle': Puzzle,
  'file-text': FileText, 'folder': Folder, 'book-open': BookOpen, 'newspaper': Newspaper, 'megaphone': Megaphone,
  'mail': Mail, 'message-circle': MessageCircle, 'phone': Phone,
  'chart-column': ChartColumn, 'chart-line': ChartLine, 'banknote': Banknote, 'wallet': Wallet, 'receipt': Receipt,
  'ticket': Ticket, 'store': Store, 'utensils': Utensils, 'coffee': Coffee,
  'house': House, 'building': Building2, 'map-pin': MapPin, 'car': Car, 'bus': Bus,
  'globe': Globe, 'link': Link, 'shield-check': ShieldCheck, 'lock': Lock, 'key-round': KeyRound,
  'settings': Settings, 'wrench': Wrench, 'database': Database, 'server': Server, 'cloud': Cloud, 'star': Star,
};

export const ICON_NAMES = Object.keys(ICONS);

export type ParsedIcon = { kind: 'lucide'; Icon: LucideIcon; name: string } | { kind: 'image'; src: string } | { kind: 'none' };

/** Pure: "lucide:trophy" / "url:https://…" → what to render. Only http(s) images. */
export function parseIcon(icon: string | null): ParsedIcon {
  if (icon?.startsWith('lucide:')) {
    const name = icon.slice(7);
    return { kind: 'lucide', Icon: ICONS[name] ?? Link, name };
  }
  if (icon?.startsWith('url:')) {
    const src = icon.slice(4);
    if (/^https?:\/\//i.test(src)) return { kind: 'image', src };
  }
  return { kind: 'none' };
}
