'use client';

import Link from 'next/link';
import { useRef, useState } from 'react';
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
 * Drag-to-scroll is one of the four approved motion moments; there is
 * deliberately no auto-scroll (design.md §5).
 */
export function SpecialsTicker({ offers }: { offers: TickerOffer[] }) {
  const railRef = useRef<HTMLDivElement>(null);
  const [drag, setDrag] = useState<{
    startX: number;
    startLeft: number;
  } | null>(null);

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
        setDrag({ startX: e.clientX, startLeft: el.scrollLeft });
      }}
      onPointerMove={(e) => {
        if (!drag) return;
        railRef.current!.scrollLeft =
          drag.startLeft - (e.clientX - drag.startX);
      }}
      onPointerUp={() => setDrag(null)}
      onPointerCancel={() => setDrag(null)}
      className="no-scrollbar rounded-card border-border-hairline bg-surface-muted flex cursor-grab gap-3 overflow-x-auto border p-3 select-none active:cursor-grabbing"
    >
      {offers.map((o) => (
        <Link
          key={o.id}
          role="listitem"
          href={`/restaurant/${o.restaurant_id}?from=homepage_feed`}
          draggable={false}
          className="rounded-control border-border-hairline bg-surface-raised flex shrink-0 flex-col gap-1.5 border px-3.5 py-2.5"
        >
          <span className="text-paper max-w-56 truncate text-sm font-medium">
            {o.title}
          </span>
          <span className="flex items-center gap-2">
            <OfferBadge
              title={o.title}
              discountText={o.discount_text}
              expiresAt={o.expires_at}
            />
          </span>
          <span className="text-text-muted text-[12px]">
            {o.restaurantName}
          </span>
        </Link>
      ))}
    </div>
  );
}
