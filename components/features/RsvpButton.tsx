'use client';

import { useTransition } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { useToast } from '@/components/ui/Toast';
import { useSaved } from '@/lib/session';

/** P9-4: mark yourself going — one of the two shared social signals. Going state
 *  lives in the shared SavedProvider so it stays consistent across the events
 *  list, event detail, and Saved. */
export function RsvpButton({
  eventId,
  friendsGoing,
  onInterestedChange,
}: {
  eventId: string;
  friendsGoing?: string[];
  onInterestedChange?: (interested: boolean) => void;
}) {
  const { isStudent, isGoing, toggleGoing } = useSaved();
  const going = isGoing(eventId);
  const [pending, startTransition] = useTransition();
  const router = useRouter();
  const pathname = usePathname();
  const toast = useToast();

  return (
    <div className="flex items-center gap-3">
      <Button
        size="sm"
        variant={going ? 'primary' : 'outline'}
        aria-pressed={going}
        disabled={pending}
        onClick={() => {
          if (!isStudent) {
            router.push(`/login?next=${encodeURIComponent(pathname)}`);
            return;
          }
          const next = !going;
          onInterestedChange?.(next);
          startTransition(async () => {
            try {
              await toggleGoing(eventId);
              if (next) {
                toast(
                  "You're in! We'll remind you before the event.",
                  'positive',
                );
              }
            } catch (err) {
              onInterestedChange?.(!next);
              toast(
                err instanceof Error ? err.message : 'Could not RSVP',
                'error',
              );
            }
          });
        }}
      >
        {going ? (
          <>
            Interested <CheckIcon />
          </>
        ) : (
          'Interested'
        )}
      </Button>

      {friendsGoing && friendsGoing.length > 0 ? (
        <span className="text-text-muted text-[12px]">
          {friendsGoing.length === 1
            ? `${friendsGoing[0]} is going`
            : `${friendsGoing[0]} + ${friendsGoing.length - 1} more going`}
        </span>
      ) : null}
    </div>
  );
}

function CheckIcon() {
  return (
    <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true">
      <path
        d="m5 12 4.25 4.25L19 6.5"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
