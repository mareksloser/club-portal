import { useEffect, useRef } from 'react';
import { useSearch } from '@tanstack/react-router';
import { LogIn } from 'lucide-react';
import { useSignIn } from '@/app/queries';
import { Button, ErrorNote, Spinner } from '@/components/ui';
import { safeRedirect } from '@/lib/redirect';

/** /login goes straight to the club login (handy as a bookmark); shows a button only when that fails. */
export function LoginPage() {
  const redirect = safeRedirect((useSearch({ strict: false }) as { redirect?: unknown }).redirect);
  const signIn = useSignIn();
  const started = useRef(false);

  useEffect(() => {
    if (started.current) return;
    started.current = true;
    signIn.mutate({ returnTo: redirect ?? '/' });
  }, [signIn, redirect]);

  return (
    <main className="mx-auto flex max-w-sm flex-col items-center gap-4 px-5 pt-24 text-center text-muted">
      {signIn.error ? (
        <>
          <ErrorNote error={signIn.error} />
          <Button variant="primary" onClick={() => signIn.mutate({ returnTo: redirect ?? '/' })}>
            <LogIn className="h-4 w-4" /> Zkusit znovu
          </Button>
        </>
      ) : (
        <>
          <Spinner />
          Přesměrovávám na přihlášení klubovým účtem…
        </>
      )}
    </main>
  );
}
