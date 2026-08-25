'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { activateRestaurantProfile } from '@/lib/admin/actions';

export function ActivateRestaurantButton({ id }: { id: string }) {
  const router = useRouter();
  const [message, setMessage] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  return (
    <div>
      <button
        disabled={pending}
        onClick={() =>
          startTransition(async () => {
            const result = await activateRestaurantProfile(id);
            setMessage(result.message ?? null);
            if (result.ok) router.refresh();
          })
        }
      >
        {pending ? 'Activating…' : 'Approve and activate'}
      </button>
      {message ? <small>{message}</small> : null}
    </div>
  );
}
