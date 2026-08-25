'use client';

import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';
import { Button } from '@/components/ui/Button';
import { submitOwnerProfileForReview } from '@/lib/onboarding/actions';

export function ProfileReviewSubmit() {
  const router = useRouter();
  const [message, setMessage] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  return (
    <div className="mt-4 space-y-2">
      <Button
        type="button"
        disabled={pending}
        onClick={() =>
          startTransition(async () => {
            const result = await submitOwnerProfileForReview();
            setMessage(result.message ?? null);
            if (result.ok) router.refresh();
          })
        }
      >
        {pending ? 'Checking profile…' : 'Submit profile for review'}
      </Button>
      {message ? <p className="text-text-muted text-xs">{message}</p> : null}
    </div>
  );
}
