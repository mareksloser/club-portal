import { Ban } from 'lucide-react';
import { ICON_NAMES, ICONS } from '@/lib/icons';
import { Field, Input } from '@/components/ui';
import { LinkIcon } from '@/components/LinkIcon';
import { cn } from '@/lib/cn';

/** Pick a curated icon, or paste an image URL (e.g. an app logo from dashboard-icons). */
export function IconPicker({ value, onChange, error }: { value: string | null; onChange: (icon: string | null) => void; error?: string }) {
  const imageUrl = value?.startsWith('url:') ? value.slice(4) : '';
  const cell = 'grid h-10 w-10 place-items-center rounded-md border focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent';

  return (
    <fieldset className="grid gap-2 text-sm">
      <legend className="mb-1.5 font-semibold">Ikona</legend>
      <div className="flex max-h-44 flex-wrap gap-1.5 overflow-y-auto rounded-md border border-line bg-bg p-2" role="radiogroup" aria-label="Ikony">
        <button
          type="button"
          role="radio"
          aria-checked={value === null}
          aria-label="Bez ikony"
          title="Bez ikony"
          onClick={() => onChange(null)}
          className={cn(cell, value === null ? 'border-accent text-accent' : 'border-transparent text-muted hover:bg-raised')}
        >
          <Ban className="h-5 w-5" />
        </button>
        {ICON_NAMES.map((name) => {
          const Icon = ICONS[name]!;
          const selected = value === `lucide:${name}`;
          return (
            <button
              key={name}
              type="button"
              role="radio"
              aria-checked={selected}
              aria-label={name}
              title={name}
              onClick={() => onChange(`lucide:${name}`)}
              className={cn(cell, selected ? 'border-accent bg-accent/15 text-accent' : 'border-transparent hover:bg-raised')}
            >
              <Icon className="h-5 w-5" strokeWidth={1.75} />
            </button>
          );
        })}
      </div>
      <Field
        label="Nebo obrázek z adresy"
        error={error}
        hint={
          <>
            Logo aplikace, např. z <a className="underline" href="https://dashboardicons.com" target="_blank" rel="noreferrer">dashboardicons.com</a> (adresa SVG nebo PNG).
          </>
        }
      >
        <div className="flex items-center gap-2">
          <Input
            type="url"
            inputMode="url"
            placeholder="https://cdn.jsdelivr.net/gh/homarr-labs/dashboard-icons/svg/proxmox.svg"
            value={imageUrl}
            onChange={(e) => onChange(e.target.value.trim() ? `url:${e.target.value.trim()}` : null)}
          />
          {imageUrl && <LinkIcon icon={value} className="h-8 w-8 shrink-0" />}
        </div>
      </Field>
    </fieldset>
  );
}
