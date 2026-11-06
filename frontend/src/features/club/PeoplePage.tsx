import { useEffect, useState, type FormEvent } from 'react';
import { Link, useNavigate } from '@tanstack/react-router';
import { Link2, Plus, Search } from 'lucide-react';
import { clubKeys, useClubMutation, useClubQuery } from '@/app/clubQueries';
import { Dialog } from '@/components/ui/dialog';
import { Button, ErrorNote, Input, Spinner } from '@/components/ui';
import { birthYear, sortName, type PersonInput } from '@/lib/club';
import { ClubLayout, Table } from './ClubLayout';
import { PersonFields, emptyPerson } from './PersonFields';
import { DialogFooter, fieldErrors, otherError } from './SeasonDialogs';

/** /klub/lide — everyone in the registry, across seasons. */
export function PeoplePage() {
  const [query, setQuery] = useState('');
  const [debounced, setDebounced] = useState('');
  const [creating, setCreating] = useState(false);
  const people = useClubQuery(clubKeys.people(debounced), (club) => club.people(debounced));

  useEffect(() => {
    const t = setTimeout(() => setDebounced(query.trim()), 200);
    return () => clearTimeout(t);
  }, [query]);

  return (
    <ClubLayout
      title="Lidé"
      actions={
        <Button onClick={() => setCreating(true)}>
          <Plus className="h-4 w-4" /> Nová osoba
        </Button>
      }
    >
      <label className="relative block max-w-md">
        <span className="sr-only">Hledat</span>
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" aria-hidden="true" />
        <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Jméno, ID FAČR nebo účet" className="pl-9" type="search" />
      </label>

      <div className="mt-6">
        {people.isPending ? (
          <Spinner />
        ) : people.error ? (
          <ErrorNote error={people.error} />
        ) : people.data.people.length === 0 ? (
          <p className="text-muted">{debounced ? 'Nikdo neodpovídá hledání.' : 'Evidence je zatím prázdná. Lidi přidáš přímo do týmu, nebo tady.'}</p>
        ) : (
          <Table>
            <thead>
              <tr>
                <th>Jméno</th>
                <th>Ročník</th>
                <th>ID FAČR</th>
                <th>Klubový účet</th>
              </tr>
            </thead>
            <tbody>
              {people.data.people.map((p) => (
                <tr key={p.id}>
                  <td>
                    <Link to="/klub/lide/$personId" params={{ personId: String(p.id) }} className="font-semibold hover:text-accent hover:underline">
                      {sortName(p)}
                    </Link>
                  </td>
                  <td className="tabular">{birthYear(p.birthDate)}</td>
                  <td className="tabular">{p.facrId ?? ''}</td>
                  <td className="text-muted">
                    {p.authName && (
                      <span className="inline-flex items-center gap-1.5">
                        <Link2 className="h-3.5 w-3.5" aria-hidden="true" /> {p.authName}
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </Table>
        )}
      </div>
      <NewPersonDialog open={creating} onClose={() => setCreating(false)} />
    </ClubLayout>
  );
}

function NewPersonDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const navigate = useNavigate();
  const [person, setPerson] = useState<PersonInput>(emptyPerson);
  const save = useClubMutation((club, input: PersonInput) => club.createPerson(input));

  useEffect(() => {
    if (open) {
      setPerson(emptyPerson());
      save.reset();
    }
  }, [open]);

  const submit = (e: FormEvent) => {
    e.preventDefault();
    save.mutate(person, { onSuccess: (p) => void navigate({ to: '/klub/lide/$personId', params: { personId: String(p.id) } }) });
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()} title="Nová osoba">
      <form onSubmit={submit} className="grid gap-4">
        <PersonFields value={person} onChange={setPerson} errors={fieldErrors(save.error)} />
        {otherError(save.error) && <ErrorNote error={save.error} />}
        <DialogFooter onClose={onClose} saving={save.isPending} submitLabel="Přidat osobu" />
      </form>
    </Dialog>
  );
}
