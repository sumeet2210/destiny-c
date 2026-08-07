'use client';

import { useRouter } from 'next/navigation';
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
}: {
  eventId: string;
  initialGoing: boolean;
  loggedIn: boolean;
  friendsGoing?: string[];
}) {
  const router = useRouter();
  const [going, setGoing] = useState(initialGoing);
  const [pending, startTransition] = useTransition();
  const toast = useToast();

  return (
    <div className="flex items-center gap-3">
      <Button
        size="sm"
        variant={going ? 'primary' : 'outline'}
        disabled={pending}
        onClick={() => {
          if (!loggedIn) {
            router.push('/login?next=/events');
            return;
          }
          const next = !going;
          setGoing(next);
          startTransition(async () => {
            const res = await toggleRsvp(eventId);
            if (!res.ok) {
              setGoing(!next);
              toast(res.message ?? 'Could not RSVP', 'error');
            }
          });
        }}
      >
        {going ? "I'm going ✓" : "I'm going"}
      </Button>
      {friendsGoing && friendsGoing.length > 0 && (
        <span className="text-text-muted text-[12px]">
          {friendsGoing.length === 1
            ? `${friendsGoing[0]} is going`
            : `${friendsGoing[0]} + ${friendsGoing.length - 1} more going`}
        </span>
      )}
    </div>
  );
}
