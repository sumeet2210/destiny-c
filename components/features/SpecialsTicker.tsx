'use client';

import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { OfferBadge } from '@/components/features/OfferBadge';

type TickerOffer = {
  id: string;
  restaurant_id: string;
  restaurantName: string;
  title: string;
  discount_text: string | null;
  expires_at: string;
};

/**
 * Today's specials rail, sorted by soonest expiry upstream (P3-1).
 * The duplicated visual cycle creates a seamless, slow loop while the first
 * cycle remains the only semantic list. Interaction and reduced-motion pause it.
 */
export function SpecialsTicker({ offers }: { offers: TickerOffer[] }) {
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
  }, [offers.length]);

  useEffect(() => {
    if (
      offers.length < 2 ||
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
  }, [drag, focused, hovered, inView, offers.length, reduceMotion]);

  if (offers.length === 0) {
    return (
      <div className="rounded-card border-border-hairline bg-surface-muted text-text-muted border p-4 text-sm">
        No live offers right now — check back around lunch.
      </div>
    );
  }

  return (
    <div
      ref={railRef}
      role="list"
      aria-label="Today's specials"
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
        </div>

        {offers.length > 1 && (
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
          </div>
        )}
      </div>
    </div>
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
      className="specials-card rounded-control border-border-hairline bg-surface-raised flex shrink-0 flex-col gap-1.5 border px-3.5 py-2.5"
    >
      <span className="text-paper max-w-56 truncate text-sm font-medium">
        {offer.title}
      </span>
      <span className="flex items-center gap-2">
        <OfferBadge
          title={offer.title}
          discountText={offer.discount_text}
          expiresAt={offer.expires_at}
        />
      </span>
      <span className="text-text-muted text-[12px]">
        {offer.restaurantName}
      </span>
    </Link>
  );
}
