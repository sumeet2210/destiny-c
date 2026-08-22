'use client';

import Link from 'next/link';
import { useState } from 'react';
import { RsvpButton } from '@/components/features/RsvpButton';
import styles from './event-detail.module.css';

export function EventInterestActions({
  eventId,
  initialCount,
  initialGoing,
  loggedIn,
  friendsGoing,
  bookingHref,
  ticketUrl,
}: {
  eventId: string;
  initialCount: number;
  initialGoing: boolean;
  loggedIn: boolean;
  friendsGoing: string[];
  bookingHref: string;
  ticketUrl: string | null;
}) {
  const [interestCount, setInterestCount] = useState(initialCount);

  return (
    <>
      <p className={styles.interestCount} aria-live="polite">
        <strong>{interestCount}</strong> students are interested
      </p>

      <div className={styles.actions}>
        <RsvpButton
          eventId={eventId}
          initialGoing={initialGoing}
          loggedIn={loggedIn}
          friendsGoing={friendsGoing}
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
