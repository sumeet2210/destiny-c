'use client';

import { useTransition } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useToast } from '@/components/ui/Toast';
import { useSaved } from '@/lib/session';
import { cn } from '@/lib/cn';

/** P9-1: save/unsave. Saved is private by default (PRD §5.9). Saved state comes
 *  from the shared SavedProvider, so it stays consistent across every grid and
 *  the restaurant profile without per-card fetches. */
export function SaveToggle({
  restaurantId,
  showLabel = false,
}: {
  restaurantId: string;
  showLabel?: boolean;
}) {
  const { isStudent, isSaved, toggleSave } = useSaved();
  const saved = isSaved(restaurantId);
  const [, startTransition] = useTransition();
  const router = useRouter();
  const pathname = usePathname();
  const toast = useToast();

  return (
    <button
      type="button"
      aria-label={saved ? 'Remove from saved' : 'Save this place'}
      aria-pressed={saved}
      onClick={(e) => {
        e.preventDefault();
        if (!isStudent) {
          router.push(`/login?next=${encodeURIComponent(pathname)}`);
          return;
        }
        startTransition(async () => {
          try {
            await toggleSave(restaurantId);
          } catch (err) {
            toast(
              err instanceof Error ? err.message : 'Could not save',
              'error',
            );
          }
        });
      }}
      className={cn(
        'save-toggle rounded-chip flex items-center justify-center border text-base backdrop-blur',
        showLabel ? 'h-9 gap-2 px-3' : 'size-9',
        saved
          ? 'border-accent-primary bg-accent-primary text-ink-on-primary'
          : 'border-border-hairline bg-canvas/70 text-paper',
      )}
    >
      <svg viewBox="0 0 24 24" aria-hidden className="size-4 fill-current">
        <path
          d="M12 20.25S3.75 15.6 3.75 9.15A4.4 4.4 0 0 1 12 6.98a4.4 4.4 0 0 1 8.25 2.17C20.25 15.6 12 20.25 12 20.25Z"
          fill={saved ? 'currentColor' : 'none'}
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
      <span className={showLabel ? '' : 'sr-only'}>
        {saved ? 'Saved' : 'Save'}
      </span>
    </button>
  );
}
