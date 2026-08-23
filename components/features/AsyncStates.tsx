'use client';

// Shared loading / error scaffolding for pages that fetch on the client (authed
// views that used to be Server Components). Keeps the spinner + retry affordance
// identical across bookings, saved, friends, owner console, and admin.
import { Card } from '@/components/ui/Card';

export function LoadingBlock({ label = 'Loading…' }: { label?: string }) {
  return (
    <div
      className="grid min-h-[40vh] place-items-center px-6"
      role="status"
      aria-live="polite"
    >
      <div className="flex flex-col items-center gap-3 text-center">
        <span
          className="h-7 w-7 animate-spin rounded-full border-2 border-[#1DB954] border-t-transparent"
          aria-hidden
        />
        <p className="text-text-muted text-sm">{label}</p>
      </div>
    </div>
  );
}

export function ErrorBlock({
  message,
  onRetry,
}: {
  message: string;
  onRetry?: () => void;
}) {
  return (
    <Card className="text-text-muted mx-auto mt-4 max-w-md space-y-3 text-center text-sm">
      <p>{message}</p>
      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          className="text-accent-primary font-bold hover:underline"
        >
          Try again
        </button>
      )}
    </Card>
  );
}
