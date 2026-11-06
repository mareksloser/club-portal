import { useState } from 'react';
import { Link, useNavigate, useParams } from '@tanstack/react-router';
import { Link2, Pencil, Plus } from 'lucide-react';
import { clubKeys, useClubQuery } from '@/app/clubQueries';
import { Button, ErrorNote, Spinner } from '@/components/ui';
import { birthYear, sortName, type Member } from '@/lib/club';
import { ClubLayout, ClubSection, Table } from './ClubLayout';
import { LicenceLine } from './LicenceBadge';
import { MemberDialog, type MemberTarget } from './MemberDialog';
import { TeamDialog } from './SeasonDialogs';

function PersonCell({ member }: { member: Member }) {
  return (
    <span className="flex items-center gap-2">
      <Link to="/klub/lide/$personId" params={{ personId: String(member.person.id) }} className="font-semibold hover:text-accent hover:underline">
        {sortName(member.person)}
      </Link>
      {member.person.authSub && <Link2 className="h-3.5 w-3.5 text-muted" aria-label={`Propojeno s účtem ${member.person.authName ?? ''}`} />}
    </span>
  );
}

function EditButton({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button type="button" aria-label={label} title={label} onClick={onClick} className="grid h-8 w-8 place-items-center rounded text-muted hover:bg-raised hover:text-ink focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent">
      <Pencil className="h-3.5 w-3.5" />
    </button>
  );
}

/** /klub/tym/:id — players and staff of one team in one season. */
export function TeamPage() {
  const { teamId } = useParams({ strict: false }) as { teamId: string };
  const id = Number(teamId);
  const navigate = useNavigate();
  const team = useClubQuery(clubKeys.team(id), (club) => club.team(id));
  const [target, setTarget] = useState<MemberTarget | null>(null);
  const [editTeam, setEditTeam] = useState(false);
  const t = team.data;

  return (
    <ClubLayout
      title={
        t ? (
          <>
            <Link to="/klub" search={{ sezona: t.seasonId }} className="block text-base font-bold uppercase tracking-wide text-accent hover:underline">
              Sezona {t.seasonName}
            </Link>
            {t.name}
            {t.category && <span className="ml-3 text-2xl font-bold text-muted">{t.category}</span>}
          </>
        ) : (
          'Tým'
        )
      }
      actions={
        t && (
          <Button onClick={() => setEditTeam(true)}>
            <Pencil className="h-4 w-4" /> Upravit tým
          </Button>
        )
      }
    >
      {team.isPending ? (
        <Spinner />
      ) : team.error ? (
        <ErrorNote error={team.error} />
      ) : (
        <>
          <ClubSection
            title={`Hráči (${t!.players.length})`}
            actions={
              <Button size="sm" variant="primary" onClick={() => setTarget({ add: 'player' })}>
                <Plus className="h-4 w-4" /> Přidat hráče
              </Button>
            }
          >
            {t!.players.length === 0 ? (
              <p className="text-muted">Soupiska je prázdná.</p>
            ) : (
              <Table>
                <thead>
                  <tr>
                    <th className="w-14">Č.</th>
                    <th>Hráč</th>
                    <th>Ročník</th>
                    <th>ID FAČR</th>
                    <th>Účet</th>
                    <th className="w-10"><span className="sr-only">Upravit</span></th>
                  </tr>
                </thead>
                <tbody>
                  {t!.players.map((m) => (
                    <tr key={m.id}>
                      <td className="tabular font-bold">{m.jerseyNumber ?? ''}</td>
                      <td><PersonCell member={m} /></td>
                      <td className="tabular">{birthYear(m.person.birthDate)}</td>
                      <td className="tabular">{m.person.facrId ?? ''}</td>
                      <td className="max-w-[14rem] truncate text-muted">{m.person.authName ?? ''}</td>
                      <td><EditButton label={`Upravit ${sortName(m.person)}`} onClick={() => setTarget({ member: m })} /></td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            )}
          </ClubSection>

          <ClubSection
            title={`Realizační tým (${t!.staff.length})`}
            actions={
              <Button size="sm" variant="primary" onClick={() => setTarget({ add: 'staff' })}>
                <Plus className="h-4 w-4" /> Přidat člena
              </Button>
            }
          >
            {t!.staff.length === 0 ? (
              <p className="text-muted">Zatím bez trenérů a vedoucích.</p>
            ) : (
              <Table>
                <thead>
                  <tr>
                    <th>Funkce</th>
                    <th>Jméno</th>
                    <th>Licence</th>
                    <th>Účet</th>
                    <th className="w-10"><span className="sr-only">Upravit</span></th>
                  </tr>
                </thead>
                <tbody>
                  {t!.staff.map((m) => {
                    const best = m.licences?.[0];
                    return (
                      <tr key={m.id}>
                        <td className="font-semibold">{m.staffRole ?? ''}</td>
                        <td><PersonCell member={m} /></td>
                        <td>
                          {best ? (
                            <span className="grid gap-1">
                              <span className="font-semibold">{best.type}</span>
                              <LicenceLine status={best.status} daysLeft={best.daysLeft} validUntil={best.validUntil} />
                            </span>
                          ) : (
                            <LicenceLine status="missing" daysLeft={null} validUntil={null} />
                          )}
                        </td>
                        <td className="max-w-[14rem] truncate text-muted">{m.person.authName ?? ''}</td>
                        <td><EditButton label={`Upravit ${sortName(m.person)}`} onClick={() => setTarget({ member: m })} /></td>
                      </tr>
                    );
                  })}
                </tbody>
              </Table>
            )}
          </ClubSection>

          <MemberDialog teamId={id} target={target} onClose={() => setTarget(null)} />
          <TeamDialog
            open={editTeam}
            team={t!}
            seasonId={t!.seasonId}
            onClose={() => setEditTeam(false)}
            onDeleted={() => void navigate({ to: '/klub', search: { sezona: t!.seasonId } })}
          />
        </>
      )}
    </ClubLayout>
  );
}
