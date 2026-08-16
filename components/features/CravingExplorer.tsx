'use client';

import { useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { CRAVINGS } from '@/config/cravings';
import { Chip } from '@/components/ui/Chip';
import { Button } from '@/components/ui/Button';
import { cn } from '@/lib/cn';
import type { RestaurantSummary } from '@/lib/queries/catalog';

/**
 * The signature interaction (PRD §5.3, design.md §4): a horizontally
 * scrolling craving chip row; tapping a chip reveals a swipeable card stack
 * of matching restaurants. Swipe left to pass, right (or tap) to open.
 * Chip-tap reveal and card swipe are two of the four approved motion moments.
 */
export function CravingExplorer({
  restaurants,
}: {
  restaurants: RestaurantSummary[];
}) {
  const router = useRouter();
  const [craving, setCraving] = useState<string | null>(
    CRAVINGS[0]?.tag ?? null,
  );
  const [cursor, setCursor] = useState(0);
  const [dx, setDx] = useState(0);
  const dragStart = useRef<number | null>(null);
  const [leaving, setLeaving] = useState<'left' | 'right' | null>(null);

  const matches = useMemo(
    () =>
      craving ? restaurants.filter((r) => r.cravingTags.includes(craving)) : [],
    [craving, restaurants],
  );

  const stack = matches.slice(cursor, cursor + 3);
  const source = craving ? `craving:${craving}` : 'homepage_feed';

  const pick = (tag: string) => {
    setCraving((c) => (c === tag ? null : tag));
    setCursor(0);
    setDx(0);
    setLeaving(null);
  };

  const advance = (dir: 'left' | 'right') => {
    const top = stack[0];
    if (!top) return;
    if (dir === 'right') {
      router.push(`/restaurant/${top.id}?from=${encodeURIComponent(source)}`);
      return;
    }
    setLeaving('left');
    setTimeout(() => {
      setLeaving(null);
      setDx(0);
      setCursor((c) => c + 1);
    }, 180);
  };

  return (
    <section aria-label="Craving picker" className="craving-explorer space-y-3">
      <div className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4">
        {CRAVINGS.map((c) => (
          <Chip
            key={c.tag}
            active={craving === c.tag}
            onClick={() => pick(c.tag)}
          >
            {c.label}
          </Chip>
        ))}
      </div>

      {craving && (
        <div className="craving-reveal">
          {matches.length === 0 ? (
            <div className="rounded-card border-border-hairline bg-surface-muted text-text-muted border p-6 text-center text-sm">
              Nothing matching {CRAVINGS.find((c) => c.tag === craving)?.label}{' '}
              is listed yet. Try another craving.
            </div>
          ) : cursor >= matches.length ? (
            <div className="rounded-card border-border-hairline bg-surface-muted text-text-muted border p-6 text-center text-sm">
              That&apos;s everything for this craving.
              <Button
                variant="outline"
                size="sm"
                className="mx-auto mt-3 block"
                onClick={() => setCursor(0)}
              >
                Start over
              </Button>
            </div>
          ) : (
            <div
              className="craving-stack relative h-[420px] select-none"
              aria-live="polite"
            >
              {stack.map((r, i) => {
                const isTop = i === 0;
                const offset = isTop ? dx : 0;
                const rotation = isTop ? dx / 24 : 0;
                return (
                  <div
                    key={r.id}
                    className={cn(
                      'craving-stack-card rounded-card border-border-hairline bg-surface-muted absolute inset-x-0 top-0 mx-auto max-w-sm touch-pan-y border p-4',
                      isTop &&
                        leaving === 'left' &&
                        'transition-transform duration-150',
                      !isTop && 'pointer-events-none',
                    )}
                    style={{
                      zIndex: 10 - i,
                      transform: isTop
                        ? leaving === 'left'
                          ? 'translateX(-120%) rotate(-8deg)'
                          : `translateX(${offset}px) rotate(${rotation}deg)`
                        : `translateY(${i * 10}px) scale(${1 - i * 0.04})`,
                      opacity: i === 2 ? 0.5 : 1,
                    }}
                    onPointerDown={(e) => {
                      if (!isTop) return;
                      dragStart.current = e.clientX;
                      e.currentTarget.setPointerCapture(e.pointerId);
                    }}
                    onPointerMove={(e) => {
                      if (!isTop || dragStart.current === null) return;
                      setDx(e.clientX - dragStart.current);
                    }}
                    onPointerUp={() => {
                      if (!isTop || dragStart.current === null) return;
                      dragStart.current = null;
                      if (dx < -90) advance('left');
                      else if (dx > 90) advance('right');
                      else setDx(0);
                    }}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element -- seed art is local SVG */}
                    <img
                      src={r.photos[0] ?? ''}
                      alt=""
                      draggable={false}
                      className="craving-stack-media rounded-control aspect-[8/5] w-full object-cover"
                    />
                    <div className="craving-stack-copy">
                      <h3 className="font-display text-paper mt-3 text-lg font-bold">
                        {r.name}
                      </h3>
                      <p className="text-text-muted text-[13px]">
                        {r.area}
                        <span aria-hidden> · </span>
                        {r.isOpen ? (
                          <span className="text-accent-secondary">
                            Open now
                          </span>
                        ) : (
                          'Closed'
                        )}
                        {r.price_per_head && (
                          <>
                            <span aria-hidden> · </span>
                            <span className="font-mono">
                              ₹{r.price_per_head}
                            </span>
                            /head
                          </>
                        )}
                      </p>
                      {isTop && (
                        <div className="craving-stack-actions mt-4 flex justify-between gap-3">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => advance('left')}
                          >
                            Pass
                          </Button>
                          <span className="text-text-muted self-center font-mono text-[11px]">
                            {cursor + 1}/{matches.length}
                          </span>
                          <Button size="sm" onClick={() => advance('right')}>
                            Take me there
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </section>
  );
}
