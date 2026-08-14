'use client';

import { useRef, useState } from 'react';
import { cn } from '@/lib/cn';

/** Swipeable photo carousel with dots and a presentation-level empty state. */
export function PhotoCarousel({
  photos,
  alt,
  className,
  aspect = 'aspect-[8/5]',
  emptyFallback,
  showControls = false,
}: {
  photos: string[];
  alt: string;
  className?: string;
  aspect?: string;
  emptyFallback?: React.ReactNode;
  showControls?: boolean;
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
        {emptyFallback ?? <DefaultPhotoIcon />}
      </div>
    );
  }

  const goTo = (nextIndex: number) => {
    const rail = railRef.current;
    if (!rail) return;
    const safeIndex = Math.max(0, Math.min(photos.length - 1, nextIndex));
    rail.scrollTo({
      left: safeIndex * rail.clientWidth,
      behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches
        ? 'auto'
        : 'smooth',
    });
    setIndex(safeIndex);
  };

  return (
    <div className={cn('relative', className)}>
      <div
        ref={railRef}
        onScroll={(event) => {
          const element = event.currentTarget;
          setIndex(Math.round(element.scrollLeft / element.clientWidth));
        }}
        onKeyDown={(event) => {
          if (event.key === 'ArrowLeft') {
            event.preventDefault();
            goTo(index - 1);
          }
          if (event.key === 'ArrowRight') {
            event.preventDefault();
            goTo(index + 1);
          }
        }}
        role={photos.length > 1 ? 'region' : undefined}
        aria-label={photos.length > 1 ? `${alt} photos` : undefined}
        tabIndex={photos.length > 1 ? 0 : undefined}
        className={cn(
          'no-scrollbar flex snap-x snap-mandatory overflow-x-auto',
          aspect,
        )}
      >
        {photos.map((src, photoIndex) => (
          /* eslint-disable-next-line @next/next/no-img-element -- seed art is
             local SVG; storage photos are pre-resized on upload (P5-5). */
          <img
            key={src + photoIndex}
            src={src}
            alt={photoIndex === 0 ? alt : ''}
            loading={photoIndex === 0 ? 'eager' : 'lazy'}
            className="size-full shrink-0 snap-center object-cover"
          />
        ))}
      </div>

      {showControls && photos.length > 1 ? (
        <>
          <button
            type="button"
            aria-label="Previous photo"
            disabled={index === 0}
            onClick={() => goTo(index - 1)}
            className="photo-carousel-control absolute top-1/2 left-2 z-10 grid size-11 -translate-y-1/2 place-items-center rounded-full border border-white/25 bg-black/70 text-white disabled:opacity-35"
          >
            <CarouselArrow direction="previous" />
          </button>
          <button
            type="button"
            aria-label="Next photo"
            disabled={index === photos.length - 1}
            onClick={() => goTo(index + 1)}
            className="photo-carousel-control absolute top-1/2 right-2 z-10 grid size-11 -translate-y-1/2 place-items-center rounded-full border border-white/25 bg-black/70 text-white disabled:opacity-35"
          >
            <CarouselArrow direction="next" />
          </button>
        </>
      ) : null}

      {photos.length > 1 ? (
        <div className="absolute inset-x-0 bottom-2 flex justify-center gap-1.5">
          {photos.map((_, photoIndex) => (
            <span
              key={photoIndex}
              aria-hidden
              className={cn(
                'size-1.5 rounded-full transition-colors',
                photoIndex === index ? 'bg-paper' : 'bg-paper/40',
              )}
            />
          ))}
        </div>
      ) : null}
    </div>
  );
}

function CarouselArrow({ direction }: { direction: 'previous' | 'next' }) {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
      <path
        d={direction === 'previous' ? 'm15 6-6 6 6 6' : 'm9 6 6 6-6 6'}
        fill="none"
        stroke="currentColor"
        strokeWidth="1.9"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function DefaultPhotoIcon() {
  return (
    <svg
      viewBox="0 0 48 48"
      width="44"
      height="44"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M8 10h32v28H8zM8 32l9-9 7 7 5-5 11 11M31 19h.01"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
