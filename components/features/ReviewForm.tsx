'use client';

import { useState, useTransition } from 'react';
import { Button } from '@/components/ui/Button';
import { Textarea } from '@/components/ui/Input';
import { Sheet } from '@/components/ui/Sheet';
import { useToast } from '@/components/ui/Toast';
import { createReview } from '@/lib/reviews/actions';
import { cn } from '@/lib/cn';

export function ReviewForm({
  bookingId,
  restaurantName,
}: {
  bookingId: string;
  restaurantName: string;
}) {
  const [open, setOpen] = useState(false);
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [done, setDone] = useState(false);
  const [pending, startTransition] = useTransition();
  const toast = useToast();

  if (done) {
    return (
      <span className="text-accent-secondary text-[12px]">Review posted ✓</span>
    );
  }

  return (
    <>
      <Button variant="outline" size="sm" onClick={() => setOpen(true)}>
        Leave a review
      </Button>
      <Sheet
        open={open}
        onClose={() => setOpen(false)}
        title={`How was ${restaurantName}?`}
      >
        <div className="space-y-4">
          <div
            role="radiogroup"
            aria-label="Rating"
            className="flex justify-center gap-2 text-3xl"
          >
            {[1, 2, 3, 4, 5].map((n) => (
              <button
                key={n}
                type="button"
                role="radio"
                aria-checked={rating === n}
                aria-label={`${n} star${n > 1 ? 's' : ''}`}
                onClick={() => setRating(n)}
                className={cn(
                  'transition-colors',
                  n <= rating ? 'text-accent-primary' : 'text-surface-raised',
                )}
              >
                ★
              </button>
            ))}
          </div>
          <Textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="What should the next group know?"
          />
          <Button
            className="w-full"
            disabled={pending || rating === 0}
            onClick={() =>
              startTransition(async () => {
                const res = await createReview({ bookingId, rating, comment });
                if (res.ok) {
                  setDone(true);
                  setOpen(false);
                  toast('Review posted — thanks', 'positive');
                } else {
                  toast(res.message ?? 'Could not post that', 'error');
                }
              })
            }
          >
            {pending ? 'Posting…' : 'Post review'}
          </Button>
        </div>
      </Sheet>
    </>
  );
}
