import { Link } from '@tanstack/react-router';

export function NotFoundPage() {
  return (
    <main className="mx-auto max-w-md px-5 pt-24 text-center">
      <h1 className="text-4xl font-extrabold">Tahle stránka neexistuje</h1>
      <p className="mt-2 text-muted">Odkaz je možná starý nebo neúplný.</p>
      <Link to="/" className="mt-6 inline-flex h-10 items-center rounded-md bg-accent px-4 font-semibold text-accent-ink hover:bg-accent/90">
        Zpět na rozcestník
      </Link>
    </main>
  );
}
