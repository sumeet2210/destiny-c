'use client';

import { useEffect, useState } from 'react';
import { cn } from '@/lib/cn';

/**
 * Offer badge. Turmeric outline at rest; under an hour from expiry the
 * countdown flips to accent-urgent-text with a clock icon. This — plus
 * "closing soon" — is the entire permitted high-signal surface (design.md §1).
 * Deal-tag radius keeps the prototype's clipped corner: 6px 6px 6px 0.
 */
export function OfferBadge({
  title,
  discountText,
  expiresAt,
  className,
}: {
  title: string;
  discountText?: string | null;
  expiresAt: string;
  className?: string;
}) {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 30_000);
    return () => clearInterval(t);
  }, []);

  const msLeft = new Date(expiresAt).getTime() - now;
  if (msLeft <= 0) return null;

  const minsLeft = Math.floor(msLeft / 60_000);
  const urgent = minsLeft < 60;

  const countdown =
    minsLeft < 60
      ? `${minsLeft}m left`
      : minsLeft < 24 * 60
        ? `${Math.floor(minsLeft / 60)}h left`
        : 'today';

  return (
    <span
      className={cn(
        'border-accent-primary text-accent-primary inline-flex items-center gap-2 border px-2.5 py-1 text-[12px] font-medium',
        className,
      )}
      style={{ borderRadius: '6px 6px 6px 0' }}
    >
      <span className="truncate">{discountText || title}</span>
      <span
        className={cn(
          'shrink-0 font-mono text-[11px]',
          urgent ? 'text-accent-urgent-text' : 'text-text-muted',
        )}
      >
        {urgent && (
          <svg viewBox="0 0 24 24" aria-hidden className="inline size-3.5">
            <circle
              cx="12"
              cy="13"
              r="8"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
            />
            <path
              d="M9 2h6M12 5v3M12 13l3-2"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        )}
        {countdown}
      </span>
    </span>
  );
}
