import { useEffect, useState, type FormEvent } from 'react';
import { Trash2 } from 'lucide-react';
import { ApiError } from '@/api/client';
import { useClubMutation } from '@/app/clubQueries';
import { useDirectory } from '@/app/queries';
import { Dialog } from '@/components/ui/dialog';
import { Button, ErrorNote, Field, Input, Select } from '@/components/ui';
import type { Season, Team } from '@/lib/club';

/** Next season after the latest one: "2026/27", 1 July – 30 June. Pure. */
export function suggestSeason(seasons: Season[]): { name: string; startsOn: string; endsOn: string } {
  const latest = seasons[0]?.startsOn ? Number(seasons[0].startsOn.slice(0, 4)) + 1 : new Date().getFullYear();
  return { name: `${latest}/${String((latest + 1) % 100).padStart(2, '0')}`, startsOn: `${latest}-07-01`, endsOn: `${latest + 1}-06-30` };
}

function Footer({ onDelete, deleteLabel, onClose, saving, submitLabel }: { onDelete?: () => void; deleteLabel?: string; onClose: () => void; saving: boolean; submitLabel: string }) {
  const [confirm, setConfirm] = useState(false);
  return (
    <div className="flex flex-wrap items-center gap-2 border-t border-line pt-4">
      {onDelete &&
        (confirm ? (
          <Button variant="danger" onClick={onDelete}>
            <Trash2 className="h-4 w-4" /> {deleteLabel ?? 'Opravdu smazat'}
          </Button>
        ) : (
          <Button variant="ghost" onClick={() => setConfirm(true)}>
            <Trash2 className="h-4 w-4" /> Smazat
          </Button>
        ))}
      <div className="ml-auto flex gap-2">
        <Button variant="ghost" onClick={onClose}>
          Zrušit
        </Button>
        <Button variant="primary" type="submit" disabled={saving}>
          {submitLabel}
        </Button>
      </div>
    </div>
  );
}
export { Footer as DialogFooter };

const fieldErrors = (e: unknown) => (e instanceof ApiError ? e.fields : {});
const otherError = (e: unknown) => (e && !(e instanceof ApiError && e.status === 422) ? e : null);
export { fieldErrors, otherError };

export function SeasonDialog({
  open,
  season,
  seasons,
  onClose,
  onSaved,
  onDeleted,
}: {
  open: boolean;
  season: Season | null;
  seasons: Season[];
  onClose: () => void;
  onSaved: (id: number) => void;
  onDeleted?: () => void;
}) {
  const [form, setForm] = useState({ name: '', startsOn: '', endsOn: '', copyFrom: '' });
  const save = useClubMutation((club, input: typeof form) => {
    const body = { name: input.name, startsOn: input.startsOn, endsOn: input.endsOn, copyFrom: input.copyFrom ? Number(input.copyFrom) : null };
    return season ? club.updateSeason(season.id, body) : club.createSeason(body);
  });
  const remove = useClubMutation((club, id: number) => club.deleteSeason(id));

  useEffect(() => {
    if (!open) return;
    setForm(season ? { name: season.name, startsOn: season.startsOn, endsOn: season.endsOn, copyFrom: '' } : { ...suggestSeason(seasons), copyFrom: seasons[0] ? String(seasons[0].id) : '' });
    save.reset();
    remove.reset();
  }, [open, season]);

  const set = (patch: Partial<typeof form>) => setForm((f) => ({ ...f, ...patch }));
  const errors = fieldErrors(save.error);
  const submit = (e: FormEvent) => {
    e.preventDefault();
    save.mutate(form, { onSuccess: (s) => onSaved(s.id) });
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()} title={season ? 'Upravit sezonu' : 'Nová sezona'}>
      <form onSubmit={submit} className="grid gap-4">
        <Field label="Název" error={errors.name}>
          <Input value={form.name} maxLength={20} required autoFocus onChange={(e) => set({ name: e.target.value })} placeholder="2026/27" />
        </Field>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Začátek" error={errors.startsOn}>
            <Input type="date" value={form.startsOn} required onChange={(e) => set({ startsOn: e.target.value })} />
          </Field>
          <Field label="Konec" error={errors.endsOn}>
            <Input type="date" value={form.endsOn} required onChange={(e) => set({ endsOn: e.target.value })} />
          </Field>
        </div>
        {!season && seasons.length > 0 && (
          <Field label="Převzít týmy" hint="Zkopíruje týmy i se soupiskami a realizačními týmy. Pak stačí upravit, kdo odešel a kdo přišel." error={errors.copyFrom}>
            <Select value={form.copyFrom} onChange={(e) => set({ copyFrom: e.target.value })}>
              <option value="">Začít bez týmů</option>
              {seasons.map((s) => (
                <option key={s.id} value={s.id}>
                  Ze sezony {s.name}
                </option>
              ))}
            </Select>
          </Field>
        )}
        {otherError(save.error) && <ErrorNote error={save.error} />}
        {remove.error && <ErrorNote error={remove.error} />}
        <Footer
          onClose={onClose}
          saving={save.isPending}
          submitLabel={season ? 'Uložit sezonu' : 'Vytvořit sezonu'}
          onDelete={season ? () => remove.mutate(season.id, { onSuccess: () => onDeleted?.() }) : undefined}
          deleteLabel={season && season.teamCount > 0 ? `Smazat i s ${season.teamCount} týmy` : undefined}
        />
      </form>
    </Dialog>
  );
}

export function TeamDialog({
  open,
  team,
  seasonId,
  onClose,
  onSaved,
  onDeleted,
}: {
  open: boolean;
  team: Team | null;
  seasonId: number;
  onClose: () => void;
  onSaved?: (id: number) => void;
  onDeleted?: () => void;
}) {
  const directory = useDirectory(open);
  const [form, setForm] = useState({ name: '', category: '', authTeam: '' });
  const save = useClubMutation((club, input: typeof form) => {
    const body = { name: input.name, category: input.category.trim() || null, authTeam: input.authTeam || null };
    return team ? club.updateTeam(team.id, body) : club.createTeam({ ...body, seasonId });
  });
  const remove = useClubMutation((club, id: number) => club.deleteTeam(id));

  useEffect(() => {
    if (!open) return;
    setForm({ name: team?.name ?? '', category: team?.category ?? '', authTeam: team?.authTeam ?? '' });
    save.reset();
    remove.reset();
  }, [open, team]);

  const set = (patch: Partial<typeof form>) => setForm((f) => ({ ...f, ...patch }));
  const errors = fieldErrors(save.error);
  const submit = (e: FormEvent) => {
    e.preventDefault();
    save.mutate(form, { onSuccess: (t) => (onSaved ? onSaved(t.id) : onClose()) });
  };
  const members = team ? team.playerCount + team.staffCount : 0;

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()} title={team ? 'Upravit tým' : 'Nový tým'}>
      <form onSubmit={submit} className="grid gap-4">
        <div className="grid gap-4 sm:grid-cols-[2fr_1fr]">
          <Field label="Název" error={errors.name}>
            <Input value={form.name} maxLength={80} required autoFocus onChange={(e) => set({ name: e.target.value })} placeholder="Mladší přípravka" />
          </Field>
          <Field label="Kategorie" error={errors.category}>
            <Input value={form.category} maxLength={40} onChange={(e) => set({ category: e.target.value })} placeholder="U11" />
          </Field>
        </div>
        <Field label="Tým v klubovém účtu" hint="Propojí tým s týmem v přihlašování, např. pro pravidla odkazů v rozcestníku." error={errors.authTeam}>
          {directory.data ? (
            <Select value={form.authTeam} onChange={(e) => set({ authTeam: e.target.value })}>
              <option value="">Nepropojovat</option>
              {directory.data.teams.map((t) => (
                <option key={t.slug} value={t.slug}>
                  {t.name}
                </option>
              ))}
            </Select>
          ) : (
            <Input value={form.authTeam} maxLength={50} onChange={(e) => set({ authTeam: e.target.value.trim() })} placeholder="např. u11" />
          )}
        </Field>
        {otherError(save.error) && <ErrorNote error={save.error} />}
        {remove.error && <ErrorNote error={remove.error} />}
        <Footer
          onClose={onClose}
          saving={save.isPending}
          submitLabel={team ? 'Uložit tým' : 'Vytvořit tým'}
          onDelete={team ? () => remove.mutate(team.id, { onSuccess: () => onDeleted?.() }) : undefined}
          deleteLabel={members > 0 ? `Smazat i se soupiskou (${members})` : undefined}
        />
      </form>
    </Dialog>
  );
}
