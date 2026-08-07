'use client';

import { useState, useTransition } from 'react';
import { useToast } from '@/components/ui/Toast';
import { toggleSaved } from '@/lib/social/actions';
import { cn } from '@/lib/cn';

/** P9-1: save/unsave. Saved is private by default (PRD §5.9). */
export function SaveToggle({
  restaurantId,
  initialSaved,
}: {
  restaurantId: string;
  initialSaved: boolean;
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
        'rounded-chip flex size-9 items-center justify-center border text-base backdrop-blur',
        saved
          ? 'border-accent-primary bg-accent-primary text-ink-on-primary'
          : 'border-border-hairline bg-canvas/70 text-paper',
      )}
    >
      {saved ? '🔖' : '🔖'}
      <span className="sr-only">{saved ? 'Saved' : 'Save'}</span>
    </button>
  );
}
