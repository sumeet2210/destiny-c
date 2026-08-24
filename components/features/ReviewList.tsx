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
  reviewerName?: string;
};

type Sort = 'newest' | 'highest' | 'lowest';

/**
 * Reviews sortable by newest, highest, lowest (PRD §5.8).
 *
 * The `review-*` class hooks are restyled by the public restaurant page's CSS
 * module. The Tailwind classes here are the standalone fallback for surfaces
 * without that module (the owner portal); every one of them targets a property
 * the module also declares, and `.reviewsSection :global(.x)` outranks a bare
 * utility class, so the public page is unaffected.
 */
export function ReviewList({
  reviews,
  appearance = 'default',
}: {
  reviews: ReviewItem[];
  appearance?: 'default' | 'destiny';
}) {
  const [sort, setSort] = useState<Sort>('newest');
  const [expanded, setExpanded] = useState(false);
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
            className="review-sort-button"
          >
            {sortOption === 'newest'
              ? 'Newest'
              : sortOption === 'highest'
                ? 'Highest Rated'
                : 'Lowest Rated'}
          </Chip>
        ))}
      </div>

      <div className="review-items space-y-3">
        {(expanded ? sorted : sorted.slice(0, 4)).map((review) => (
          <Card key={review.id} className="review-card space-y-1">
            <div className="review-card-head flex items-center gap-3">
              <span
                className="review-avatar bg-surface-raised text-accent-primary grid h-9 w-9 shrink-0 place-items-center rounded-full text-[11px] font-extrabold"
                aria-hidden
              >
                {(review.reviewerName ?? 'NITW diner')
                  .split(' ')
                  .map((part) => part[0])
                  .join('')
                  .slice(0, 2)
                  .toUpperCase()}
              </span>
              <div>
                <strong className="review-author block text-[13px]">
                  {review.reviewerName ?? 'NITW diner'}
                </strong>
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
                </p>
              </div>
            </div>
            {review.comment ? (
              <p className="review-comment text-paper text-sm">
                {review.comment}
              </p>
            ) : null}
          </Card>
        ))}
      </div>
      {sorted.length > 4 && !expanded ? (
        <button
          type="button"
          className="review-show-more rounded-control border-border-hairline text-paper min-h-10 w-fit border px-3 text-[13px] font-semibold"
          onClick={() => setExpanded(true)}
        >
          Show more
        </button>
      ) : null}
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
