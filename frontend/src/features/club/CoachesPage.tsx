import { Link, useNavigate, useSearch } from '@tanstack/react-router';
import { clubKeys, useClubQuery } from '@/app/clubQueries';
import { ErrorNote, Select, Spinner } from '@/components/ui';
import { czDate, sortName, type LicenceState } from '@/lib/club';
import { cn } from '@/lib/cn';
import { ClubLayout, Table } from './ClubLayout';
import { LicenceBadge, LicenceLine } from './LicenceBadge';

const TILES: { key: 'expired' | 'expiring' | 'missing' | 'valid'; label: (warn: number) => string; tone: string }[] = [
  { key: 'expired', label: () => 'Prošlá licence', tone: 'text-danger' },
  { key: 'expiring', label: (w) => `Vyprší do ${w} dní`, tone: 'text-warn' },
  { key: 'missing', label: () => 'Bez licence', tone: 'text-muted' },
  { key: 'valid', label: () => 'V pořádku', tone: 'text-ok' },
];

/** /klub/treneri — staff of a season and their licences, most urgent first. */
export function CoachesPage() {
  const search = useSearch({ strict: false }) as { sezona?: number };
  const navigate = useNavigate();
  const dash = useClubQuery(clubKeys.coaches(search.sezona ?? null), (club) => club.coaches(search.sezona ?? null));
  const d = dash.data;

  return (
    <ClubLayout
      title="Trenéři a licence"
      actions={
        d && d.seasons.length > 0 ? (
          <label className="flex items-center gap-2 text-sm font-semibold">
            Sezona
            <Select className="w-auto" value={d.season?.id ?? ''} onChange={(e) => void navigate({ to: '/klub/treneri', search: { sezona: Number(e.target.value) }, replace: true })}>
              {d.seasons.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </Select>
          </label>
        ) : null
      }
    >
      {dash.isPending ? (
        <Spinner />
      ) : dash.error ? (
        <ErrorNote error={dash.error} />
      ) : !d!.season ? (
        <p className="text-lg text-muted">Nejdřív založ sezonu a v týmech vyplň realizační tým.</p>
      ) : d!.coaches.length === 0 ? (
        <p className="text-lg text-muted">V sezoně {d!.season.name} zatím žádný tým nemá realizační tým.</p>
      ) : (
        <>
          <dl className="grid grid-cols-2 gap-3 md:grid-cols-4">
            {TILES.map((tile) => (
              <div key={tile.key} className="rounded-xl border border-line bg-panel/40 px-4 py-3">
                <dt className="text-xs font-bold uppercase tracking-wide text-muted">{tile.label(d!.warnDays)}</dt>
                <dd className={cn('tabular mt-1 text-4xl font-extrabold', d!.summary![tile.key] > 0 ? tile.tone : 'text-muted/60')}>{d!.summary![tile.key]}</dd>
              </div>
            ))}
          </dl>

          <div className="mt-8">
            <Table>
              <thead>
                <tr>
                  <th>Trenér</th>
                  <th>Tým a funkce</th>
                  <th>Licence</th>
                  <th>Platí do</th>
                  <th>Stav</th>
                </tr>
              </thead>
              <tbody>
                {d!.coaches.map((c) => {
                  const best = c.licences[0];
                  return (
                    <tr key={c.person.id} className={rowTone(c.status)}>
                      <td>
                        <Link to="/klub/lide/$personId" params={{ personId: String(c.person.id) }} className="font-semibold hover:text-accent hover:underline">
                          {sortName(c.person)}
                        </Link>
                      </td>
                      <td>
                        {c.teams.map((t) => (
                          <span key={t.teamId} className="block">
                            <Link to="/klub/tym/$teamId" params={{ teamId: String(t.teamId) }} className="hover:underline">
                              {t.teamName}
                            </Link>
                            {t.staffRole && <span className="text-muted">, {t.staffRole.toLocaleLowerCase('cs')}</span>}
                          </span>
                        ))}
                      </td>
                      <td>
                        {best ? (
                          <>
                            <span className="font-semibold">{best.type}</span>
                            {c.licences.length > 1 && <span className="block text-xs text-muted">+ {c.licences.slice(1).map((l) => l.type).join(', ')}</span>}
                          </>
                        ) : (
                          <span className="text-muted">žádná</span>
                        )}
                      </td>
                      <td className="tabular whitespace-nowrap">{best ? (best.validUntil ? czDate(best.validUntil) : 'bez omezení') : ''}</td>
                      <td>
                        {c.status === 'missing' ? <LicenceBadge status="missing" /> : <LicenceLine status={c.status} daysLeft={c.daysLeft} validUntil={best?.validUntil ?? null} />}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </Table>
            <p className="mt-3 text-sm text-muted">
              Stav se řídí licencí s nejdelší platností. Upozornění začíná {d!.warnDays} dní před koncem platnosti.
            </p>
          </div>
        </>
      )}
    </ClubLayout>
  );
}

const rowTone = (s: LicenceState) => (s === 'expired' ? 'bg-danger/[0.06]' : s === 'expiring' ? 'bg-warn/[0.05]' : '');
