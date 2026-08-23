'use client';

import Link from 'next/link';
import { useState } from 'react';
import { RsvpButton } from '@/components/features/RsvpButton';
import { getFriendActivity } from '@/lib/api/social';
import type { FriendActivity } from '@/lib/api/types';
import { useApi } from '@/lib/hooks/useApi';
import { useSaved } from '@/lib/session';
import styles from './event-detail.module.css';

export function EventInterestActions({
  eventId,
  initialCount,
  bookingHref,
  ticketUrl,
}: {
  eventId: string;
  initialCount: number;
  bookingHref: string;
  ticketUrl: string | null;
}) {
  const [interestCount, setInterestCount] = useState(initialCount);

  // "Aarav is going" comes from the signed-in student's friend activity, fetched
  // client-side now that the session lives in the browser rather than the server.
  const { isStudent } = useSaved();
  const { data: activity } = useApi(
    () =>
      isStudent
        ? getFriendActivity()
        : Promise.resolve<FriendActivity | null>(null),
    [isStudent],
  );

  return (
    <>
      <p className={styles.interestCount} aria-live="polite">
        <strong>{interestCount}</strong> students are interested
      </p>

      <div className={styles.actions}>
        <RsvpButton
          eventId={eventId}
          friendsGoing={activity?.goingTo.get(eventId) ?? []}
          onInterestedChange={(interested) =>
            setInterestCount((current) =>
              Math.max(0, current + (interested ? 1 : -1)),
            )
          }
        />
        <Link
          href={ticketUrl ?? bookingHref}
          className={styles.primaryAction}
          target={ticketUrl ? '_blank' : undefined}
          rel={ticketUrl ? 'noreferrer' : undefined}
        >
          {ticketUrl ? 'Get tickets' : 'Book now'}
        </Link>
      </div>
    </>
  );
}
