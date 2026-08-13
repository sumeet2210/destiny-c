'use client';

import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
type TickerOffer = {
  id: string;
  restaurant_id: string;
  restaurantName: string;
  title: string;
  discount_text: string | null;
  expires_at: string;
  image: string;
};

type TickerEvent = {
  id: string;
  restaurant_id: string;
  restaurantName: string;
  title: string;
  event_type: string;
  starts_at: string;
  image: string;
};

/**
 * Today's specials rail, sorted by soonest expiry upstream (P3-1).
 * The duplicated visual cycle creates a seamless, slow loop while the first
 * cycle remains the only semantic list. Interaction and reduced-motion pause it.
 */
export function SpecialsTicker({
  offers,
  events = [],
}: {
  offers: TickerOffer[];
  events?: TickerEvent[];
}) {
  const railRef = useRef<HTMLDivElement>(null);
  const duplicateCycleRef = useRef<HTMLDivElement>(null);
  const loopAtRef = useRef(0);
  const draggedRef = useRef(false);
  const [drag, setDrag] = useState<{
    startX: number;
    startLeft: number;
  } | null>(null);
  const [hovered, setHovered] = useState(false);
  const [focused, setFocused] = useState(false);
  const [inView, setInView] = useState(true);
  const [reduceMotion, setReduceMotion] = useState(false);

  useEffect(() => {
    const query = window.matchMedia('(prefers-reduced-motion: reduce)');
    const updatePreference = () => setReduceMotion(query.matches);
    updatePreference();
    query.addEventListener('change', updatePreference);
    return () => query.removeEventListener('change', updatePreference);
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
    if (
      offers.length + events.length < 2 ||
      reduceMotion ||
      hovered ||
      focused ||
      drag ||
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
    drag,
    focused,
    hovered,
    inView,
    offers.length,
    events.length,
    reduceMotion,
  ]);

  if (offers.length === 0 && events.length === 0) {
    return (
      <div className="rounded-card border-border-hairline bg-surface-muted text-text-muted border p-4 text-sm">
        No live offers or upcoming events right now — check back soon.
      </div>
    );
  }

  return (
    <div
      ref={railRef}
      role="list"
      aria-label="Current offers and upcoming events"
      onPointerDown={(e) => {
        const el = railRef.current!;
        el.setPointerCapture(e.pointerId);
        draggedRef.current = false;
        setDrag({ startX: e.clientX, startLeft: el.scrollLeft });
      }}
      onPointerMove={(e) => {
        if (!drag) return;
        if (Math.abs(e.clientX - drag.startX) > 5) draggedRef.current = true;
        railRef.current!.scrollLeft =
          drag.startLeft - (e.clientX - drag.startX);
      }}
      onPointerUp={() => {
        setDrag(null);
        window.setTimeout(() => {
          draggedRef.current = false;
        }, 0);
      }}
      onPointerCancel={() => {
        setDrag(null);
        draggedRef.current = false;
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onFocusCapture={() => setFocused(true)}
      onBlurCapture={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget)) setFocused(false);
      }}
      onClickCapture={(e) => {
        if (!draggedRef.current) return;
        e.preventDefault();
        draggedRef.current = false;
      }}
      className="specials-ticker no-scrollbar rounded-card border-border-hairline bg-surface-muted cursor-grab overflow-x-auto border p-3 select-none active:cursor-grabbing"
    >
      <div className="specials-track flex w-max gap-3">
        <div className="specials-cycle flex gap-3">
          {offers.map((offer) => (
            <OfferTile key={offer.id} offer={offer} />
          ))}
          {events.map((event) => (
            <EventTile key={event.id} event={event} />
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
              />
            ))}
            {events.map((event) => (
              <EventTile
                key={`duplicate-event-${event.id}`}
                event={event}
                duplicate
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function EventTile({
  event,
  duplicate = false,
}: {
  event: TickerEvent;
  duplicate?: boolean;
}) {
  const when = new Date(event.starts_at).toLocaleDateString('en-IN', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    hour: 'numeric',
    minute: '2-digit',
    timeZone: 'Asia/Kolkata',
  });

  return (
    <Link
      role="listitem"
      href="/events"
      draggable={false}
      tabIndex={duplicate ? -1 : undefined}
      className="specials-card specials-event-card"
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={event.image} alt="" loading="lazy" draggable={false} />
      <span className="specials-card-shade" aria-hidden />
      <span className="specials-kind">
        Event · {event.event_type.replaceAll('_', ' ')}
      </span>
      <span className="specials-card-copy">
        <span className="specials-place">{event.restaurantName}</span>
        <strong>{event.title}</strong>
        <span className="specials-detail">{when}</span>
      </span>
      <CardArrow />
    </Link>
  );
}

function OfferTile({
  offer,
  duplicate = false,
}: {
  offer: TickerOffer;
  duplicate?: boolean;
}) {
  return (
    <Link
      role="listitem"
      href={`/restaurant/${offer.restaurant_id}?from=homepage_feed`}
      draggable={false}
      tabIndex={duplicate ? -1 : undefined}
      className="specials-card specials-offer-card"
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={offer.image} alt="" loading="lazy" draggable={false} />
      <span className="specials-card-shade" aria-hidden />
      <span className="specials-kind">Offer</span>
      <span className="specials-card-copy">
        <span className="specials-place">{offer.restaurantName}</span>
        <strong>{offer.title}</strong>
        <span className="specials-detail">
          {offer.discount_text ?? 'Limited-time special'}
        </span>
      </span>
      <CardArrow />
    </Link>
  );
}

function CardArrow() {
  return (
    <span className="specials-card-arrow" aria-hidden>
      <svg viewBox="0 0 24 24">
        <path d="M5 12h14M13 6l6 6-6 6" />
      </svg>
    </span>
  );
}
