import { useEffect, type ReactNode } from 'react';
import { Link } from '@tanstack/react-router';
import { ArrowLeft } from 'lucide-react';
import { useConfig, useDashboard } from '@/app/queries';
import { ErrorNote, Spinner } from '@/components/ui';
import { isDemo } from '@/api';
import { AccountMenu } from '@/features/home/AccountMenu';
import { cn } from '@/lib/cn';

const TABS = [
  { to: '/klub', label: 'Týmy', exact: true },
  { to: '/klub/lide', label: 'Lidé', exact: false },
  { to: '/klub/treneri', label: 'Trenéři', exact: false },
] as const;

/** Header with the registry's tabs; only editors get past it. */
export function ClubLayout({ title, actions, children }: { title: ReactNode; actions?: ReactNode; children: ReactNode }) {
  const config = useConfig();
  const dashboard = useDashboard();
  const titleText = typeof title === 'string' ? title : 'Klub';

  useEffect(() => {
    document.title = `${titleText} | ${config.data?.clubName ?? 'Klub'}`;
  }, [titleText, config.data?.clubName]);

  let body: ReactNode = children;
  if (dashboard.isPending) body = <Spinner />;
  else if (dashboard.error) body = <ErrorNote error={dashboard.error} />;
  else if (!dashboard.data?.member) body = <p className="text-lg text-muted">Evidence klubu je jen pro přihlášené správce.</p>;
  else if (!dashboard.data.editor) body = <p className="text-lg text-muted">Evidenci klubu mohou spravovat jen správci rozcestníku.</p>;

  return (
    <div className="mx-auto max-w-6xl px-5 pb-20 pt-5 md:px-8">
      {isDemo && <p className="mb-4 rounded-md bg-raised px-3 py-1.5 text-center text-xs text-muted">Ukázka: data jsou jen v prohlížeči.</p>}
      <header className="flex flex-wrap items-center gap-x-6 gap-y-3">
        <Link to="/" className="inline-flex items-center gap-1.5 text-sm font-semibold uppercase tracking-wide text-muted hover:text-ink">
          <ArrowLeft className="h-4 w-4" /> Rozcestník
        </Link>
        <nav aria-label="Evidence klubu" className="flex gap-1">
          {TABS.map((tab) => (
            <Link
              key={tab.to}
              to={tab.to}
              activeOptions={{ exact: tab.exact }}
              className="rounded-md px-3 py-1.5 text-sm font-bold uppercase tracking-wide text-muted hover:text-ink"
              activeProps={{ className: cn('bg-raised !text-ink') }}
            >
              {tab.label}
            </Link>
          ))}
        </nav>
        <div className="ml-auto">
          <AccountMenu member={dashboard.data?.member ?? null} accountUrl={config.data?.issuer ? `${config.data.issuer}/` : null} />
        </div>
      </header>

      <div className="mt-10 flex flex-wrap items-end justify-between gap-4">
        <h1 className="text-4xl font-extrabold leading-tight tracking-tight md:text-5xl">{title}</h1>
        {dashboard.data?.editor && actions && <div className="flex flex-wrap gap-2">{actions}</div>}
      </div>
      <div className="mt-8">{body}</div>
    </div>
  );
}

/** A section heading inside a club page. */
export function ClubSection({ title, actions, children, className }: { title: string; actions?: ReactNode; children: ReactNode; className?: string }) {
  return (
    <section className={cn('mt-12 first:mt-0', className)} aria-label={title}>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-xl font-extrabold uppercase tracking-wide">{title}</h2>
        {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
      </div>
      <div className="mt-4">{children}</div>
    </section>
  );
}

/** Scrolls sideways on narrow screens instead of squeezing columns. */
export function Table({ children }: { children: ReactNode }) {
  return (
    <div className="overflow-x-auto rounded-lg border border-line">
      <table className="w-full min-w-[36rem] border-collapse text-left text-sm [&_td]:border-t [&_td]:border-line [&_td]:px-3 [&_td]:py-2.5 [&_th]:px-3 [&_th]:py-2 [&_th]:text-xs [&_th]:font-bold [&_th]:uppercase [&_th]:tracking-wide [&_th]:text-muted">
        {children}
      </table>
    </div>
  );
}
