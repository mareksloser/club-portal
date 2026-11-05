import { Link } from '@tanstack/react-router';

export function NotFoundPage() {
  return (
    <div className="mx-auto mt-10 max-w-md text-center">
      <h1 className="font-display text-3xl font-semibold">Tahle stránka neexistuje</h1>
      <p className="mt-2 text-muted">Odkaz je možná starý nebo neúplný.</p>
      <Link to="/" className="mt-6 inline-flex h-10 items-center rounded-md bg-pitch px-4 font-medium text-pitch-ink hover:bg-pitch/90">
        Zpět na rozcestník
      </Link>
    </div>
  );
}
