'use client';

import { useRef, useState } from 'react';
import { cn } from '@/lib/cn';

/**
 * Swipeable photo carousel with dots. Scroll-snap does the swiping — one of
 * the four approved motion moments (design.md §5). Images lazy-load.
 */
export function PhotoCarousel({
  photos,
  alt,
  className,
  aspect = 'aspect-[8/5]',
}: {
  photos: string[];
  alt: string;
  className?: string;
  aspect?: string;
}) {
  const [index, setIndex] = useState(0);
  const railRef = useRef<HTMLDivElement>(null);

  if (photos.length === 0) {
    return (
      <div
        className={cn(
          'bg-surface-raised flex items-center justify-center text-4xl',
          aspect,
          className,
        )}
        aria-hidden
      >
        🍽️
      </div>
    );
  }

  return (
    <div className={cn('relative', className)}>
      <div
        ref={railRef}
        onScroll={(e) => {
          const el = e.currentTarget;
          setIndex(Math.round(el.scrollLeft / el.clientWidth));
        }}
        className={cn(
          'no-scrollbar flex snap-x snap-mandatory overflow-x-auto',
          aspect,
        )}
      >
        {photos.map((src, i) => (
          /* eslint-disable-next-line @next/next/no-img-element -- seed art is
             local SVG; storage photos are pre-resized on upload (P5-5). */
          <img
            key={src + i}
            src={src}
            alt={i === 0 ? alt : ''}
            loading={i === 0 ? 'eager' : 'lazy'}
            className="size-full shrink-0 snap-center object-cover"
          />
        ))}
      </div>
      {photos.length > 1 && (
        <div className="absolute inset-x-0 bottom-2 flex justify-center gap-1.5">
          {photos.map((_, i) => (
            <span
              key={i}
              aria-hidden
              className={cn(
                'size-1.5 rounded-full transition-colors',
                i === index ? 'bg-paper' : 'bg-paper/40',
              )}
            />
          ))}
        </div>
      )}
    </div>
  );
}
