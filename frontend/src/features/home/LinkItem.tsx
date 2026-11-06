import type { ReactNode } from 'react';
import { ChevronDown, ChevronLeft, ChevronRight, ChevronUp, EyeOff, Lock, Pencil } from 'lucide-react';
import type { Directory, Link } from '@/lib/types';
import { LinkIcon } from '@/components/LinkIcon';
import { describeAccess } from '@/lib/access';
import { hostOf } from '@/lib/links';
import { cn } from '@/lib/cn';

export interface EditControls {
  onEdit: () => void;
  onMove: (delta: -1 | 1) => void;
  canMoveUp: boolean;
  canMoveDown: boolean;
  /** Tiles flow left to right, bookmark columns top to bottom. */
  axis: 'row' | 'column';
  directory: Directory | null | undefined;
}

const focus = 'rounded-md focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent';

/** Big icon, uppercase title, accent subtitle (the host when no subtitle is set). */
export function TileLink({ link, edit }: { link: Link; edit?: EditControls }) {
  const body = (
    <>
      <LinkIcon icon={link.icon} className="h-8 w-8 shrink-0" />
      <span className="min-w-0">
        <span className="block font-bold uppercase leading-tight tracking-wide group-hover:text-accent">{link.title}</span>
        <span className="block truncate text-xs font-medium uppercase tracking-wide text-accent">{link.subtitle ?? hostOf(link.url)}</span>
      </span>
    </>
  );
  return (
    <Item link={link} edit={edit} className="flex items-center gap-3.5">
      {body}
    </Item>
  );
}

/** Small icon and title, for bookmark columns. */
export function BookmarkLink({ link, edit }: { link: Link; edit?: EditControls }) {
  return (
    <Item link={link} edit={edit} className="flex items-center gap-2">
      <LinkIcon icon={link.icon} className="h-4 w-4 shrink-0" />
      <span className="font-medium group-hover:text-accent">{link.title}</span>
    </Item>
  );
}

function Item({ link, edit, className, children }: { link: Link; edit?: EditControls; className: string; children: ReactNode }) {
  if (!edit) {
    return (
      <a href={link.url} target={link.newTab ? '_blank' : undefined} rel={link.newTab ? 'noopener noreferrer' : undefined} className={cn('group', focus, className)}>
        {children}
      </a>
    );
  }

  // Edit mode: the item opens its editor instead of navigating, and shows who sees it.
  const accessText = link.access ? describeAccess(link.access, edit.directory) : '';
  const [Back, Forward] = edit.axis === 'row' ? [ChevronLeft, ChevronRight] : [ChevronUp, ChevronDown];
  return (
    <div className="rounded-lg border border-dashed border-line p-2">
      <button type="button" onClick={edit.onEdit} className={cn('group w-full text-left', focus, className)} aria-label={`Upravit odkaz ${link.title}`}>
        {children}
      </button>
      <div className="mt-2 flex items-center gap-1 text-xs text-muted">
        <span className="flex min-w-0 flex-1 items-center gap-1" title={`Uvidí: ${accessText}`}>
          {link.visibleToMe === false ? <EyeOff className="h-3.5 w-3.5 shrink-0" aria-label="Bez úprav byste ho neviděli" /> : <Lock className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />}
          <span className="truncate">{accessText}</span>
        </span>
        <IconButton label="Posunout dopředu" disabled={!edit.canMoveUp} onClick={() => edit.onMove(-1)}>
          <Back className="h-4 w-4" />
        </IconButton>
        <IconButton label="Posunout dozadu" disabled={!edit.canMoveDown} onClick={() => edit.onMove(1)}>
          <Forward className="h-4 w-4" />
        </IconButton>
        <IconButton label="Upravit" onClick={edit.onEdit}>
          <Pencil className="h-3.5 w-3.5" />
        </IconButton>
      </div>
    </div>
  );
}

export function IconButton({ label, onClick, disabled, children }: { label: string; onClick: () => void; disabled?: boolean; children: ReactNode }) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      disabled={disabled}
      onClick={onClick}
      className="grid h-7 w-7 place-items-center rounded text-muted hover:bg-raised hover:text-ink disabled:opacity-30 disabled:hover:bg-transparent focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent"
    >
      {children}
    </button>
  );
}
