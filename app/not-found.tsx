import Link from 'next/link';

export default function NotFound() {
  return (
    <main className="mx-auto flex min-h-[60vh] max-w-md flex-col items-center justify-center gap-4 px-4 text-center">
      <span aria-hidden className="text-4xl">
        🧭
      </span>
      <h1 className="font-display text-paper text-xl font-bold">
        This place isn&apos;t on the menu
      </h1>
      <p className="text-text-muted text-sm">
        The page you&apos;re after doesn&apos;t exist, or the restaurant is no
        longer listed.
      </p>
      <Link
        href="/"
        className="rounded-control bg-accent-primary text-ink-on-primary px-4 py-2 text-sm font-semibold"
      >
        Back to the food
      </Link>
    </main>
  );
}
