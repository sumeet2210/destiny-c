'use client';

import { useTransition } from 'react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { useToast } from '@/components/ui/Toast';
import { removeFriend, respondToRequest } from '@/lib/social/actions';

export function FriendRow({
  entry,
  kind,
}: {
  entry: { friendshipId: string; name: string | null; hostel: string | null };
  kind: 'friend' | 'incoming' | 'outgoing';
}) {
  const [pending, startTransition] = useTransition();
  const toast = useToast();

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
            <Button
              size="sm"
              disabled={pending}
              onClick={() =>
                startTransition(async () => {
                  const res = await respondToRequest(entry.friendshipId, true);
                  if (!res.ok) toast(res.message ?? 'Failed', 'error');
                })
              }
            >
              Accept
            </Button>
            <Button
              variant="ghost"
              size="sm"
              disabled={pending}
              onClick={() =>
                startTransition(async () => {
                  const res = await respondToRequest(entry.friendshipId, false);
                  if (!res.ok) toast(res.message ?? 'Failed', 'error');
                })
              }
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
            onClick={() =>
              startTransition(async () => {
                const res = await removeFriend(entry.friendshipId);
                if (!res.ok) toast(res.message ?? 'Failed', 'error');
              })
            }
          >
            Withdraw
          </Button>
        )}
        {kind === 'friend' && (
          <Button
            variant="ghost"
            size="sm"
            disabled={pending}
            onClick={() =>
              startTransition(async () => {
                const res = await removeFriend(entry.friendshipId);
                if (!res.ok) toast(res.message ?? 'Failed', 'error');
              })
            }
          >
            Remove
          </Button>
        )}
      </div>
    </Card>
  );
}
