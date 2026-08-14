'use client';

import { useMemo, useState } from 'react';
import { Chip } from '@/components/ui/Chip';
import { Card } from '@/components/ui/Card';
import { cn } from '@/lib/cn';

export type ReviewItem = {
  id: string;
  rating: number;
  comment: string | null;
  created_at: string;
};

type Sort = 'newest' | 'highest' | 'lowest';

/** Reviews sortable by newest, highest, lowest (PRD §5.8). */
export function ReviewList({
  reviews,
  appearance = 'default',
}: {
  reviews: ReviewItem[];
  appearance?: 'default' | 'destiny';
}) {
  const [sort, setSort] = useState<Sort>('newest');
  const destiny = appearance === 'destiny';

  const sorted = useMemo(() => {
    const copy = [...reviews];
    if (sort === 'newest') {
      copy.sort(
        (a, b) =>
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
      );
    }
    if (sort === 'highest') copy.sort((a, b) => b.rating - a.rating);
    if (sort === 'lowest') copy.sort((a, b) => a.rating - b.rating);
    return copy;
  }, [reviews, sort]);

  if (reviews.length === 0) {
    return (
      <p className="review-empty text-text-muted text-sm">
        No reviews yet. Reviews come from students who actually booked and
        showed up — so the first one has to earn it.
      </p>
    );
  }

  return (
    <div className={cn('review-list space-y-3', destiny && 'review-destiny')}>
      <div className="review-sort flex gap-2">
        {(['newest', 'highest', 'lowest'] as const).map((sortOption) => (
          <Chip
            key={sortOption}
            active={sort === sortOption}
            onClick={() => setSort(sortOption)}
            className="capitalize"
          >
            {sortOption}
          </Chip>
        ))}
      </div>

      <div className="review-items space-y-3">
        {sorted.map((review) => (
          <Card key={review.id} className="review-card space-y-1">
            <p className="review-meta flex items-center gap-2 text-[13px]">
              {destiny ? (
                <span className="review-rating inline-flex items-center gap-1 font-bold tabular-nums">
                  <StarIcon />
                  {review.rating.toFixed(1)}
                </span>
              ) : (
                <span className="text-accent-primary font-mono font-bold">
                  {'★'.repeat(review.rating)}
                  <span className="text-text-muted">
                    {'★'.repeat(5 - review.rating)}
                  </span>
                </span>
              )}
              <span className="review-date text-text-muted">
                {new Date(review.created_at).toLocaleDateString('en-IN', {
                  day: 'numeric',
                  month: 'short',
                })}
              </span>
              <span className="review-verified rounded-chip border-accent-secondary text-accent-secondary border px-2 py-px text-[11px]">
                Verified visit
              </span>
            </p>
            {review.comment ? (
              <p className="review-comment text-paper text-sm">
                {review.comment}
              </p>
            ) : null}
          </Card>
        ))}
      </div>
    </div>
  );
}

function StarIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      width="15"
      height="15"
      fill="currentColor"
      aria-hidden="true"
    >
      <path d="m12 2.8 2.75 5.58 6.16.9-4.46 4.34 1.05 6.13L12 16.86l-5.5 2.89 1.05-6.13L3.1 9.28l6.15-.9L12 2.8Z" />
    </svg>
  );
}
