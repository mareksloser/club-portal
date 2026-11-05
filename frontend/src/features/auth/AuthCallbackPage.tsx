import { useEffect, useRef, useState } from 'react';
import { useNavigate, useRouter } from '@tanstack/react-router';
import { useQueryClient } from '@tanstack/react-query';
import { useApi } from '@/app/ApiContext';
import { keys } from '@/app/queries';
import { Button, ErrorNote, Spinner } from '@/components/ui';
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
        if (target && target !== '/') router.history.replace(target);
        else void navigate({ to: '/', replace: true });
      },
      (e: unknown) => setError(e),
    );
  }, [api, qc, router, navigate]);

  return (
    <main className="mx-auto flex max-w-sm flex-col items-center gap-4 px-5 pt-24 text-center text-muted">
      {error ? (
        <>
          <h1 className="text-2xl font-bold text-ink">Přihlášení se nepovedlo</h1>
          <ErrorNote error={error} />
          <Button variant="primary" onClick={() => void api.signIn({})}>
            Zkusit znovu
          </Button>
        </>
      ) : (
        <>
          <Spinner />
          Dokončuji přihlášení…
        </>
      )}
    </main>
  );
}
