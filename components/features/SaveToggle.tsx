'use client';

import { useState, useTransition } from 'react';
import { useToast } from '@/components/ui/Toast';
import { toggleSaved } from '@/lib/social/actions';
import { cn } from '@/lib/cn';

/** P9-1: save/unsave. Saved is private by default (PRD §5.9). */
export function SaveToggle({
  restaurantId,
  initialSaved,
  showLabel = false,
}: {
  restaurantId: string;
  initialSaved: boolean;
  showLabel?: boolean;
}) {
  const [saved, setSaved] = useState(initialSaved);
  const [, startTransition] = useTransition();
  const toast = useToast();

  return (
    <button
      type="button"
      aria-label={saved ? 'Remove from saved' : 'Save this place'}
      aria-pressed={saved}
      onClick={(e) => {
        e.preventDefault();
        const next = !saved;
        setSaved(next);
        startTransition(async () => {
          const res = await toggleSaved(restaurantId);
          if (!res.ok) {
            setSaved(!next);
            toast(res.message ?? 'Could not save', 'error');
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
