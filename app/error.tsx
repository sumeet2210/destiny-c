'use client';

import { Button } from '@/components/ui/Button';

export default function GlobalError({
  reset,
}: {
  error: Error;
  reset: () => void;
}) {
  return (
    <main className="mx-auto flex min-h-[60vh] max-w-md flex-col items-center justify-center gap-4 px-4 text-center">
      <AlertIcon />
      <h1 className="font-display text-paper text-xl font-bold">
        Something burnt in the kitchen
      </h1>
      <p className="text-text-muted text-sm">
        That wasn&apos;t supposed to happen. Give it another go.
      </p>
      <Button onClick={reset}>Try again</Button>
    </main>
  );
}

function AlertIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden
      className="text-accent-primary size-10 fill-none stroke-current stroke-[1.7]"
    >
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v6M12 17h.01" />
    </svg>
  );
}
