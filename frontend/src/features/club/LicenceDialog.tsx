import { useEffect, useState, type FormEvent } from 'react';
import { useClubMutation } from '@/app/clubQueries';
import { Dialog } from '@/components/ui/dialog';
import { ErrorNote, Field, Input } from '@/components/ui';
import { LICENCE_TYPES, type Licence, type LicenceInput } from '@/lib/club';
import { DialogFooter, fieldErrors, otherError } from './SeasonDialogs';

export type LicenceTarget = { personId: number } | { licence: Licence };

const empty: LicenceInput = { type: '', number: null, issuedOn: null, validUntil: null, note: null };

export function LicenceDialog({ target, onClose }: { target: LicenceTarget | null; onClose: () => void }) {
  const existing = target && 'licence' in target ? target.licence : null;
  const [form, setForm] = useState<LicenceInput>(empty);
  const save = useClubMutation((club, input: LicenceInput) =>
    existing ? club.updateLicence(existing.id, input) : club.addLicence((target as { personId: number }).personId, input),
  );
  const remove = useClubMutation((club, id: number) => club.deleteLicence(id));

  useEffect(() => {
    if (!target) return;
    setForm(existing ? { type: existing.type, number: existing.number, issuedOn: existing.issuedOn, validUntil: existing.validUntil, note: existing.note } : empty);
    save.reset();
    remove.reset();
  }, [target]);

  const set = (patch: Partial<LicenceInput>) => setForm((f) => ({ ...f, ...patch }));
  const text = (v: string) => (v.trim() === '' ? null : v);
  const errors = fieldErrors(save.error);
  const submit = (e: FormEvent) => {
    e.preventDefault();
    save.mutate(form, { onSuccess: onClose });
  };

  return (
    <Dialog open={target !== null} onOpenChange={(o) => !o && onClose()} title={existing ? 'Upravit licenci' : 'Nová licence'}>
      <form onSubmit={submit} className="grid gap-4">
        <div className="grid gap-4 sm:grid-cols-[2fr_1fr]">
          <>
            <Field label="Typ" error={errors.type} hint="Vyber, nebo napiš vlastní.">
              <Input list="licence-types" value={form.type} maxLength={60} required autoFocus onChange={(e) => set({ type: e.target.value })} placeholder="UEFA B" />
            </Field>
            <datalist id="licence-types">
              {LICENCE_TYPES.map((t) => (
                <option key={t} value={t} />
              ))}
            </datalist>
          </>
          <Field label="Číslo" error={errors.number}>
            <Input value={form.number ?? ''} maxLength={40} onChange={(e) => set({ number: text(e.target.value) })} />
          </Field>
          <Field label="Vydána" error={errors.issuedOn}>
            <Input type="date" value={form.issuedOn ?? ''} onChange={(e) => set({ issuedOn: e.target.value || null })} />
          </Field>
          <Field label="Platí do" error={errors.validUntil} hint="Prázdné = bez omezení.">
            <Input type="date" value={form.validUntil ?? ''} onChange={(e) => set({ validUntil: e.target.value || null })} />
          </Field>
        </div>
        <Field label="Poznámka" error={errors.note}>
          <Input value={form.note ?? ''} maxLength={255} onChange={(e) => set({ note: text(e.target.value) })} placeholder="např. přihlášen na doškolovací seminář" />
        </Field>
        {otherError(save.error) && <ErrorNote error={save.error} />}
        {remove.error && <ErrorNote error={remove.error} />}
        <DialogFooter
          onClose={onClose}
          saving={save.isPending}
          submitLabel={existing ? 'Uložit licenci' : 'Přidat licenci'}
          onDelete={existing ? () => remove.mutate(existing.id, { onSuccess: onClose }) : undefined}
        />
      </form>
    </Dialog>
  );
}
