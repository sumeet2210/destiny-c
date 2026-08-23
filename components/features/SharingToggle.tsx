'use client';

import { useState, useTransition } from 'react';
import { Card } from '@/components/ui/Card';
import { Input, Label } from '@/components/ui/Input';
import { useToast } from '@/components/ui/Toast';
import { updateProfile } from '@/lib/api/auth';
import { cn } from '@/lib/cn';

/**
 * P9-3: the activity sharing toggle, off by default, with plain-language copy
 * about exactly what becomes visible. Bookings are never shared (PRD §5.9).
 */
export function SharingToggle({
  initialValue,
  initialHostel,
}: {
  initialValue: boolean;
  initialHostel: string | null;
}) {
  const [on, setOn] = useState(initialValue);
  const [hostel, setHostel] = useState(initialHostel ?? '');
  const [, startTransition] = useTransition();
  const toast = useToast();

  return (
    <Card className="space-y-4">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-paper text-sm font-medium">
            Share activity with friends
          </p>
          <p className="text-text-muted mt-1 text-[13px]">
            When on, friends you&apos;ve accepted can see two things:
            restaurants you&apos;ve saved, and events you&apos;re going to. Your
            bookings are <span className="text-paper">never</span> visible to
            anyone, with any setting.
          </p>
        </div>
        <button
          type="button"
          role="switch"
          aria-checked={on}
          aria-label="Share activity with friends"
          onClick={() => {
            const next = !on;
            setOn(next);
            startTransition(async () => {
              try {
                await updateProfile({ share_activity: next });
              } catch (err) {
                setOn(!next);
                toast(
                  err instanceof Error ? err.message : 'Could not update',
                  'error',
                );
              }
            });
          }}
          className={cn(
            'rounded-chip relative h-6 w-11 shrink-0 transition-colors',
            on
              ? 'bg-accent-primary'
              : 'bg-surface-raised border-border-hairline border',
          )}
        >
          <span
            className={cn(
              'bg-paper absolute top-0.5 size-5 rounded-full transition-transform',
              on ? 'translate-x-[22px]' : 'translate-x-0.5',
            )}
          />
        </button>
      </div>

      <div>
        <Label htmlFor="hostel">Hostel (shown to friends only)</Label>
        <div className="flex gap-2">
          <Input
            id="hostel"
            value={hostel}
            placeholder="e.g. 1.8k block"
            onChange={(e) => setHostel(e.target.value)}
          />
          <button
            type="button"
            onClick={() =>
              startTransition(async () => {
                try {
                  await updateProfile({ hostel: hostel || null });
                  toast('Saved', 'positive');
                } catch (err) {
                  toast(
                    err instanceof Error ? err.message : 'Could not save',
                    'error',
                  );
                }
              })
            }
            className="rounded-control border-border-hairline text-paper hover:bg-surface-raised border px-3 text-[13px]"
          >
            Save
          </button>
        </div>
      </div>
    </Card>
  );
}
