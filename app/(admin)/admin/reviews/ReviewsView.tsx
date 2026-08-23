'use client';

import { useTransition } from 'react';
import { ErrorBlock, LoadingBlock } from '@/components/features/AsyncStates';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { useToast } from '@/components/ui/Toast';
import { deleteReview, listReviews } from '@/lib/api/admin';
import type { AdminReview } from '@/lib/api/types';
import { useApi } from '@/lib/hooks/useApi';

export function ReviewsView() {
  const { data, error, reload } = useApi(() => listReviews(), []);

  return (
    <div className="space-y-5">
      <div>
        <h1 className="font-display text-paper text-2xl font-extrabold">
          Reviews
        </h1>
        <p className="text-text-muted mt-1 text-[13px]">
          The most recent reviews across every restaurant. Delete anything
          abusive or fake.
        </p>
      </div>

      {error ? (
        <ErrorBlock message={error} onRetry={reload} />
      ) : !data ? (
        <LoadingBlock label="Loading reviews…" />
      ) : data.length === 0 ? (
        <p className="text-text-muted text-sm">No reviews yet.</p>
      ) : (
        <div className="space-y-3">
          {data.map((r) => (
            <ReviewRow key={r.id} review={r} onChanged={reload} />
          ))}
        </div>
      )}
    </div>
  );
}

function ReviewRow({
  review,
  onChanged,
}: {
  review: AdminReview;
  onChanged: () => void;
}) {
  const [pending, startTransition] = useTransition();
  const toast = useToast();

  const remove = () =>
    startTransition(async () => {
      try {
        await deleteReview(review.id);
        toast('Review deleted', 'positive');
        onChanged();
      } catch (err) {
        toast(err instanceof Error ? err.message : 'Could not delete', 'error');
      }
    });

  const rating = Math.max(0, Math.min(5, review.rating));

  return (
    <Card className="space-y-2">
      <div className="flex items-baseline justify-between gap-2">
        <p className="text-sm font-semibold" aria-label={`${rating} out of 5`}>
          <span className="text-accent-primary">{'★'.repeat(rating)}</span>
          <span className="text-text-muted">{'★'.repeat(5 - rating)}</span>
        </p>
        <Button
          variant="urgent-text"
          size="sm"
          disabled={pending}
          onClick={remove}
        >
          Delete
        </Button>
      </div>
      {review.restaurantName && (
        <p className="text-text-muted text-[12px]">{review.restaurantName}</p>
      )}
      {review.comment && (
        <p className="text-paper text-[13px]">“{review.comment}”</p>
      )}
      {review.student && (
        <p className="text-text-muted text-[12px]">
          — {review.student.full_name ?? review.student.email}
        </p>
      )}
    </Card>
  );
}
