import { useEffect, useState, type FormEvent } from 'react';
import { Trash2 } from 'lucide-react';
import type { Directory, Link, LinkInput, Section } from '@/lib/types';
import { DEFAULT_ACCESS } from '@/lib/access';
import { hostOf } from '@/lib/links';
import { useEdit } from '@/app/queries';
import { ApiError } from '@/api/client';
import { Dialog } from '@/components/ui/dialog';
import { Button, ErrorNote, Field, Input, Select } from '@/components/ui';
import { IconPicker } from './IconPicker';
import { AccessFields } from './AccessFields';

export type LinkTarget = { link: Link } | { sectionId: number; column: string | null };

const emptyInput = (sectionId: number, column: string | null): LinkInput => ({
  sectionId, column, title: '', subtitle: null, url: 'https://', icon: null, newTab: false, access: DEFAULT_ACCESS,
});

const fromLink = (l: Link): LinkInput => ({
  sectionId: l.sectionId, column: l.column, title: l.title, subtitle: l.subtitle, url: l.url, icon: l.icon, newTab: l.newTab, access: l.access ?? DEFAULT_ACCESS,
});

export function LinkDialog({
  target,
  sections,
  directory,
  onClose,
}: {
  target: LinkTarget | null;
  sections: Section[];
  directory: Directory | null | undefined;
  onClose: () => void;
}) {
  const existing = target && 'link' in target ? target.link : null;
  const [input, setInput] = useState<LinkInput>(() => emptyInput(0, null));
  const [confirmDelete, setConfirmDelete] = useState(false);

  const save = useEdit((api, data: LinkInput) => (existing ? api.updateLink(existing.id, data) : api.createLink(data)));
  const remove = useEdit((api, id: number) => api.deleteLink(id));

  // A fresh form every time the dialog opens.
  useEffect(() => {
    if (!target) return;
    setInput('link' in target ? fromLink(target.link) : emptyInput(target.sectionId, target.column));
    setConfirmDelete(false);
    save.reset();
    remove.reset();
  }, [target]);

  const set = (patch: Partial<LinkInput>) => setInput((current) => ({ ...current, ...patch }));
  const section = sections.find((s) => s.id === input.sectionId);
  const columns = [...new Set(section?.links.map((l) => l.column).filter((c): c is string => !!c) ?? [])];
  const errors = save.error instanceof ApiError ? save.error.fields : {};

  const submit = (e: FormEvent) => {
    e.preventDefault();
    const payload = {
      ...input,
      column: section?.layout === 'columns' ? input.column?.trim() || null : null,
      subtitle: input.subtitle?.trim() || null,
    };
    save.mutate(payload, { onSuccess: onClose });
  };

  return (
    <Dialog open={target !== null} onOpenChange={(open) => !open && onClose()} title={existing ? 'Upravit odkaz' : 'Nový odkaz'}>
      <form onSubmit={submit} className="grid gap-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Název" error={errors.title}>
            <Input value={input.title} maxLength={80} required autoFocus onChange={(e) => set({ title: e.target.value })} placeholder="Videorozbory" />
          </Field>
          <Field label="Adresa" error={errors.url}>
            <Input type="url" inputMode="url" value={input.url} maxLength={500} required onChange={(e) => set({ url: e.target.value })} />
          </Field>
        </div>

        {section?.layout !== 'columns' && (
          <Field label="Popisek" hint="Malý řádek pod názvem. Prázdný = adresa webu.">
            <Input value={input.subtitle ?? ''} maxLength={120} onChange={(e) => set({ subtitle: e.target.value })} placeholder={/^https?:\/\/.+/.test(input.url) ? hostOf(input.url) : 'mvr.mareksloser.cz'} />
          </Field>
        )}

        <IconPicker value={input.icon} onChange={(icon) => set({ icon })} error={errors.icon} />

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Sekce" error={errors.sectionId}>
            <Select value={input.sectionId} onChange={(e) => set({ sectionId: Number(e.target.value) })}>
              {sections.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.title}
                </option>
              ))}
            </Select>
          </Field>
          {section?.layout === 'columns' && (
            <>
              <Field label="Sloupec" hint="Existující, nebo napiš nový.">
                <Input list="link-columns" value={input.column ?? ''} maxLength={40} onChange={(e) => set({ column: e.target.value })} placeholder="Trenéři" />
              </Field>
              <datalist id="link-columns">
                {columns.map((c) => (
                  <option key={c} value={c} />
                ))}
              </datalist>
            </>
          )}
        </div>

        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" className="h-4 w-4 accent-[rgb(var(--accent))]" checked={input.newTab} onChange={(e) => set({ newTab: e.target.checked })} />
          Otevírat v nové kartě
        </label>

        <AccessFields value={input.access} onChange={(access) => set({ access })} directory={directory} errors={errors} />

        {save.error && !(save.error instanceof ApiError && save.error.status === 422) && <ErrorNote error={save.error} />}
        {remove.error && <ErrorNote error={remove.error} />}

        <div className="flex flex-wrap items-center gap-2 border-t border-line pt-4">
          {existing &&
            (confirmDelete ? (
              <Button variant="danger" disabled={remove.isPending} onClick={() => remove.mutate(existing.id, { onSuccess: onClose })}>
                <Trash2 className="h-4 w-4" /> Opravdu smazat
              </Button>
            ) : (
              <Button variant="ghost" onClick={() => setConfirmDelete(true)}>
                <Trash2 className="h-4 w-4" /> Smazat
              </Button>
            ))}
          <div className="ml-auto flex gap-2">
            <Button variant="ghost" onClick={onClose}>
              Zrušit
            </Button>
            <Button variant="primary" type="submit" disabled={save.isPending}>
              {existing ? 'Uložit odkaz' : 'Přidat odkaz'}
            </Button>
          </div>
        </div>
      </form>
    </Dialog>
  );
}
