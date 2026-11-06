import type { PersonInput } from '@/lib/club';
import { Field, Input } from '@/components/ui';

export const emptyPerson = (): PersonInput => ({ firstName: '', lastName: '', birthDate: null, facrId: null, email: null, phone: null, note: null });

/** Shared fields of a person (new member, people list, person detail). `prefix` maps API errors like "person.lastName". */
export function PersonFields({
  value,
  onChange,
  errors,
  prefix = '',
  compact = false,
}: {
  value: PersonInput;
  onChange: (v: PersonInput) => void;
  errors: Record<string, string>;
  prefix?: string;
  compact?: boolean;
}) {
  const set = (patch: Partial<PersonInput>) => onChange({ ...value, ...patch });
  const text = (v: string) => (v.trim() === '' ? null : v);
  const e = (f: string) => errors[prefix + f];

  return (
    <div className="grid gap-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Jméno" error={e('firstName')}>
          <Input value={value.firstName} maxLength={60} required autoComplete="off" onChange={(ev) => set({ firstName: ev.target.value })} />
        </Field>
        <Field label="Příjmení" error={e('lastName')}>
          <Input value={value.lastName} maxLength={60} required autoComplete="off" onChange={(ev) => set({ lastName: ev.target.value })} />
        </Field>
        <Field label="Datum narození" error={e('birthDate')}>
          <Input type="date" value={value.birthDate ?? ''} onChange={(ev) => set({ birthDate: ev.target.value || null })} />
        </Field>
        <Field label="ID FAČR" error={e('facrId')}>
          <Input value={value.facrId ?? ''} maxLength={20} inputMode="numeric" onChange={(ev) => set({ facrId: text(ev.target.value) })} />
        </Field>
        {!compact && (
          <>
            <Field label="E-mail" error={e('email')}>
              <Input type="email" value={value.email ?? ''} maxLength={150} onChange={(ev) => set({ email: text(ev.target.value) })} />
            </Field>
            <Field label="Telefon" error={e('phone')}>
              <Input type="tel" value={value.phone ?? ''} maxLength={30} onChange={(ev) => set({ phone: text(ev.target.value) })} />
            </Field>
          </>
        )}
      </div>
      {!compact && (
        <Field label="Poznámka" error={e('note')}>
          <Input value={value.note ?? ''} maxLength={500} onChange={(ev) => set({ note: text(ev.target.value) })} />
        </Field>
      )}
    </div>
  );
}
