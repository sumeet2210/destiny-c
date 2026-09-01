'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import { RsvpButton } from '@/components/features/RsvpButton';
import { getEventTypeLabel } from '@/config/events';
import styles from './events.module.css';

const IST = 'Asia/Kolkata';

export type SceneEvent = {
  id: string;
  title: string;
  description: string | null;
  eventType: string;
  customEventType: string | null;
  startsAt: string;
  endsAt: string | null;
  restaurantId: string;
  restaurantName: string;
  area: string;
  artwork: string;
  entryFee: number | null;
  location: string | null;
  ticketUrl: string | null;
  interestCount: number;
  initiallyInterested: boolean;
  friendsInterested: string[];
};

function dayKey(value: Date | string) {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: IST,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date(value));
}

function formatDay(value: Date, index: number) {
  if (index === 0) return { top: 'Today', bottom: '' };
  if (index === 1) return { top: 'Tomorrow', bottom: '' };
  return {
    top: value.toLocaleDateString('en-IN', { weekday: 'short', timeZone: IST }),
    bottom: value.toLocaleDateString('en-IN', {
      day: '2-digit',
      timeZone: IST,
    }),
  };
}

function dateRange(startIso: string) {
  const start = new Date(startIso);
  return Array.from({ length: 15 }, (_, index) => {
    const date = new Date(start);
    date.setUTCDate(date.getUTCDate() + index);
    return { date, key: dayKey(date), ...formatDay(date, index) };
  });
}

function eventTime(startsAt: string) {
  return new Date(startsAt).toLocaleTimeString('en-IN', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
    timeZone: IST,
  });
}

function eventDate(startsAt: string) {
  return new Date(startsAt).toLocaleDateString('en-IN', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    timeZone: IST,
  });
}

function feeLabel(fee: number | null) {
  if (fee === 0) return 'Free entry';
  if (fee === null) return 'Entry details at venue';
  return `₹${fee} onwards`;
}

export function EventsExplorer({
  events,
  loggedIn,
  rangeStart,
}: {
  events: SceneEvent[];
  loggedIn: boolean;
  rangeStart: string;
}) {
  const dates = useMemo(() => dateRange(rangeStart), [rangeStart]);
  const [selectedDay, setSelectedDay] = useState('all');

  const filtered = useMemo(() => {
    return events.filter((event) => {
      const key = dayKey(event.startsAt);
      if (selectedDay !== 'all' && key !== selectedDay) return false;
      return true;
    });
  }, [events, selectedDay]);

  return (
    <>
      <section
        className={styles.discoveryBar}
        aria-label="Browse events by date"
      >
        <div className={styles.dateRail}>
          <button
            type="button"
            className={selectedDay === 'all' ? styles.dateActive : undefined}
            aria-pressed={selectedDay === 'all'}
            onClick={() => setSelectedDay('all')}
          >
            <span>All</span>
            <small>15 days</small>
          </button>
          {dates.map((date) => (
            <button
              key={date.key}
              type="button"
              className={
                selectedDay === date.key ? styles.dateActive : undefined
              }
              aria-pressed={selectedDay === date.key}
              onClick={() => setSelectedDay(date.key)}
            >
              <span>{date.top}</span>
              {date.bottom ? <small>{date.bottom}</small> : null}
            </button>
          ))}
        </div>
      </section>

      <section
        className={styles.allEvents}
        id="event-list"
        aria-labelledby="all-events-title"
      >
        <div className={styles.categoryHeader}>
          <div>
            <h2 id="all-events-title">Pick tonight&apos;s energy.</h2>
          </div>
          <div className={styles.headerActions}>
            <p className={styles.resultCount} aria-live="polite">
              <strong>{String(filtered.length).padStart(2, '0')}</strong>
              <span>on the radar</span>
            </p>
          </div>
        </div>

        {filtered.length ? (
          <div className={styles.eventGrid}>
            {filtered.map((event) => (
              <SceneCard key={event.id} event={event} loggedIn={loggedIn} />
            ))}
          </div>
        ) : (
          <div className={styles.noResults}>
            <p>Nothing matches that scene yet.</p>
            <button
              type="button"
              onClick={() => {
                setSelectedDay('all');
              }}
            >
              Show all events
            </button>
          </div>
        )}
      </section>
    </>
  );
}

function SceneCard({
  event,
  loggedIn,
}: {
  event: SceneEvent;
  loggedIn: boolean;
}) {
  const bookingHref = `/restaurant/${event.restaurantId}/book?event=${event.id}`;
  const [interestCount, setInterestCount] = useState(event.interestCount);

  return (
    <article className={styles.sceneCard}>
      <Link href={`/events/${event.id}`} className={styles.posterLink}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={event.artwork} alt="" />
        <span className={styles.cardCategory}>
          {getEventTypeLabel(event.eventType, event.customEventType)}
        </span>
        <span className={styles.cardDate}>{eventDate(event.startsAt)}</span>
      </Link>
      <div className={styles.cardBody}>
        <Link href={`/events/${event.id}`} className={styles.cardTitleLink}>
          <h3>{event.title}</h3>
        </Link>
        <p className={styles.restaurantName}>{event.restaurantName}</p>
        {event.description ? (
          <p className={styles.cardDescription}>{event.description}</p>
        ) : null}
        <dl className={styles.cardMeta}>
          <div>
            <dt>Time</dt>
            <dd>{eventTime(event.startsAt)} onwards</dd>
          </div>
          <div>
            <dt>Entry</dt>
            <dd>{feeLabel(event.entryFee)}</dd>
          </div>
          <div>
            <dt>Where</dt>
            <dd>{event.location ?? event.area}</dd>
          </div>
        </dl>
        <p className={styles.interestLine} aria-live="polite">
          <strong>{interestCount}</strong> students interested
        </p>
        <div className={styles.cardActions}>
          <RsvpButton
            eventId={event.id}
            initialGoing={event.initiallyInterested}
            loggedIn={loggedIn}
            friendsGoing={event.friendsInterested}
            onInterestedChange={(interested) =>
              setInterestCount((current) =>
                Math.max(0, current + (interested ? 1 : -1)),
              )
            }
          />
          <Link
            href={event.ticketUrl ?? bookingHref}
            className={styles.ticketButton}
            target={event.ticketUrl ? '_blank' : undefined}
            rel={event.ticketUrl ? 'noreferrer' : undefined}
          >
            {event.ticketUrl ? 'Get tickets' : 'Book now'}
          </Link>
        </div>
      </div>
    </article>
  );
}
