import type { Link } from './types';

/** Helpers for sections and their links. Pure. */

/** Columns of a `columns` section in the order of their first link; links without a column go to "". */
export function groupByColumn(links: Link[]): { column: string; links: Link[] }[] {
  const groups = new Map<string, Link[]>();
  for (const link of links) {
    const key = link.column ?? '';
    groups.set(key, [...(groups.get(key) ?? []), link]);
  }
  return [...groups.entries()].map(([column, links]) => ({ column, links }));
}

/**
 * New id order after moving `id` one step (`delta` −1 / +1) among the items for which
 * `sameGroup` holds (e.g. the same column). Returns null when it can't move further.
 */
export function moveId<T extends { id: number }>(items: T[], id: number, delta: -1 | 1, sameGroup: (a: T, b: T) => boolean = () => true): number[] | null {
  const index = items.findIndex((i) => i.id === id);
  if (index < 0) return null;
  const item = items[index]!;
  let target = index + delta;
  while (target >= 0 && target < items.length && !sameGroup(items[target]!, item)) target += delta;
  if (target < 0 || target >= items.length) return null;
  const ids = items.map((i) => i.id);
  [ids[index], ids[target]] = [ids[target]!, ids[index]!];
  return ids;
}

/** "https://mvr.example.cz/login" → "mvr.example.cz" (the subtitle when none is set). */
export function hostOf(url: string): string {
  try {
    return new URL(url).host;
  } catch {
    return url;
  }
}
