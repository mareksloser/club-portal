import { useEffect, useRef, useState } from 'react';
import { useNavigate, useRouter } from '@tanstack/react-router';
import { useQueryClient } from '@tanstack/react-query';
import { useApi } from '@/app/ApiContext';
import { keys } from '@/app/queries';
import { Button, ErrorNote, Panel, Spinner } from '@/components/ui';
import { safeRedirect } from '@/lib/redirect';

/** Landing page after the club login: exchanges the code for tokens. */
export function AuthCallbackPage() {
  const api = useApi();
  const qc = useQueryClient();
  const router = useRouter();
  const navigate = useNavigate();
  const [error, setError] = useState<unknown>(null);
  // The authorization code can be redeemed only once; StrictMode runs effects twice in development.
  const started = useRef(false);

  useEffect(() => {
    if (started.current) return;
    started.current = true;
    api.completeSignIn().then(
      ({ returnTo }) => {
        void qc.invalidateQueries({ queryKey: keys.dashboard });
        const target = safeRedirect(returnTo);
        if (target) router.history.replace(target);
        else void navigate({ to: '/', replace: true });
      },
      (e: unknown) => setError(e),
    );
  }, [api, qc, router, navigate]);

  if (!error) {
    return (
      <div className="mt-16 flex flex-col items-center gap-3 text-muted">
        <Spinner />
        Dokončuji přihlášení…
      </div>
    );
  }

  return (
    <Panel className="mx-auto grid max-w-md gap-4 p-5">
      <h1 className="font-display text-2xl font-semibold">Přihlášení se nepovedlo</h1>
      <ErrorNote error={error} />
      <Button variant="primary" onClick={() => void api.signIn({})}>
        Zkusit znovu
      </Button>
    </Panel>
  );
}
