'use client';

import { useTransition } from 'react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { useToast } from '@/components/ui/Toast';
import { removeFriend, respondToFriendRequest } from '@/lib/api/social';

export function FriendRow({
  entry,
  kind,
  onChanged,
}: {
  entry: { friendshipId: string; name: string | null; hostel: string | null };
  kind: 'friend' | 'incoming' | 'outgoing';
  /** Called after accept/decline/remove so the list can refetch. */
  onChanged?: () => void;
}) {
  const [pending, startTransition] = useTransition();
  const toast = useToast();

  const respond = (accept: boolean) =>
    startTransition(async () => {
      try {
        await respondToFriendRequest(entry.friendshipId, accept);
        onChanged?.();
      } catch (err) {
        toast(err instanceof Error ? err.message : 'Failed', 'error');
      }
    });

  const remove = () =>
    startTransition(async () => {
      try {
        await removeFriend(entry.friendshipId);
        onChanged?.();
      } catch (err) {
        toast(err instanceof Error ? err.message : 'Failed', 'error');
      }
    });

  return (
    <Card className="flex items-center justify-between gap-3 py-3">
      <div>
        <p className="text-paper text-sm font-medium">
          {entry.name ?? 'A student'}
        </p>
        {entry.hostel && (
          <p className="text-text-muted text-[12px]">{entry.hostel}</p>
        )}
      </div>
      <div className="flex gap-2">
        {kind === 'incoming' && (
          <>
            <Button size="sm" disabled={pending} onClick={() => respond(true)}>
              Accept
            </Button>
            <Button
              variant="ghost"
              size="sm"
              disabled={pending}
              onClick={() => respond(false)}
            >
              Decline
            </Button>
          </>
        )}
        {kind === 'outgoing' && (
          <Button
            variant="ghost"
            size="sm"
            disabled={pending}
            onClick={remove}
          >
            Withdraw
          </Button>
        )}
        {kind === 'friend' && (
          <Button variant="ghost" size="sm" disabled={pending} onClick={remove}>
            Remove
          </Button>
        )}
      </div>
    </Card>
  );
}
