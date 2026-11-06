import { useEffect, useState, type FormEvent } from 'react';
import { Trash2 } from 'lucide-react';
import type { Layout, Section } from '@/lib/types';
import { useEdit } from '@/app/queries';
import { ApiError } from '@/api/client';
import { Dialog } from '@/components/ui/dialog';
import { Button, ErrorNote, Field, Input } from '@/components/ui';
import { cn } from '@/lib/cn';

export type SectionTarget = { section: Section } | { create: true };

const LAYOUTS: { value: Layout; label: string; hint: string }[] = [
  { value: 'tiles', label: 'Dlaždice', hint: 'Velké ikony s popiskem, 4 vedle sebe' },
  { value: 'columns', label: 'Sloupce záložek', hint: 'Seznamy odkazů pod nadpisy sloupců' },
];

export function SectionDialog({ target, onClose }: { target: SectionTarget | null; onClose: () => void }) {
  const existing = target && 'section' in target ? target.section : null;
  const [title, setTitle] = useState('');
  const [layout, setLayout] = useState<Layout>('tiles');
  const [confirmDelete, setConfirmDelete] = useState(false);

  const save = useEdit((api, input: { title: string; layout: Layout }) => (existing ? api.updateSection(existing.id, input) : api.createSection(input)));
  const remove = useEdit((api, id: number) => api.deleteSection(id));

  useEffect(() => {
    if (!target) return;
    setTitle(existing?.title ?? '');
    setLayout(existing?.layout ?? 'tiles');
    setConfirmDelete(false);
    save.reset();
    remove.reset();
  }, [target]);

  const errors = save.error instanceof ApiError ? save.error.fields : {};
  const submit = (e: FormEvent) => {
    e.preventDefault();
    save.mutate({ title, layout }, { onSuccess: onClose });
  };
  const linkCount = existing?.links.length ?? 0;

  return (
    <Dialog open={target !== null} onOpenChange={(open) => !open && onClose()} title={existing ? 'Upravit sekci' : 'Nová sekce'}>
      <form onSubmit={submit} className="grid gap-4">
        <Field label="Název" error={errors.title}>
          <Input value={title} maxLength={60} required autoFocus onChange={(e) => setTitle(e.target.value)} placeholder="Aplikace" />
        </Field>
        <fieldset className="grid gap-1.5 text-sm">
          <legend className="mb-1.5 font-semibold">Vzhled</legend>
          <div className="grid gap-1.5 sm:grid-cols-2">
            {LAYOUTS.map((option) => (
              <label
                key={option.value}
                className={cn(
                  'flex cursor-pointer flex-col rounded-md border px-3 py-2 has-[:focus-visible]:outline has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-accent',
                  layout === option.value ? 'border-accent bg-accent/10' : 'border-line hover:bg-raised',
                )}
              >
                <input type="radio" name="layout" className="sr-only" checked={layout === option.value} onChange={() => setLayout(option.value)} />
                <span className="font-semibold">{option.label}</span>
                <span className="text-xs text-muted">{option.hint}</span>
              </label>
            ))}
          </div>
        </fieldset>

        {save.error && !(save.error instanceof ApiError && save.error.status === 422) && <ErrorNote error={save.error} />}
        {remove.error && <ErrorNote error={remove.error} />}

        <div className="flex flex-wrap items-center gap-2 border-t border-line pt-4">
          {existing &&
            (confirmDelete ? (
              <Button variant="danger" disabled={remove.isPending} onClick={() => remove.mutate(existing.id, { onSuccess: onClose })}>
                <Trash2 className="h-4 w-4" /> {linkCount > 0 ? `Smazat i s ${linkCount} odkazy` : 'Opravdu smazat'}
              </Button>
            ) : (
              <Button variant="ghost" onClick={() => setConfirmDelete(true)}>
                <Trash2 className="h-4 w-4" /> Smazat sekci
              </Button>
            ))}
          <div className="ml-auto flex gap-2">
            <Button variant="ghost" onClick={onClose}>
              Zrušit
            </Button>
            <Button variant="primary" type="submit" disabled={save.isPending}>
              {existing ? 'Uložit sekci' : 'Přidat sekci'}
            </Button>
          </div>
        </div>
      </form>
    </Dialog>
  );
}
