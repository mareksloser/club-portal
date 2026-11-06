import { ChevronDown, ChevronUp, Pencil, Plus } from 'lucide-react';
import type { Directory, Link, Section } from '@/lib/types';
import { groupByColumn, moveId } from '@/lib/links';
import { BookmarkLink, IconButton, TileLink, type EditControls } from './LinkItem';

export interface SectionEditing {
  directory: Directory | null | undefined;
  canMoveUp: boolean;
  canMoveDown: boolean;
  onMoveSection: (delta: -1 | 1) => void;
  onEditSection: () => void;
  onAddLink: (column: string | null) => void;
  onEditLink: (link: Link) => void;
  onReorderLinks: (ids: number[]) => void;
}

export function SectionBlock({ section, editing }: { section: Section; editing: SectionEditing | null }) {
  const controls = (link: Link, axis: EditControls['axis'], sameGroup?: (a: Link, b: Link) => boolean): EditControls | undefined => {
    if (!editing) return undefined;
    const up = moveId(section.links, link.id, -1, sameGroup);
    const down = moveId(section.links, link.id, 1, sameGroup);
    return {
      directory: editing.directory,
      onEdit: () => editing.onEditLink(link),
      onMove: (delta) => {
        const ids = delta < 0 ? up : down;
        if (ids) editing.onReorderLinks(ids);
      },
      canMoveUp: up !== null,
      canMoveDown: down !== null,
      axis,
    };
  };

  return (
    <section aria-labelledby={`section-${section.id}`} className="mt-14 first:mt-0">
      <div className="flex items-center gap-2">
        <h2 id={`section-${section.id}`} className="text-xl font-extrabold uppercase tracking-wide">
          {section.title}
        </h2>
        {editing && (
          <div className="flex items-center">
            <IconButton label="Posunout sekci výš" disabled={!editing.canMoveUp} onClick={() => editing.onMoveSection(-1)}>
              <ChevronUp className="h-4 w-4" />
            </IconButton>
            <IconButton label="Posunout sekci níž" disabled={!editing.canMoveDown} onClick={() => editing.onMoveSection(1)}>
              <ChevronDown className="h-4 w-4" />
            </IconButton>
            <IconButton label={`Upravit sekci ${section.title}`} onClick={editing.onEditSection}>
              <Pencil className="h-3.5 w-3.5" />
            </IconButton>
          </div>
        )}
      </div>

      {section.layout === 'tiles' ? (
        <ul className="mt-5 grid gap-x-8 gap-y-7 sm:grid-cols-2 lg:grid-cols-4">
          {section.links.map((link) => (
            <li key={link.id}>
              <TileLink link={link} edit={controls(link, 'row')} />
            </li>
          ))}
          {editing && (
            <li>
              <AddButton onClick={() => editing.onAddLink(null)} className="h-full min-h-[3.5rem]">
                Přidat odkaz
              </AddButton>
            </li>
          )}
        </ul>
      ) : (
        <div className="mt-5 grid gap-x-8 gap-y-8 sm:grid-cols-2 lg:grid-cols-4">
          {groupByColumn(section.links).map(({ column, links }) => (
            <div key={column}>
              {column && <h3 className="text-lg font-medium uppercase text-accent">{column}</h3>}
              <ul className="mt-2 grid gap-2.5">
                {links.map((link) => (
                  <li key={link.id}>
                    <BookmarkLink link={link} edit={controls(link, 'column', (a, b) => (a.column ?? '') === (b.column ?? ''))} />
                  </li>
                ))}
                {editing && (
                  <li>
                    <AddButton onClick={() => editing.onAddLink(column || null)}>Přidat sem</AddButton>
                  </li>
                )}
              </ul>
            </div>
          ))}
          {editing && (
            <div>
              <AddButton onClick={() => editing.onAddLink(null)} className="min-h-[3.5rem]">
                Nový sloupec
              </AddButton>
            </div>
          )}
        </div>
      )}
    </section>
  );
}

function AddButton({ onClick, children, className = '' }: { onClick: () => void; children: string; className?: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex w-full items-center justify-center gap-2 rounded-lg border border-dashed border-line px-3 py-2 text-sm font-semibold text-muted hover:border-accent hover:text-accent focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent ${className}`}
    >
      <Plus className="h-4 w-4" /> {children}
    </button>
  );
}
