import { useEffect } from 'react';
import { Link, Outlet } from '@tanstack/react-router';
import { Crest } from '@/components/Crest';
import { isDemo } from '@/api';
import { useConfig, useDashboard } from './queries';
import { UserMenu } from './UserMenu';

export function Layout() {
  const { data: config } = useConfig();
  const { data: dashboard } = useDashboard();
  const clubName = config?.clubName ?? '';

  useEffect(() => {
    if (clubName) document.title = clubName;
  }, [clubName]);

  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-20 border-b border-line bg-panel/95 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-5xl items-center gap-3 px-4 md:px-8">
          <Link to="/" className="flex items-center gap-3 rounded-md focus-visible:outline focus-visible:outline-2 focus-visible:outline-pitch">
            <Crest className="h-10 w-9" />
            <span className="font-display text-xl font-semibold leading-none">{clubName}</span>
          </Link>
          <div className="ml-auto">{dashboard && <UserMenu dashboard={dashboard} />}</div>
        </div>
        {isDemo && (
          <div className="border-t border-line bg-raised px-4 py-1.5 text-center text-xs text-muted">
            Ukázková verze s vymyšlenými aplikacemi, odkazy nikam nevedou.
          </div>
        )}
      </header>
      <main className="mx-auto w-full max-w-5xl flex-1 px-4 pb-16 pt-8 md:px-8 md:pt-12">
        <Outlet />
      </main>
    </div>
  );
}
