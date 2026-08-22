'use client';

import { useState, useTransition } from 'react';
import { Button } from '@/components/ui/Button';
import { useToast } from '@/components/ui/Toast';
import { toggleRsvp } from '@/lib/social/actions';

/** P9-4: mark yourself going — one of the two shared social signals. */
export function RsvpButton({
  eventId,
  initialGoing,
  loggedIn,
  friendsGoing,
  onInterestedChange,
}: {
  eventId: string;
  initialGoing: boolean;
  loggedIn: boolean;
  friendsGoing?: string[];
  onInterestedChange?: (interested: boolean) => void;
}) {
  const [going, setGoing] = useState(initialGoing);
  const [pending, startTransition] = useTransition();
  const toast = useToast();

  return (
    <div className="flex items-center gap-3">
      <Button
        size="sm"
        variant={going ? 'primary' : 'outline'}
        aria-pressed={going}
        disabled={pending || !loggedIn}
        onClick={() => {
          const next = !going;
          setGoing(next);
          onInterestedChange?.(next);
          startTransition(async () => {
            const res = await toggleRsvp(eventId);
            if (!res.ok) {
              setGoing(!next);
              onInterestedChange?.(!next);
              toast(res.message ?? 'Could not RSVP', 'error');
              return;
            }
            if (next) {
              toast(
                "You're in! We'll remind you before the event.",
                'positive',
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
