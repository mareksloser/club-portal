import { useEffect, useState, type FormEvent, type ReactNode } from 'react';
import { Link2, Search, UserPlus } from 'lucide-react';
import { clubKeys, useClubMutation, useClubQuery } from '@/app/clubQueries';
import { Dialog } from '@/components/ui/dialog';
import { ErrorNote, Field, Input } from '@/components/ui';
import { SEARCH_DELAY_MS, STAFF_ROLES, birthYear, fullName, sortName, type Account, type Member, type MemberKind, type PersonInput } from '@/lib/club';
import { cn } from '@/lib/cn';
import { DialogFooter, fieldErrors, otherError } from './SeasonDialogs';
import { PersonFields, emptyPerson } from './PersonFields';

export type MemberTarget = { add: MemberKind } | { member: Member };

/** What was picked in the search: someone from the registry, or a club account. */
type SearchPick = { personId: number } | { account: Account } | null;

/**
 * Add someone to a team — an existing person (search) or a new one — or edit a member's
 * jersey number / staff role. A person stays in the registry when removed from a team.
 */
export function MemberDialog({ teamId, target, onClose }: { teamId: number; target: MemberTarget | null; onClose: () => void }) {
  const existing = target && 'member' in target ? target.member : null;
  const kind: MemberKind = existing?.kind ?? (target && 'add' in target ? target.add : 'player');
  const [mode, setMode] = useState<'search' | 'new'>('search');
  const [query, setQuery] = useState('');
  const [debounced, setDebounced] = useState('');
  const [picked, setPicked] = useState<SearchPick>(null);
  const [person, setPerson] = useState<PersonInput>(emptyPerson);
  const [staffRole, setStaffRole] = useState('');
  const [jersey, setJersey] = useState('');

  const searching = target !== null && !existing && mode === 'search' && debounced.length >= 2;
  const people = useClubQuery(clubKeys.people(debounced), (club) => club.people(debounced), searching);
  // Club accounts not yet in the registry; if team-auth can't be asked, only the registry is searched.
  const accounts = useClubQuery(clubKeys.accounts(debounced), (club) => club.accounts(debounced), searching);
  const linkedSubs = new Set(people.data?.people.map((p) => p.authSub).filter(Boolean));
  const newAccounts = accounts.data?.users.filter((u) => !linkedSubs.has(u.sub)) ?? [];

  useEffect(() => {
    const t = setTimeout(() => setDebounced(query.trim()), SEARCH_DELAY_MS);
    return () => clearTimeout(t);
  }, [query]);
  const save = useClubMutation((club, _: void) => {
    const details = kind === 'staff' ? { staffRole: staffRole.trim() || null } : { jerseyNumber: jersey === '' ? null : Number(jersey) };
    if (existing) return club.updateMember(existing.id, details);
    if (mode === 'new') return club.addMember(teamId, { kind, ...details, person });
    const who = picked && 'account' in picked ? { account: { sub: picked.account.sub, name: picked.account.name, email: picked.account.email } } : { personId: picked?.personId };
    return club.addMember(teamId, { kind, ...details, ...who });
  });
  const remove = useClubMutation((club, id: number) => club.removeMember(id));

  useEffect(() => {
    if (!target) return;
    setMode('search');
    setQuery('');
    setDebounced('');
    setPicked(null);
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
                  {m === 'search' ? 'Vyhledat' : 'Nová osoba'}
                </button>
              ))}
            </div>

            {mode === 'search' ? (
              <Field label="Najít osobu nebo klubový účet" error={errors.personId} hint="Jméno, příjmení, e-mail nebo ID FAČR, aspoň 2 znaky.">
                <Input autoFocus value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Novák" autoComplete="off" />
              </Field>
            ) : (
              <PersonFields value={person} onChange={setPerson} errors={errors} prefix="person." compact />
            )}

            {mode === 'search' && debounced.length >= 2 && (
              <div className="grid max-h-64 gap-3 overflow-y-auto" role="radiogroup" aria-label="Výsledky">
                {people.data && people.data.people.length > 0 && (
                  <ResultGroup title="V evidenci">
                    {people.data.people.map((p) => (
                      <Result key={`p${p.id}`} selected={picked !== null && 'personId' in picked && picked.personId === p.id} onSelect={() => setPicked({ personId: p.id })}>
                        <span className="flex items-center gap-1.5 font-semibold">
                          {sortName(p)}
                          {p.authSub && <Link2 className="h-3.5 w-3.5 text-muted" aria-label="propojeno s účtem" />}
                        </span>
                        <span className="text-muted">{[birthYear(p.birthDate), p.facrId].filter(Boolean).join(', ')}</span>
                      </Result>
                    ))}
                  </ResultGroup>
                )}
                {newAccounts.length > 0 && (
                  <ResultGroup title="Klubové účty" hint="Přidáním se založí v evidenci a propojí s účtem.">
                    {newAccounts.map((u) => (
                      <Result key={`a${u.sub}`} selected={picked !== null && 'account' in picked && picked.account.sub === u.sub} onSelect={() => setPicked({ account: u })}>
                        <span className="font-semibold">{u.name}</span>
                        <span className="truncate text-muted">{u.email}{!u.active && ' (zablokovaný)'}</span>
                      </Result>
                    ))}
                  </ResultGroup>
                )}
                {people.isFetching || accounts.isFetching ? (
                  <p className="px-3 text-sm text-muted">Hledám…</p>
                ) : (
                  people.data?.people.length === 0 && newAccounts.length === 0 && (
                    <p className="px-3 text-sm text-muted">
                      Nikdo takový není v evidenci ani mezi účty.{' '}
                      <button type="button" className="font-semibold text-accent underline" onClick={() => setMode('new')}>
                        Zadat jako novou osobu
                      </button>
                    </p>
                  )
                )}
                {accounts.error && <p className="px-3 text-xs text-muted">Klubové účty se nepodařilo prohledat, hledám jen v evidenci.</p>}
              </div>
            )}
          </>
        )}

        {kind === 'player' ? (
          <Field label="Číslo dresu" error={errors.jerseyNumber} className="max-w-[10rem]">
            <Input type="number" min={0} max={99} inputMode="numeric" value={jersey} onChange={(e) => setJersey(e.target.value)} />
          </Field>
        ) : (
          <>
            <Field label="Funkce" error={errors.staffRole} hint="Vyber, nebo napiš vlastní.">
              <Input list="staff-roles" value={staffRole} maxLength={40} onChange={(e) => setStaffRole(e.target.value)} placeholder="Hlavní trenér" />
            </Field>
            <datalist id="staff-roles">
              {STAFF_ROLES.map((r) => (
                <option key={r} value={r} />
              ))}
            </datalist>
          </>
        )}

        {otherError(save.error) && <ErrorNote error={save.error} />}
        {remove.error && <ErrorNote error={remove.error} />}
        <DialogFooter
          onClose={onClose}
          saving={save.isPending || (!existing && mode === 'search' && picked === null)}
          submitLabel={existing ? 'Uložit' : 'Přidat do týmu'}
          onDelete={existing ? () => remove.mutate(existing.id, { onSuccess: onClose }) : undefined}
          deleteLabel="Odebrat z týmu"
        />
      </form>
    </Dialog>
  );
}

function ResultGroup({ title, hint, children }: { title: string; hint?: string; children: ReactNode }) {
  return (
    <div>
      <p className="px-3 text-xs font-bold uppercase tracking-wide text-muted">
        {title}
        {hint && <span className="ml-2 font-normal normal-case tracking-normal">{hint}</span>}
      </p>
      <ul className="mt-1 grid gap-1">{children}</ul>
    </div>
  );
}

function Result({ selected, onSelect, children }: { selected: boolean; onSelect: () => void; children: ReactNode }) {
  return (
    <li>
      <button
        type="button"
        role="radio"
        aria-checked={selected}
        onClick={onSelect}
        className={cn('flex w-full items-baseline justify-between gap-3 rounded-md border px-3 py-2 text-left text-sm', selected ? 'border-accent bg-accent/10' : 'border-transparent hover:bg-raised')}
      >
        {children}
      </button>
    </li>
  );
}
