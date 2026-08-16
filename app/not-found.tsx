import Link from 'next/link';

export default function NotFound() {
  return (
    <main className="mx-auto flex min-h-[60vh] max-w-md flex-col items-center justify-center gap-4 px-4 text-center">
      <CompassIcon />
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

function CompassIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden
      className="text-accent-primary size-10 fill-none stroke-current stroke-[1.7]"
    >
      <circle cx="12" cy="12" r="9" />
      <path d="m15.5 8.5-2.1 4.9-4.9 2.1 2.1-4.9 4.9-2.1Z" />
    </svg>
  );
}
