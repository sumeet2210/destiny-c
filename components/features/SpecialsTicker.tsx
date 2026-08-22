'use client';

import { useRouter } from 'next/navigation';
import { type CSSProperties, useEffect, useRef, useState } from 'react';
import { formatDistance, haversineKm } from '@/lib/domain/distance';

type TickerOffer = {
  id: string;
  restaurant_id: string;
  restaurantName: string;
  restaurantAddress: string;
  restaurantLat: number | null;
  restaurantLng: number | null;
  title: string;
  discount_text: string | null;
  expires_at: string;
  image: string;
};

type TickerEvent = {
  id: string;
  restaurant_id: string;
  restaurantName: string;
  restaurantAddress: string;
  restaurantLat: number | null;
  restaurantLng: number | null;
  title: string;
  event_type: string;
  starts_at: string;
  image: string;
};

type CardKind = 'offer' | 'event';

type TickerCard = {
  key: string;
  restaurantId: string;
  restaurantName: string;
  restaurantAddress: string;
  restaurantLat: number | null;
  restaurantLng: number | null;
  title: string;
  detail: string;
  image: string;
  kind: CardKind;
  detailsHref: string;
};

type PointerGesture = {
  pointerId: number;
  startX: number;
  startY: number;
  startLeft: number;
};

const DRAG_THRESHOLD_PX = 10;
const FLIP_AUTO_RESET_MS = 5000;
const NITW_CAMPUS = { lat: 17.9833, lng: 79.5308 };

/**
 * Today's specials rail. Its duplicate cycle keeps the existing seamless loop;
 * cards use a two-face flip for quick actions while drag gestures continue to
 * move the rail normally.
 */
export function SpecialsTicker({
  offers,
  events = [],
}: {
  offers: TickerOffer[];
  events?: TickerEvent[];
}) {
  const router = useRouter();
  const railRef = useRef<HTMLDivElement>(null);
  const duplicateCycleRef = useRef<HTMLDivElement>(null);
  const loopAtRef = useRef(0);
  const draggedRef = useRef(false);
  const pointerGestureRef = useRef<PointerGesture | null>(null);
  const flipAutoResetAtRef = useRef(0);
  const [dragging, setDragging] = useState(false);
  const [hovered, setHovered] = useState(false);
  const [focused, setFocused] = useState(false);
  const [inView, setInView] = useState(true);
  const [reduceMotion, setReduceMotion] = useState(false);
  const [flippedCard, setFlippedCard] = useState<string | null>(null);
  const [badgeTick, setBadgeTick] = useState(0);

  useEffect(() => {
    const query = window.matchMedia('(prefers-reduced-motion: reduce)');
    const updatePreference = () => setReduceMotion(query.matches);
    updatePreference();
    query.addEventListener('change', updatePreference);
    return () => query.removeEventListener('change', updatePreference);
  }, []);

  useEffect(() => {
    const timer = window.setInterval(
      () => setBadgeTick((current) => current + 1),
      4800,
    );
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    const rail = railRef.current;
    if (!rail) return;
    const observer = new IntersectionObserver(
      ([entry]) => setInView(entry.isIntersecting),
      { threshold: 0.05 },
    );
    observer.observe(rail);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const rail = railRef.current;
    const duplicateCycle = duplicateCycleRef.current;
    if (!rail || !duplicateCycle) return;

    const measureLoop = () => {
      loopAtRef.current = duplicateCycle.offsetLeft;
    };
    const observer = new ResizeObserver(measureLoop);
    observer.observe(rail);
    observer.observe(duplicateCycle);
    measureLoop();
    return () => observer.disconnect();
  }, [offers.length, events.length]);

  useEffect(() => {
    if (!flippedCard) return;
    const resetFlippedCard = (event: PointerEvent) => {
      const target = event.target;
      if (
        !(target instanceof Element) ||
        !target.closest('[data-specials-ticker]')
      ) {
        setFlippedCard(null);
      }
    };
    document.addEventListener('pointerdown', resetFlippedCard);
    return () => document.removeEventListener('pointerdown', resetFlippedCard);
  }, [flippedCard]);

  useEffect(() => {
    if (
      offers.length + events.length < 2 ||
      reduceMotion ||
      hovered ||
      focused ||
      dragging ||
      !inView
    ) {
      return;
    }

    let frame = 0;
    let previousTime = performance.now();
    const pixelsPerSecond = 22;

    const advance = (time: number) => {
      const rail = railRef.current;
      if (!rail) return;

      if (!document.hidden) {
        if (flippedCard) {
          if (time >= flipAutoResetAtRef.current) {
            setFlippedCard(null);
          }
          previousTime = time;
          frame = requestAnimationFrame(advance);
          return;
        }

        const elapsed = Math.min(time - previousTime, 64);
        rail.scrollLeft += (elapsed / 1000) * pixelsPerSecond;

        const loopAt = loopAtRef.current;
        if (loopAt > 0 && rail.scrollLeft >= loopAt) {
          rail.scrollLeft -= loopAt;
        }
      }

      previousTime = time;
      frame = requestAnimationFrame(advance);
    };

    frame = requestAnimationFrame(advance);
    return () => cancelAnimationFrame(frame);
  }, [
    dragging,
    focused,
    hovered,
    inView,
    offers.length,
    events.length,
    reduceMotion,
    flippedCard,
  ]);

  const toggleCard = (card: TickerCard) => {
    if (draggedRef.current) return;
    setFlippedCard((current) => {
      const next = current === card.key ? null : card.key;
      flipAutoResetAtRef.current = next
        ? performance.now() + FLIP_AUTO_RESET_MS
        : 0;
      return next;
    });
  };

  const openBooking = (card: TickerCard) => {
    router.push(`/restaurant/${card.restaurantId}/book`);
  };

  const openDetail = (card: TickerCard) => {
    router.push(card.detailsHref);
  };

  if (offers.length === 0 && events.length === 0) {
    return (
      <div className="rounded-card border-border-hairline bg-surface-muted text-text-muted border p-4 text-sm">
        No live offers or upcoming events right now — check back soon.
      </div>
    );
  }

  const sharedTileProps = {
    badgeTick,
    flippedCard,
    onFlip: toggleCard,
    onOpenBooking: openBooking,
    onOpenDetail: openDetail,
  };

  return (
    <div
      ref={railRef}
      data-specials-ticker
      role="list"
      aria-label="Current offers and upcoming events"
      onPointerDown={(event) => {
        if (
          !event.isPrimary ||
          (event.pointerType === 'mouse' && event.button !== 0)
        ) {
          return;
        }
        const target = event.target;
        if (
          target instanceof Element &&
          target.closest('.specials-back-actions, .specials-flip-close')
        ) {
          return;
        }

        const rail = railRef.current!;
        draggedRef.current = false;
        pointerGestureRef.current = {
          pointerId: event.pointerId,
          startX: event.clientX,
          startY: event.clientY,
          startLeft: rail.scrollLeft,
        };
        setDragging(true);
      }}
      onPointerMove={(event) => {
        const gesture = pointerGestureRef.current;
        if (!gesture || gesture.pointerId !== event.pointerId) return;

        const deltaX = event.clientX - gesture.startX;
        const deltaY = event.clientY - gesture.startY;
        if (!draggedRef.current) {
          if (Math.abs(deltaY) > Math.abs(deltaX)) return;
          if (Math.abs(deltaX) < DRAG_THRESHOLD_PX) return;
          draggedRef.current = true;
          setFlippedCard(null);
          event.currentTarget.setPointerCapture(event.pointerId);
        }
        event.currentTarget.scrollLeft = gesture.startLeft - deltaX;
      }}
      onPointerUp={(event) => {
        if (event.currentTarget.hasPointerCapture(event.pointerId)) {
          event.currentTarget.releasePointerCapture(event.pointerId);
        }
        pointerGestureRef.current = null;
        setDragging(false);

        window.setTimeout(() => {
          draggedRef.current = false;
        }, 0);
      }}
      onPointerCancel={(event) => {
        if (event.currentTarget.hasPointerCapture(event.pointerId)) {
          event.currentTarget.releasePointerCapture(event.pointerId);
        }
        pointerGestureRef.current = null;
        setDragging(false);
        draggedRef.current = false;
      }}
      onPointerLeave={(event) => {
        const gesture = pointerGestureRef.current;
        if (
          event.pointerType !== 'mouse' ||
          !gesture ||
          gesture.pointerId !== event.pointerId ||
          draggedRef.current
        ) {
          return;
        }
        pointerGestureRef.current = null;
        setDragging(false);
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onFocusCapture={() => setFocused(true)}
      onBlurCapture={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget))
          setFocused(false);
      }}
      onClickCapture={(event) => {
        if (!draggedRef.current) return;
        event.preventDefault();
        draggedRef.current = false;
      }}
      className="specials-ticker no-scrollbar rounded-card border-border-hairline bg-surface-muted cursor-grab touch-pan-y overflow-x-auto border p-3 select-none active:cursor-grabbing"
    >
      <div className="specials-track flex w-max gap-3">
        <div className="specials-cycle flex gap-3">
          {offers.map((offer) => (
            <OfferTile key={offer.id} offer={offer} {...sharedTileProps} />
          ))}
          {events.map((event) => (
            <EventTile key={event.id} event={event} {...sharedTileProps} />
          ))}
        </div>

        {offers.length + events.length > 1 && (
          <div
            ref={duplicateCycleRef}
            aria-hidden="true"
            className="specials-cycle flex gap-3"
          >
            {offers.map((offer) => (
              <OfferTile
                key={`duplicate-${offer.id}`}
                offer={offer}
                duplicate
                {...sharedTileProps}
              />
            ))}
            {events.map((event) => (
              <EventTile
                key={`duplicate-event-${event.id}`}
                event={event}
                duplicate
                {...sharedTileProps}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

type SharedTileProps = {
  badgeTick: number;
  duplicate?: boolean;
  flippedCard: string | null;
  onFlip: (card: TickerCard) => void;
  onOpenBooking: (card: TickerCard) => void;
  onOpenDetail: (card: TickerCard) => void;
};

function EventTile({
  event,
  duplicate = false,
  ...shared
}: { event: TickerEvent } & SharedTileProps) {
  const when = new Date(event.starts_at).toLocaleDateString('en-IN', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    hour: 'numeric',
    minute: '2-digit',
    timeZone: 'Asia/Kolkata',
  });
  const key = `${duplicate ? 'duplicate-' : ''}event-${event.id}`;
  return (
    <TickerTile
      card={{
        key,
        restaurantId: event.restaurant_id,
        restaurantName: event.restaurantName,
        restaurantAddress: event.restaurantAddress,
        restaurantLat: event.restaurantLat,
        restaurantLng: event.restaurantLng,
        title: event.title,
        detail: when,
        image: event.image,
        kind: 'event',
        detailsHref: `/restaurant/${event.restaurant_id}?from=homepage_feed`,
      }}
      duplicate={duplicate}
      {...shared}
    />
  );
}

function OfferTile({
  offer,
  duplicate = false,
  ...shared
}: { offer: TickerOffer } & SharedTileProps) {
  const key = `${duplicate ? 'duplicate-' : ''}offer-${offer.id}`;
  return (
    <TickerTile
      card={{
        key,
        restaurantId: offer.restaurant_id,
        restaurantName: offer.restaurantName,
        restaurantAddress: offer.restaurantAddress,
        restaurantLat: offer.restaurantLat,
        restaurantLng: offer.restaurantLng,
        title: offer.title,
        detail: offer.discount_text ?? 'Limited-time special',
        image: offer.image,
        kind: 'offer',
        detailsHref: `/restaurant/${offer.restaurant_id}?from=homepage_feed`,
      }}
      duplicate={duplicate}
      {...shared}
    />
  );
}

function TickerTile({
  card,
  badgeTick,
  duplicate = false,
  flippedCard,
  onFlip,
  onOpenBooking,
  onOpenDetail,
}: { card: TickerCard } & SharedTileProps) {
  const contentKey = card.key.replace(/^duplicate-/, '');
  const heat = mockHeat(contentKey);
  const isFlipped = flippedCard === card.key;
  const distance =
    isFlipped && card.restaurantLat !== null && card.restaurantLng !== null
      ? formatDistance(
          haversineKm(
            NITW_CAMPUS.lat,
            NITW_CAMPUS.lng,
            card.restaurantLat,
            card.restaurantLng,
          ),
        )
      : null;
  const className = [
    'specials-card',
    `specials-${card.kind}-card`,
    isFlipped ? 'is-flipped' : '',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <article
      role={duplicate ? undefined : 'listitem'}
      aria-hidden={duplicate || undefined}
      data-ticker-card={card.key}
      data-restaurant-name={card.restaurantName}
      className={className}
    >
      <div className="specials-card-flipper">
        <button
          type="button"
          tabIndex={duplicate || isFlipped ? -1 : undefined}
          aria-hidden={isFlipped || undefined}
          aria-expanded={isFlipped}
          aria-label={`${card.title} at ${card.restaurantName}. Show quick actions.`}
          onClick={() => onFlip(card)}
          className="specials-card-face specials-card-front"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={card.image} alt="" loading="lazy" draggable={false} />
          <span className="specials-card-shade" aria-hidden />
          <span className="specials-kind">
            {rotatingBadge(card.kind, contentKey, badgeTick)}
          </span>
          {heat > 1 && (
            <span
              className="specials-heat"
              aria-label="Popular right now"
              data-heat={heat}
              style={
                {
                  '--heat-scale': 0.82 + heat * 0.12,
                  '--heat-speed': `${1.75 - heat * 0.22}s`,
                } as CSSProperties
              }
            >
              <FlameIcon />
            </span>
          )}
          <span className="specials-card-copy">
            <span className="specials-place">{card.restaurantName}</span>
            <strong>{card.title}</strong>
            <span className="specials-detail">{card.detail}</span>
          </span>
        </button>

        <div
          className="specials-card-face specials-card-back"
          aria-hidden={!isFlipped || duplicate || undefined}
          onClick={() => onFlip(card)}
        >
          <button
            type="button"
            className="specials-flip-close"
            tabIndex={duplicate || !isFlipped ? -1 : undefined}
            aria-label="Show card front"
            onClick={(event) => {
              event.stopPropagation();
              onFlip(card);
            }}
          >
            ×
          </button>
          <div className="specials-back-copy">
            <span>Quick pick</span>
            <strong>{card.restaurantName}</strong>
          </div>
          {isFlipped ? (
            <>
              <div className="specials-back-location">
                <span className="specials-location-icon" aria-hidden>
                  <LocationPinIcon />
                </span>
                <span className="specials-location-copy">
                  <strong>{card.restaurantAddress}</strong>
                  <small>
                    {distance ? 'From NITW campus' : 'Around NIT Warangal'}
                  </small>
                </span>
                {distance ? <b>{distance}</b> : null}
              </div>
            </>
          ) : null}
          <div className="specials-back-actions" aria-label="Quick actions">
            <button
              type="button"
              tabIndex={duplicate || !isFlipped ? -1 : undefined}
              onClick={(event) => {
                event.stopPropagation();
                onOpenBooking(card);
              }}
            >
              <CalendarIcon />
              <span>Reserve</span>
            </button>
            <button
              type="button"
              tabIndex={duplicate || !isFlipped ? -1 : undefined}
              onClick={(event) => {
                event.stopPropagation();
                onOpenDetail(card);
              }}
            >
              <ViewIcon />
              <span>View</span>
            </button>
          </div>
        </div>
      </div>
    </article>
  );
}

function rotatingBadge(kind: CardKind, key: string, tick: number) {
  const offerCopy = ['Offer', 'Ending soon', "Don't sleep on this"];
  const eventCopy = ['Live event', 'Going down rn', "Don't sleep on this"];
  const choices = kind === 'offer' ? offerCopy : eventCopy;
  return choices[(mockHash(key) + tick) % choices.length];
}

function mockHeat(key: string) {
  return (mockHash(key) % 3) + 1;
}

function mockHash(value: string) {
  let hash = 0;
  for (let index = 0; index < value.length; index++) {
    hash = (hash * 31 + value.charCodeAt(index)) >>> 0;
  }
  return hash;
}

function FlameIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden>
      <path d="M13.4 2.8c.5 3.4-1.5 4.7-3 6.3-1.4 1.4-2.5 2.8-2.5 5.1 0 1.2.4 2.3 1.2 3.1-.1-2.2 1-3.6 2.6-4.9.1 2.1 1.4 3.1 2.2 4.2.6.8.9 1.7.7 2.8 1.8-1 3-2.9 3-5.2 0-3.9-2.2-7.4-4.2-10.4Z" />
      <path
        className="specials-flame-core"
        d="M12.1 14.2c.2 1.1-.4 1.8-1 2.5-.5.6-.8 1.1-.8 1.9 0 1.1.8 2 1.9 2s1.9-.9 1.9-2c0-1.5-1-2.9-2-4.4Z"
      />
    </svg>
  );
}

function ViewIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden>
      <path d="M3 12s3.2-6 9-6 9 6 9 6-3.2 6-9 6-9-6-9-6Z" />
      <circle cx="12" cy="12" r="2.5" />
    </svg>
  );
}

function LocationPinIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden>
      <path d="M20 10c0 5-8 11-8 11S4 15 4 10a8 8 0 1 1 16 0Z" />
      <circle cx="12" cy="10" r="2.5" />
    </svg>
  );
}

function CalendarIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden>
      <path d="M6 3v3M18 3v3M4 9h16M5 5h14a1 1 0 0 1 1 1v14H4V6a1 1 0 0 1 1-1Z" />
    </svg>
  );
}
