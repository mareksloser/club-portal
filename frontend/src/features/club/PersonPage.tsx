import { useEffect, useState, type FormEvent } from 'react';
import { Link, useNavigate, useParams } from '@tanstack/react-router';
import { Pencil, Plus, Trash2 } from 'lucide-react';
import { clubKeys, useClubMutation, useClubQuery } from '@/app/clubQueries';
import { Button, ErrorNote, Spinner } from '@/components/ui';
import { czDate, fullName, type PersonDetail, type PersonInput } from '@/lib/club';
import { AccountLink } from './AccountLink';
import { ClubLayout, ClubSection, Table } from './ClubLayout';
import { LicenceDialog, type LicenceTarget } from './LicenceDialog';
import { LicenceLine } from './LicenceBadge';
import { PersonFields } from './PersonFields';
import { fieldErrors, otherError } from './SeasonDialogs';

const toInput = (p: PersonDetail): PersonInput => ({
  firstName: p.firstName, lastName: p.lastName, birthDate: p.birthDate, facrId: p.facrId, email: p.email, phone: p.phone, note: p.note,
});

/** /klub/lide/:id — personal details, account link, licences and team history. */
export function PersonPage() {
  const { personId } = useParams({ strict: false }) as { personId: string };
  const id = Number(personId);
  const navigate = useNavigate();
  const person = useClubQuery(clubKeys.person(id), (club) => club.person(id));
  const [form, setForm] = useState<PersonInput | null>(null);
  const [licence, setLicence] = useState<LicenceTarget | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const save = useClubMutation((club, input: PersonInput) => club.updatePerson(id, input));
  const remove = useClubMutation((club, _: void) => club.deletePerson(id));
  const p = person.data;

  useEffect(() => {
    if (p) setForm(toInput(p));
  }, [p]);

  const dirty = p && form && JSON.stringify(toInput(p)) !== JSON.stringify(form);
  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (form) save.mutate(form);
  };

  return (
    <ClubLayout title={p ? fullName(p) : 'Osoba'}>
      {person.isPending ? (
        <Spinner />
      ) : person.error ? (
        <ErrorNote error={person.error} />
      ) : (
        <>
          <ClubSection
            title="Licence"
            actions={
              <Button size="sm" variant="primary" onClick={() => setLicence({ personId: id })}>
                <Plus className="h-4 w-4" /> Přidat licenci
              </Button>
            }
          >
            {p!.licences.length === 0 ? (
              <p className="text-muted">Bez licence. Trenérům ji tady doplň, dashboard trenérů pak ohlídá, kdy vyprší.</p>
            ) : (
              <Table>
                <thead>
                  <tr>
                    <th>Typ</th>
                    <th>Číslo</th>
                    <th>Vydána</th>
                    <th>Platí do</th>
                    <th>Stav</th>
                    <th className="w-10"><span className="sr-only">Upravit</span></th>
                  </tr>
                </thead>
                <tbody>
                  {p!.licences.map((l) => (
                    <tr key={l.id}>
                      <td>
                        <span className="font-semibold">{l.type}</span>
                        {l.note && <span className="block text-xs text-muted">{l.note}</span>}
                      </td>
                      <td className="tabular">{l.number ?? ''}</td>
                      <td className="tabular">{czDate(l.issuedOn)}</td>
                      <td className="tabular">{l.validUntil ? czDate(l.validUntil) : 'bez omezení'}</td>
                      <td><LicenceLine status={l.status} daysLeft={l.daysLeft} validUntil={l.validUntil} /></td>
                      <td>
                        <button type="button" aria-label={`Upravit licenci ${l.type}`} onClick={() => setLicence({ licence: l })} className="grid h-8 w-8 place-items-center rounded text-muted hover:bg-raised hover:text-ink">
                          <Pencil className="h-3.5 w-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            )}
          </ClubSection>

          <ClubSection title="Klubový účet">
            <AccountLink person={p!} />
          </ClubSection>

          <ClubSection title="Týmy">
            {p!.memberships.length === 0 ? (
              <p className="text-muted">Zatím v žádném týmu.</p>
            ) : (
              <ul className="grid gap-2">
                {p!.memberships.map((m) => (
                  <li key={`${m.teamId}-${m.kind}`} className="flex flex-wrap items-baseline gap-x-3">
                    <span className="tabular w-16 font-bold text-accent">{m.seasonName}</span>
                    <Link to="/klub/tym/$teamId" params={{ teamId: String(m.teamId) }} className="font-semibold hover:text-accent hover:underline">
                      {m.teamName}
                    </Link>
                    <span className="text-muted">
                      {m.kind === 'staff' ? m.staffRole ?? 'realizační tým' : `hráč${m.jerseyNumber != null ? `, č. ${m.jerseyNumber}` : ''}`}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </ClubSection>

          <ClubSection title="Údaje">
            {form && (
              <form onSubmit={submit} className="grid max-w-2xl gap-4">
                <PersonFields value={form} onChange={setForm} errors={fieldErrors(save.error)} />
                {otherError(save.error) && <ErrorNote error={save.error} />}
                {remove.error && <ErrorNote error={remove.error} />}
                <div className="flex flex-wrap items-center gap-2">
                  <Button variant="primary" type="submit" disabled={!dirty || save.isPending}>
                    Uložit údaje
                  </Button>
                  {save.isSuccess && !dirty && <span className="text-sm text-ok">Uloženo.</span>}
                  <span className="ml-auto">
                    {confirmDelete ? (
                      <Button variant="danger" onClick={() => remove.mutate(undefined, { onSuccess: () => void navigate({ to: '/klub/lide' }) })}>
                        <Trash2 className="h-4 w-4" /> Smazat i z týmů a licence
                      </Button>
                    ) : (
                      <Button variant="ghost" onClick={() => setConfirmDelete(true)}>
                        <Trash2 className="h-4 w-4" /> Smazat osobu
                      </Button>
                    )}
                  </span>
                </div>
              </form>
            )}
          </ClubSection>

          <LicenceDialog target={licence} onClose={() => setLicence(null)} />
        </>
      )}
    </ClubLayout>
  );
}
