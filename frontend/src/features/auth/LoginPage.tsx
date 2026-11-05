import { useEffect, useRef } from 'react';
import { useNavigate, useRouter, useSearch } from '@tanstack/react-router';
import { LogIn } from 'lucide-react';
import { useDashboard, useSignIn } from '@/app/queries';
import { Button, ErrorNote, Panel, Spinner } from '@/components/ui';
import { safeRedirect } from '@/lib/redirect';

/**
 * Goes straight to the club login: there is nothing to fill in here. The page only shows
 * a spinner, or a button when starting the sign-in failed (e.g. the API is unreachable).
 */
export function LoginPage() {
  // Validate again here: non-strict useSearch can return the raw query string value.
  const redirect = safeRedirect((useSearch({ strict: false }) as { redirect?: unknown }).redirect);
  const dashboard = useDashboard();
  const signIn = useSignIn();
  const navigate = useNavigate();
  const router = useRouter();
  const started = useRef(false);

  const goOn = () => {
    if (redirect) router.history.replace(redirect);
    else void navigate({ to: '/', replace: true });
  };

  useEffect(() => {
    if (started.current || dashboard.isPending) return;
    started.current = true;
    if (dashboard.data) {
      goOn(); // already signed in (e.g. an old link to /login)
      return;
    }
    signIn.mutate({ returnTo: redirect ?? undefined }, { onSuccess: goOn });
  }, [dashboard.isPending, dashboard.data]);

  if (signIn.error || dashboard.error) {
    return (
      <Panel className="mx-auto grid max-w-sm gap-4 p-5">
        <ErrorNote error={signIn.error ?? dashboard.error} />
        <Button variant="primary" disabled={signIn.isPending} onClick={() => signIn.mutate({ returnTo: redirect ?? undefined }, { onSuccess: goOn })}>
          <LogIn className="h-4 w-4" /> Zkusit znovu
        </Button>
      </Panel>
    );
  }

  return (
    <div className="mt-16 flex flex-col items-center gap-3 text-muted">
      <Spinner />
      Přesměrovávám na přihlášení klubovým účtem…
    </div>
  );
}
