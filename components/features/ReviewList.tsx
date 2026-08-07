'use client';

import { useMemo, useState } from 'react';
import { Chip } from '@/components/ui/Chip';
import { Card } from '@/components/ui/Card';

export type ReviewItem = {
  id: string;
  rating: number;
  comment: string | null;
  created_at: string;
};

type Sort = 'newest' | 'highest' | 'lowest';

/** Reviews sortable by newest, highest, lowest (PRD §5.8). */
export function ReviewList({ reviews }: { reviews: ReviewItem[] }) {
  const [sort, setSort] = useState<Sort>('newest');

  const sorted = useMemo(() => {
    const copy = [...reviews];
    if (sort === 'newest')
      copy.sort(
        (a, b) =>
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
      );
    if (sort === 'highest') copy.sort((a, b) => b.rating - a.rating);
    if (sort === 'lowest') copy.sort((a, b) => a.rating - b.rating);
    return copy;
  }, [reviews, sort]);

  if (reviews.length === 0) {
    return (
      <p className="text-text-muted text-sm">
        No reviews yet. Reviews come from students who actually booked and
        showed up — so the first one has to earn it.
      </p>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex gap-2">
        {(['newest', 'highest', 'lowest'] as const).map((s) => (
          <Chip
            key={s}
            active={sort === s}
            onClick={() => setSort(s)}
            className="capitalize"
          >
            {s}
          </Chip>
        ))}
      </div>
      <div className="space-y-3">
        {sorted.map((r) => (
          <Card key={r.id} className="space-y-1">
            <p className="flex items-center gap-2 text-[13px]">
              <span className="text-accent-primary font-mono font-bold">
                {'★'.repeat(r.rating)}
                <span className="text-text-muted">
                  {'★'.repeat(5 - r.rating)}
                </span>
              </span>
              <span className="text-text-muted">
                {new Date(r.created_at).toLocaleDateString('en-IN', {
                  day: 'numeric',
                  month: 'short',
                })}
              </span>
              <span className="rounded-chip border-accent-secondary text-accent-secondary border px-2 py-px text-[11px]">
                Verified visit
              </span>
            </p>
            {r.comment && <p className="text-paper text-sm">{r.comment}</p>}
          </Card>
        ))}
      </div>
    </div>
  );
}
