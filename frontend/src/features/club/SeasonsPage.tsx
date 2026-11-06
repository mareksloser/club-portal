import { useState } from 'react';
import { Link, useNavigate, useSearch } from '@tanstack/react-router';
import { CalendarRange, Pencil, Plus } from 'lucide-react';
import { clubKeys, useClubQuery } from '@/app/clubQueries';
import { Button, ErrorNote, Spinner } from '@/components/ui';
import { czDate, type Season } from '@/lib/club';
import { cn } from '@/lib/cn';
import { ClubLayout } from './ClubLayout';
import { SeasonDialog, TeamDialog } from './SeasonDialogs';

const plural = (n: number, one: string, few: string, many: string) => `${n} ${n === 1 ? one : n >= 2 && n <= 4 ? few : many}`;

/** /klub — seasons as tabs, the selected season's teams as cards. */
export function SeasonsPage() {
  const search = useSearch({ strict: false }) as { sezona?: number };
  const navigate = useNavigate();
  const seasons = useClubQuery(clubKeys.seasons, (club) => club.seasons());
  const seasonId = search.sezona ?? seasons.data?.currentId ?? null;
  const season = useClubQuery(clubKeys.season(seasonId ?? 0), (club) => club.season(seasonId!), seasonId !== null);
  const [seasonDialog, setSeasonDialog] = useState<{ season: Season | null } | null>(null);
  const [teamDialog, setTeamDialog] = useState(false);
  const list = seasons.data?.seasons ?? [];
  const select = (id: number | undefined) => void navigate({ to: '/klub', search: id ? { sezona: id } : {}, replace: true });

  return (
    <ClubLayout
      title="Týmy"
      actions={
        <Button onClick={() => setSeasonDialog({ season: null })}>
          <Plus className="h-4 w-4" /> Nová sezona
        </Button>
      }
    >
      {seasons.isPending ? (
        <Spinner />
      ) : seasons.error ? (
        <ErrorNote error={seasons.error} />
      ) : list.length === 0 ? (
        <div className="max-w-lg">
          <p className="text-lg text-muted">Zatím tu není žádná sezona. Začni první sezonou, pak do ní přidáš týmy a soupisky.</p>
          <Button variant="primary" className="mt-4" onClick={() => setSeasonDialog({ season: null })}>
            <Plus className="h-4 w-4" /> Vytvořit sezonu
          </Button>
        </div>
      ) : (
        <>
          <nav aria-label="Sezony" className="flex flex-wrap gap-2">
            {list.map((s) => (
              <button
                key={s.id}
                type="button"
                onClick={() => select(s.id)}
                aria-current={s.id === seasonId ? 'true' : undefined}
                className={cn(
                  'tabular rounded-md border px-3 py-1.5 font-bold focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent',
                  s.id === seasonId ? 'border-accent bg-accent/10 text-ink' : 'border-line text-muted hover:text-ink',
                )}
              >
                {s.name}
                {s.id === seasons.data?.currentId && <span className="ml-1.5 text-xs font-semibold uppercase text-accent">aktuální</span>}
              </button>
            ))}
          </nav>

          {season.data && (
            <div className="mt-6 flex flex-wrap items-center gap-x-4 gap-y-2">
              <p className="flex items-center gap-2 text-muted">
                <CalendarRange className="h-4 w-4" aria-hidden="true" />
                {czDate(season.data.startsOn)} až {czDate(season.data.endsOn)}
              </p>
              <Button size="sm" variant="ghost" onClick={() => setSeasonDialog({ season: season.data })}>
                <Pencil className="h-3.5 w-3.5" /> Upravit sezonu
              </Button>
            </div>
          )}

          <div className="mt-6">
            {season.isPending ? (
              <Spinner />
            ) : season.error ? (
              <ErrorNote error={season.error} />
            ) : (
              <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {season.data.teams.map((t) => (
                  <li key={t.id}>
                    <Link
                      to="/klub/tym/$teamId"
                      params={{ teamId: String(t.id) }}
                      className="group block h-full rounded-xl border border-line bg-panel/40 p-4 hover:border-accent focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent"
                    >
                      <span className="flex items-baseline justify-between gap-3">
                        <span className="text-lg font-bold uppercase tracking-wide group-hover:text-accent">{t.name}</span>
                        {t.category && <span className="text-sm font-semibold text-accent">{t.category}</span>}
                      </span>
                      <span className="mt-2 block text-sm text-muted">
                        {plural(t.playerCount, 'hráč', 'hráči', 'hráčů')}, {plural(t.staffCount, 'člen', 'členové', 'členů')} realizačního týmu
                      </span>
                    </Link>
                  </li>
                ))}
                <li>
                  <button
                    type="button"
                    onClick={() => setTeamDialog(true)}
                    className="flex h-full min-h-[5.5rem] w-full items-center justify-center gap-2 rounded-xl border border-dashed border-line font-semibold text-muted hover:border-accent hover:text-accent focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent"
                  >
                    <Plus className="h-4 w-4" /> Nový tým
                  </button>
                </li>
              </ul>
            )}
          </div>
        </>
      )}

      <SeasonDialog
        open={seasonDialog !== null}
        season={seasonDialog?.season ?? null}
        seasons={list}
        onClose={() => setSeasonDialog(null)}
        onSaved={(id) => {
          setSeasonDialog(null);
          select(id);
        }}
        onDeleted={() => {
          setSeasonDialog(null);
          select(undefined);
        }}
      />
      {seasonId !== null && (
        <TeamDialog
          open={teamDialog}
          team={null}
          seasonId={seasonId}
          onClose={() => setTeamDialog(false)}
          onSaved={(id) => {
            setTeamDialog(false);
            void navigate({ to: '/klub/tym/$teamId', params: { teamId: String(id) } });
          }}
        />
      )}
    </ClubLayout>
  );
}
