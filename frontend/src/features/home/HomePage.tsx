import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from '@tanstack/react-router';
import { RotateCw } from 'lucide-react';
import { useDashboard } from '@/app/queries';
import { Button, ErrorNote, Panel, Spinner } from '@/components/ui';
import { greeting, teamLine } from '@/lib/labels';
import type { Dashboard, PortalApp } from '@/lib/types';
import { splitApps } from '@/lib/apps';
import { AppTile } from './AppTile';

export function HomePage() {
  const dashboard = useDashboard();
  const navigate = useNavigate();
  const { href } = useLocation();

  // The portal has nothing to show anonymously: go straight to the club login.
  useEffect(() => {
    if (dashboard.data === null) void navigate({ to: '/login', search: href === '/' ? {} : { redirect: href }, replace: true });
  }, [dashboard.data, navigate, href]);

  if (dashboard.isPending || dashboard.data === null) {
    return (
      <div className="mt-16 flex justify-center">
        <Spinner />
      </div>
    );
  }

  if (dashboard.error) {
    return (
      <Panel className="mx-auto grid max-w-md gap-4 p-5">
        <ErrorNote error={dashboard.error} />
        <Button variant="primary" disabled={dashboard.isFetching} onClick={() => void dashboard.refetch()}>
          <RotateCw className="h-4 w-4" /> Načíst znovu
        </Button>
      </Panel>
    );
  }

  return <Home data={dashboard.data} />;
}

function Home({ data }: { data: Dashboard }) {
  const { member, apps, links } = data;
  const { own, adminOnly } = splitApps(apps);
  const [now] = useState(() => new Date());

  return (
    <>
      <section aria-labelledby="who">
        <p className="text-lg text-muted">{greeting(now)},</p>
        <h1 id="who" className="font-display text-5xl font-semibold leading-[0.95] tracking-tight md:text-6xl">
          {member.name}
        </h1>
        {member.teams.length > 0 && (
          <ul className="mt-5 flex flex-wrap gap-x-8 gap-y-2" aria-label="Vaše týmy">
            {member.teams.map((team) => {
              const { name, membership } = teamLine(team);
              return (
                <li key={team.slug} className="leading-tight">
                  <span className="block font-medium">{name}</span>
                  <span className="block text-sm text-muted">{membership}</span>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <section aria-labelledby="apps" className="mt-12">
        <h2 id="apps" className="font-display text-2xl font-semibold">
          Vaše aplikace
        </h2>
        {own.length === 0 ? (
          <Panel className="mt-4 max-w-xl p-5">
            <p className="font-medium">Zatím nemáte přístup k žádné aplikaci.</p>
            <p className="mt-1 text-muted">
              Přístup přiděluje trenér nebo správce klubových účtů. Napište mu, kterou aplikaci potřebujete, a po přidělení
              se tady objeví sama.
            </p>
          </Panel>
        ) : (
          <AppGrid apps={own} />
        )}
      </section>

      {adminOnly.length > 0 && (
        <section aria-labelledby="admin-apps" className="mt-12">
          <h2 id="admin-apps" className="font-display text-2xl font-semibold">
            Ostatní aplikace klubu
          </h2>
          <p className="mt-1 max-w-xl text-muted">Nemáte v nich žádnou roli, vidíte je jen jako správce účtů.</p>
          <AppGrid apps={adminOnly} />
        </section>
      )}

      <p className="mt-12 max-w-xl text-sm text-muted">
        Heslo, dvoufázové ověření a přihlášená zařízení najdete v{' '}
        <a href={links.account} className="font-medium text-ink underline decoration-line underline-offset-4 hover:decoration-pitch">
          klubovém účtu
        </a>
        .{own.length > 0 && ' Chybí vám tu aplikace? O přístup požádejte trenéra nebo správce účtů.'}
      </p>
    </>
  );
}

function AppGrid({ apps }: { apps: PortalApp[] }) {
  return (
    <ul className="mt-4 grid gap-4 md:grid-cols-2">
      {apps.map((app) => (
        <li key={app.clientId} className="grid">
          <AppTile app={app} />
        </li>
      ))}
    </ul>
  );
}
