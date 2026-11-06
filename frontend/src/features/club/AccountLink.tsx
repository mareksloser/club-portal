import { useEffect, useState } from 'react';
import { Link2, Link2Off, Search } from 'lucide-react';
import { clubKeys, useClubMutation, useClubQuery } from '@/app/clubQueries';
import { Button, ErrorNote, Input } from '@/components/ui';
import type { PersonDetail } from '@/lib/club';
import { fieldErrors } from './SeasonDialogs';

/** Link a person to their club account (searched in team-auth), or unlink. */
export function AccountLink({ person }: { person: PersonDetail }) {
  const [query, setQuery] = useState('');
  const [debounced, setDebounced] = useState('');
  const searching = !person.authSub;
  const accounts = useClubQuery(clubKeys.accounts(debounced), (club) => club.accounts(debounced), searching && debounced.length >= 2);
  const link = useClubMutation((club, account: { sub: string; name: string; email: string } | null) => club.linkAccount(person.id, account));

  useEffect(() => {
    const t = setTimeout(() => setDebounced(query.trim()), 250);
    return () => clearTimeout(t);
  }, [query]);
  useEffect(() => setQuery(searching ? `${person.firstName} ${person.lastName}` : ''), [person.id, searching]);

  if (!searching) {
    return (
      <div className="flex flex-wrap items-center gap-3">
        <span className="inline-flex items-center gap-2 font-semibold">
          <Link2 className="h-4 w-4 text-ok" aria-hidden="true" /> {person.authName}
        </span>
        <Button size="sm" variant="ghost" disabled={link.isPending} onClick={() => link.mutate(null)}>
          <Link2Off className="h-4 w-4" /> Zrušit propojení
        </Button>
        {link.error && <ErrorNote error={link.error} />}
      </div>
    );
  }

  const linkError = fieldErrors(link.error).sub;
  return (
    <div className="grid max-w-xl gap-3">
      <p className="text-sm text-muted">Propojením s klubovým účtem se člověk v evidenci spáruje s tím, kdo se přihlašuje.</p>
      <label className="relative block">
        <span className="sr-only">Hledat klubový účet</span>
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" aria-hidden="true" />
        <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Jméno nebo e-mail účtu" className="pl-9" type="search" />
      </label>
      {accounts.error && <ErrorNote error={accounts.error} />}
      {linkError && <p className="text-sm text-danger">{linkError}</p>}
      {link.error && !linkError && <ErrorNote error={link.error} />}
      {accounts.data && (
        <ul className="grid gap-1">
          {accounts.data.users.map((u) => (
            <li key={u.sub} className="flex items-center justify-between gap-3 rounded-md border border-line px-3 py-2 text-sm">
              <span className="min-w-0">
                <span className="block font-semibold">{u.name}</span>
                <span className="block truncate text-muted">
                  {u.email}
                  {!u.active && ' (zablokovaný)'}
                </span>
              </span>
              <Button size="sm" disabled={link.isPending} onClick={() => link.mutate({ sub: u.sub, name: u.name, email: u.email })}>
                <Link2 className="h-4 w-4" /> Propojit
              </Button>
            </li>
          ))}
          {accounts.data.users.length === 0 && <li className="text-sm text-muted">Žádný účet neodpovídá. Zkus e-mail nebo jen příjmení.</li>}
        </ul>
      )}
    </div>
  );
}
