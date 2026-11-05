import { useState, type CSSProperties } from 'react';
import type { PortalApp } from '@/lib/types';
import { accessLabel, initials } from '@/lib/labels';
import { isHexColor, readableInk } from '@/lib/color';

/** The club green from the token set, for apps without their own accent in the IdP. */
const FALLBACK_ACCENT = '#128c54';

/**
 * One application. The coloured band carries the app's identity (its login-page accent
 * and logo from the IdP), so the same colour greets the user on the next screen.
 */
export function AppTile({ app }: { app: PortalApp }) {
  const accent = isHexColor(app.accentColor) ? app.accentColor : FALLBACK_ACCENT;
  const [logoFailed, setLogoFailed] = useState(false);
  const showLogo = app.logoUrl !== null && !logoFailed;

  return (
    <a
      href={app.url}
      style={{ '--tile-accent': accent } as CSSProperties}
      className="group flex min-h-[8rem] overflow-hidden rounded-xl border border-line bg-panel transition-colors hover:border-[color:var(--tile-accent)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[color:var(--tile-accent)]"
    >
      <span
        className="flex w-16 shrink-0 items-center justify-center sm:w-24"
        style={{ backgroundColor: accent, color: readableInk(accent) }}
        aria-hidden="true"
      >
        {showLogo ? (
          <span className="grid h-12 w-12 place-items-center rounded-lg bg-white p-1.5 sm:h-14 sm:w-14">
            <img src={app.logoUrl!} alt="" className="max-h-full max-w-full object-contain" onError={() => setLogoFailed(true)} />
          </span>
        ) : (
          <span className="font-display text-2xl font-bold tracking-tight sm:text-3xl">{initials(app.name)}</span>
        )}
      </span>
      <span className="flex min-w-0 flex-1 flex-col justify-center px-4 py-4 sm:px-5">
        <span className="font-display text-2xl font-semibold leading-tight group-hover:underline group-hover:decoration-[color:var(--tile-accent)] group-hover:decoration-2 group-hover:underline-offset-4">
          {app.name}
        </span>
        {app.description && <span className="mt-1 text-[0.95rem] leading-snug text-muted">{app.description}</span>}
        {app.access !== 'superadmin' && <span className="mt-2 text-sm font-medium text-ink/80">{accessLabel(app.access, app.roles)}</span>}
      </span>
    </a>
  );
}
