import { useEffect, useState } from 'react';
import { Check, Pencil, Plus, RotateCw, Users } from 'lucide-react';
import { Link } from '@tanstack/react-router';
import { useConfig, useDashboard, useDirectory, useEdit } from '@/app/queries';
import { Button, ErrorNote, Spinner } from '@/components/ui';
import { isDemo } from '@/api';
import { greeting, longDate } from '@/lib/date';
import { moveId } from '@/lib/links';
import type { Dashboard } from '@/lib/types';
import { LinkDialog, type LinkTarget } from '@/features/edit/LinkDialog';
import { SectionDialog, type SectionTarget } from '@/features/edit/SectionDialog';
import { AccountMenu } from './AccountMenu';
import { SectionBlock } from './SectionBlock';
import { Weather } from './Weather';

export function HomePage() {
  const config = useConfig();
  const dashboard = useDashboard();
  const [now] = useState(() => new Date());
  const [editing, setEditing] = useState(false);
  const isEditor = dashboard.data?.editor ?? false;
  const editMode = editing && isEditor;
  const clubName = config.data?.clubName;

  useEffect(() => {
    if (clubName) document.title = clubName;
  }, [clubName]);

  return (
    <div className="mx-auto max-w-6xl px-5 pb-20 pt-5 md:px-8">
      {isDemo && <p className="mb-4 rounded-md bg-raised px-3 py-1.5 text-center text-xs text-muted">Ukázka: data jsou jen v prohlížeči a odkazy nikam nevedou.</p>}

      <header className="flex flex-wrap items-center gap-x-4 gap-y-2">
        <p className="text-sm font-semibold uppercase tracking-wide">{longDate(now)}</p>
        <div className="ml-auto flex items-center gap-1">
          {isEditor && !editMode && (
            <Link
              to="/klub"
              className="inline-flex h-8 items-center gap-2 rounded-md px-3 text-sm font-semibold text-muted hover:bg-raised hover:text-ink focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent"
            >
              <Users className="h-4 w-4" /> Evidence klubu
            </Link>
          )}
          {isEditor && (
            <Button variant={editMode ? 'primary' : 'ghost'} size="sm" onClick={() => setEditing(!editMode)} aria-pressed={editMode}>
              {editMode ? <Check className="h-4 w-4" /> : <Pencil className="h-4 w-4" />}
              {editMode ? 'Hotovo' : 'Upravit'}
            </Button>
          )}
          <AccountMenu member={dashboard.data?.member ?? null} accountUrl={config.data?.issuer ? `${config.data.issuer}/` : null} />
        </div>
      </header>

      <div className="mt-8 flex flex-wrap items-center justify-between gap-6 md:mt-10">
        <h1 className="text-5xl font-extrabold leading-none tracking-tight md:text-7xl">{greeting(now)}!</h1>
        <Weather place={config.data?.weather} />
      </div>

      <div className="mt-12 md:mt-14">
        {dashboard.isPending ? (
          <Spinner />
        ) : dashboard.error ? (
          <div className="grid max-w-md gap-3">
            <ErrorNote error={dashboard.error} />
            <Button className="justify-self-start" onClick={() => void dashboard.refetch()} disabled={dashboard.isFetching}>
              <RotateCw className="h-4 w-4" /> Načíst znovu
            </Button>
          </div>
        ) : (
          <Sections data={dashboard.data} editMode={editMode} />
        )}
      </div>
    </div>
  );
}

function Sections({ data, editMode }: { data: Dashboard; editMode: boolean }) {
  const directory = useDirectory(editMode);
  const [linkTarget, setLinkTarget] = useState<LinkTarget | null>(null);
  const [sectionTarget, setSectionTarget] = useState<SectionTarget | null>(null);
  const reorderSections = useEdit((api, ids: number[]) => api.reorderSections(ids));
  const reorderLinks = useEdit((api, { sectionId, ids }: { sectionId: number; ids: number[] }) => api.reorderLinks(sectionId, ids));
  const failure = reorderSections.error ?? reorderLinks.error;

  if (data.sections.length === 0 && !editMode) {
    return (
      <p className="max-w-lg text-lg text-muted">
        {data.member ? 'Zatím tu pro vás nic není. O přístup požádejte trenéra nebo správce klubu.' : 'Po přihlášení klubovým účtem tu najdete odkazy pro svůj tým.'}
      </p>
    );
  }

  return (
    <>
      {failure && (
        <div className="mb-6 max-w-md">
          <ErrorNote error={failure} />
        </div>
      )}
      {data.sections.map((section, index) => {
        const up = moveId(data.sections, section.id, -1);
        const down = moveId(data.sections, section.id, 1);
        return (
          <SectionBlock
            key={section.id}
            section={section}
            editing={
              editMode
                ? {
                    directory: directory.data,
                    canMoveUp: index > 0,
                    canMoveDown: index < data.sections.length - 1,
                    onMoveSection: (delta) => {
                      const ids = delta < 0 ? up : down;
                      if (ids) reorderSections.mutate(ids);
                    },
                    onEditSection: () => setSectionTarget({ section }),
                    onAddLink: (column) => setLinkTarget({ sectionId: section.id, column }),
                    onEditLink: (link) => setLinkTarget({ link }),
                    onReorderLinks: (ids) => reorderLinks.mutate({ sectionId: section.id, ids }),
                  }
                : null
            }
          />
        );
      })}

      {editMode && (
        <div className="mt-14 flex flex-wrap items-center gap-4">
          <Button onClick={() => setSectionTarget({ create: true })}>
            <Plus className="h-4 w-4" /> Nová sekce
          </Button>
          {directory.error && <p className="text-sm text-muted">Týmy a role se nepodařilo načíst z klubového účtu, u pravidel je zadávej ručně.</p>}
        </div>
      )}

      <LinkDialog target={linkTarget} sections={data.sections} directory={directory.data} onClose={() => setLinkTarget(null)} />
      <SectionDialog target={sectionTarget} onClose={() => setSectionTarget(null)} />
    </>
  );
}
