import { useEffect, useState, type FormEvent } from 'react';
import { Search, UserPlus } from 'lucide-react';
import { clubKeys, useClubMutation, useClubQuery } from '@/app/clubQueries';
import { Dialog } from '@/components/ui/dialog';
import { ErrorNote, Field, Input } from '@/components/ui';
import { STAFF_ROLES, birthYear, fullName, sortName, type Member, type MemberKind, type PersonInput } from '@/lib/club';
import { cn } from '@/lib/cn';
import { DialogFooter, fieldErrors, otherError } from './SeasonDialogs';
import { PersonFields, emptyPerson } from './PersonFields';

export type MemberTarget = { add: MemberKind } | { member: Member };

/**
 * Add someone to a team — an existing person (search) or a new one — or edit a member's
 * jersey number / staff role. A person stays in the registry when removed from a team.
 */
export function MemberDialog({ teamId, target, onClose }: { teamId: number; target: MemberTarget | null; onClose: () => void }) {
  const existing = target && 'member' in target ? target.member : null;
  const kind: MemberKind = existing?.kind ?? (target && 'add' in target ? target.add : 'player');
  const [mode, setMode] = useState<'search' | 'new'>('search');
  const [query, setQuery] = useState('');
  const [personId, setPersonId] = useState<number | null>(null);
  const [person, setPerson] = useState<PersonInput>(emptyPerson);
  const [staffRole, setStaffRole] = useState('');
  const [jersey, setJersey] = useState('');

  const people = useClubQuery(clubKeys.people(query.trim()), (club) => club.people(query.trim()), target !== null && !existing && mode === 'search');
  const save = useClubMutation((club, _: void) => {
    const details = kind === 'staff' ? { staffRole: staffRole.trim() || null } : { jerseyNumber: jersey === '' ? null : Number(jersey) };
    if (existing) return club.updateMember(existing.id, details);
    return club.addMember(teamId, { kind, ...details, ...(mode === 'search' ? { personId: personId ?? undefined } : { person }) });
  });
  const remove = useClubMutation((club, id: number) => club.removeMember(id));

  useEffect(() => {
    if (!target) return;
    setMode('search');
    setQuery('');
    setPersonId(null);
    setPerson(emptyPerson());
    setStaffRole(existing?.staffRole ?? (kind === 'staff' ? '' : ''));
    setJersey(existing?.jerseyNumber != null ? String(existing.jerseyNumber) : '');
    save.reset();
    remove.reset();
  }, [target]);

  const errors = fieldErrors(save.error);
  const title = existing ? fullName(existing.person) : kind === 'player' ? 'Přidat hráče' : 'Přidat do realizačního týmu';
  const submit = (e: FormEvent) => {
    e.preventDefault();
    save.mutate(undefined, { onSuccess: onClose });
  };

  return (
    <Dialog open={target !== null} onOpenChange={(o) => !o && onClose()} title={title} description={existing ? (kind === 'player' ? 'Hráč' : 'Realizační tým') : undefined}>
      <form onSubmit={submit} className="grid gap-4">
        {!existing && (
          <>
            <div className="grid grid-cols-2 gap-1.5" role="radiogroup" aria-label="Kdo">
              {(['search', 'new'] as const).map((m) => (
                <button
                  key={m}
                  type="button"
                  role="radio"
                  aria-checked={mode === m}
                  onClick={() => setMode(m)}
                  className={cn('flex items-center justify-center gap-2 rounded-md border px-3 py-2 text-sm font-semibold', mode === m ? 'border-accent bg-accent/10' : 'border-line text-muted hover:bg-raised')}
                >
                  {m === 'search' ? <Search className="h-4 w-4" /> : <UserPlus className="h-4 w-4" />}
                  {m === 'search' ? 'Už je v evidenci' : 'Nová osoba'}
                </button>
              ))}
            </div>

            {mode === 'search' ? (
              <Field label="Najít osobu" error={errors.personId} hint="Jméno, příjmení nebo ID FAČR.">
                <Input autoFocus value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Novák" autoComplete="off" />
              </Field>
            ) : (
              <PersonFields value={person} onChange={setPerson} errors={errors} prefix="person." compact />
            )}

            {mode === 'search' && (
              <ul className="grid max-h-56 gap-1 overflow-y-auto" role="radiogroup" aria-label="Výsledky">
                {people.data?.people.map((p) => (
                  <li key={p.id}>
                    <button
                      type="button"
                      role="radio"
                      aria-checked={personId === p.id}
                      onClick={() => setPersonId(p.id)}
                      className={cn('flex w-full items-baseline justify-between gap-3 rounded-md border px-3 py-2 text-left text-sm', personId === p.id ? 'border-accent bg-accent/10' : 'border-transparent hover:bg-raised')}
                    >
                      <span className="font-semibold">{sortName(p)}</span>
                      <span className="text-muted">{[birthYear(p.birthDate), p.facrId].filter(Boolean).join(', ')}</span>
                    </button>
                  </li>
                ))}
                {people.data && people.data.people.length === 0 && (
                  <li className="px-3 py-2 text-sm text-muted">
                    Nikdo takový v evidenci není.{' '}
                    <button type="button" className="font-semibold text-accent underline" onClick={() => setMode('new')}>
                      Zadat jako novou osobu
                    </button>
                  </li>
                )}
              </ul>
            )}
          </>
        )}

        {kind === 'player' ? (
          <Field label="Číslo dresu" error={errors.jerseyNumber} className="max-w-[10rem]">
            <Input type="number" min={0} max={99} inputMode="numeric" value={jersey} onChange={(e) => setJersey(e.target.value)} />
          </Field>
        ) : (
          <Field label="Funkce" error={errors.staffRole} hint="Vyber, nebo napiš vlastní.">
            <>
              <Input list="staff-roles" value={staffRole} maxLength={40} onChange={(e) => setStaffRole(e.target.value)} placeholder="Hlavní trenér" />
              <datalist id="staff-roles">
                {STAFF_ROLES.map((r) => (
                  <option key={r} value={r} />
                ))}
              </datalist>
            </>
          </Field>
        )}

        {otherError(save.error) && <ErrorNote error={save.error} />}
        {remove.error && <ErrorNote error={remove.error} />}
        <DialogFooter
          onClose={onClose}
          saving={save.isPending || (!existing && mode === 'search' && personId === null)}
          submitLabel={existing ? 'Uložit' : 'Přidat do týmu'}
          onDelete={existing ? () => remove.mutate(existing.id, { onSuccess: onClose }) : undefined}
          deleteLabel="Odebrat z týmu"
        />
      </form>
    </Dialog>
  );
}
