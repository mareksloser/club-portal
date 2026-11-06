import type { AccessRule, AccessType, Directory } from '@/lib/types';
import { ACCESS_TYPES, MEMBERSHIPS, describeAccess } from '@/lib/access';
import { Field, Input, Select } from '@/components/ui';
import { cn } from '@/lib/cn';

/**
 * "Kdo uvidí": one rule per link. Teams and roles come from the club account (team-auth);
 * if they can't be loaded, slugs can still be typed by hand.
 */
export function AccessFields({
  value,
  onChange,
  directory,
  errors,
}: {
  value: AccessRule;
  onChange: (rule: AccessRule) => void;
  directory: Directory | null | undefined;
  errors: Record<string, string>;
}) {
  const setType = (type: AccessType) => onChange({ type, team: null, value: null });
  const set = (patch: Partial<AccessRule>) => onChange({ ...value, ...patch });

  const teamControl = (anyLabel: string) =>
    directory ? (
      <Select value={value.team ?? ''} onChange={(e) => set({ team: e.target.value || null })}>
        <option value="">{anyLabel}</option>
        {directory.teams.map((t) => (
          <option key={t.slug} value={t.slug}>
            {t.name}
          </option>
        ))}
      </Select>
    ) : (
      <Input value={value.team ?? ''} placeholder="např. u11 (prázdné = kterýkoli)" onChange={(e) => set({ team: e.target.value.trim() || null })} />
    );

  return (
    <fieldset className="grid gap-3 text-sm">
      <legend className="mb-1.5 font-semibold">Kdo odkaz uvidí</legend>
      <div className="grid gap-1.5 sm:grid-cols-2" role="radiogroup" aria-label="Kdo odkaz uvidí">
        {ACCESS_TYPES.map((option) => (
          <label
            key={option.type}
            className={cn(
              'flex cursor-pointer flex-col rounded-md border px-3 py-2 has-[:focus-visible]:outline has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-accent',
              value.type === option.type ? 'border-accent bg-accent/10' : 'border-line hover:bg-raised',
            )}
          >
            <input type="radio" name="access-type" className="sr-only" checked={value.type === option.type} onChange={() => setType(option.type)} />
            <span className="font-semibold">{option.label}</span>
            <span className="text-xs text-muted">{option.hint}</span>
          </label>
        ))}
      </div>
      {errors['access.type'] && <p className="text-xs text-danger">{errors['access.type']}</p>}

      {value.type === 'team' && (
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Tým" error={errors['access.team']}>
            {teamControl('Všechny týmy')}
          </Field>
          <Field label="Kdo z týmu" error={errors['access.value']}>
            <Select value={value.value ?? ''} onChange={(e) => set({ value: e.target.value || null })}>
              <option value="">Všichni členové</option>
              {MEMBERSHIPS.map((m) => (
                <option key={m.value} value={m.value}>
                  {m.plural}
                </option>
              ))}
            </Select>
          </Field>
        </div>
      )}

      {value.type === 'role' && (
        <div className="grid gap-3 sm:grid-cols-2">
          <Field
            label="Role"
            error={errors['access.value']}
            hint={directory && directory.roles.length === 0 ? 'Rozcestník zatím nemá v klubovém účtu žádné role.' : 'Role aplikace Rozcestník v klubovém účtu.'}
          >
            {directory ? (
              <Select value={value.value ?? ''} onChange={(e) => set({ value: e.target.value || null })}>
                <option value="">Vyber roli</option>
                {directory.roles.map((r) => (
                  <option key={r.slug} value={r.slug}>
                    {r.description ? `${r.slug} – ${r.description}` : r.slug}
                  </option>
                ))}
              </Select>
            ) : (
              <Input value={value.value ?? ''} placeholder="např. vybor" onChange={(e) => set({ value: e.target.value.trim() || null })} />
            )}
          </Field>
          <Field label="Jen pro tým" error={errors['access.team']}>
            {teamControl('Bez omezení')}
          </Field>
        </div>
      )}

      <p className="text-muted">
        Uvidí: <span className="font-semibold text-ink">{describeAccess(value, directory)}</span>
        {value.type !== 'editors' && '. Správci rozcestníku vidí všechno.'}
      </p>
    </fieldset>
  );
}
