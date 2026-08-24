'use client';

// Mutating controls for the admin lists. The lists themselves stay Server
// Components; only these buttons need the client, exactly as the owner tools do
// (see components/features/owner/OfferManager.tsx).

import { useOptimistic, useTransition } from 'react';
import { Button } from '@/components/ui/Button';
import { Select } from '@/components/ui/Input';
import { useToast } from '@/components/ui/Toast';
import {
  deleteOffer,
  deleteReview,
  moderateOffer,
  setRestaurantStatus,
  updateUser,
  type ActionResult,
} from '@/lib/admin/actions';
import type { Enums } from '@/types/db';

/** Shared run-and-report wrapper so every control behaves the same way. */
function useAction() {
  const [pending, startTransition] = useTransition();
  const toast = useToast();
  /** `optimistic` runs inside the transition, which is where useOptimistic
   *  updates have to be dispatched from. */
  const run = (fn: () => Promise<ActionResult>, optimistic?: () => void) => {
    startTransition(async () => {
      optimistic?.();
      const res = await fn();
      toast(
        res.ok ? (res.message ?? 'Done') : (res.message ?? 'Failed'),
        res.ok ? 'positive' : 'error',
      );
    });
  };
  return { pending, run };
}

export function RestaurantStatusControls({
  id,
  status,
}: {
  id: string;
  status: Enums<'restaurant_status'>;
}) {
  const { pending, run } = useAction();
  return (
    <div className="flex flex-wrap gap-2">
      {status !== 'active' ? (
        <Button
          size="sm"
          disabled={pending}
          onClick={() => run(() => setRestaurantStatus(id, 'active'))}
        >
          {status === 'suspended' ? 'Reactivate' : 'Approve'}
        </Button>
      ) : null}
      {status !== 'suspended' ? (
        <Button
          size="sm"
          variant="urgent-text"
          disabled={pending}
          onClick={() => run(() => setRestaurantStatus(id, 'suspended'))}
        >
          Suspend
        </Button>
      ) : null}
      {status !== 'pending_approval' ? (
        <Button
          size="sm"
          variant="ghost"
          disabled={pending}
          onClick={() => run(() => setRestaurantStatus(id, 'pending_approval'))}
        >
          Mark pending
        </Button>
      ) : null}
    </div>
  );
}

export function UserControls({
  id,
  role,
  verified,
}: {
  id: string;
  role: Enums<'user_role'>;
  verified: boolean;
}) {
  const { pending, run } = useAction();
  // The dropdown shows the pick straight away instead of snapping back while
  // revalidation is in flight. useOptimistic drops the override once the
  // transition settles, so a rejected change (self-demotion, for instance)
  // reverts to the stored role on its own.
  const [shownRole, setShownRole] = useOptimistic(role);

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Select
        aria-label="Role"
        className="w-auto"
        value={shownRole}
        disabled={pending}
        onChange={(e) => {
          const next = e.target.value as Enums<'user_role'>;
          run(
            () => updateUser(id, { role: next }),
            () => setShownRole(next),
          );
        }}
      >
        <option value="student">student</option>
        <option value="owner">owner</option>
        <option value="admin">admin</option>
      </Select>
      <Button
        size="sm"
        variant="outline"
        disabled={pending}
        onClick={() => run(() => updateUser(id, { nitw_verified: !verified }))}
      >
        {verified ? 'Unverify' : 'Mark verified'}
      </Button>
    </div>
  );
}

export function OfferModerationControls({ id }: { id: string }) {
  const { pending, run } = useAction();
  return (
    <div className="flex flex-wrap gap-2">
      <Button
        size="sm"
        variant="outline"
        disabled={pending}
        onClick={() => run(() => moderateOffer(id, 'clear_flags'))}
      >
        Clear flags
      </Button>
      <Button
        size="sm"
        variant="outline"
        disabled={pending}
        onClick={() => run(() => moderateOffer(id, 'deactivate'))}
      >
        Take down
      </Button>
      <Button
        size="sm"
        variant="urgent-text"
        disabled={pending}
        onClick={() => {
          // Deletion is unrecoverable and the row is gone from every restaurant
          // page too, so it asks first.
          if (!confirm('Delete this offer permanently?')) return;
          run(() => deleteOffer(id));
        }}
      >
        Delete
      </Button>
    </div>
  );
}

export function ReviewControls({ id }: { id: string }) {
  const { pending, run } = useAction();
  return (
    <Button
      size="sm"
      variant="urgent-text"
      disabled={pending}
      onClick={() => {
        if (!confirm('Delete this review permanently?')) return;
        run(() => deleteReview(id));
      }}
    >
      Delete
    </Button>
  );
}
