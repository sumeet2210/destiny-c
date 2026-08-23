'use client';

import { AddFriendForm } from '@/components/features/AddFriendForm';
import { FriendRow } from '@/components/features/FriendRow';
import { AuthGuard } from '@/components/features/AuthGuard';
import { LoadingBlock, ErrorBlock } from '@/components/features/AsyncStates';
import { Card } from '@/components/ui/Card';
import { getFriendsBundle } from '@/lib/api/social';
import { useApi } from '@/lib/hooks/useApi';

export function FriendsView() {
  return (
    <AuthGuard role="student">
      <FriendsContent />
    </AuthGuard>
  );
}

function FriendsContent() {
  const { data, loading, error, reload } = useApi(() => getFriendsBundle(), []);

  return (
    <main className="mx-auto max-w-md space-y-6 px-4 py-6">
      <div>
        <h1 className="font-display text-paper text-2xl font-extrabold">
          Friends
        </h1>
        <p className="text-text-muted mt-1 text-[13px]">
          Mutual consent only — no followers, no public profiles. Friends see
          your saved places and event plans only if you turn sharing on.
        </p>
      </div>

      <AddFriendForm onChanged={reload} />

      {loading && !data ? (
        <LoadingBlock label="Loading your circle…" />
      ) : error ? (
        <ErrorBlock message={error} onRetry={reload} />
      ) : data ? (
        <>
          {data.incoming.length > 0 && (
            <section className="space-y-2">
              <h2 className="font-display text-paper text-lg font-bold">
                Requests
              </h2>
              {data.incoming.map((f) => (
                <FriendRow
                  key={f.friendshipId}
                  entry={f}
                  kind="incoming"
                  onChanged={reload}
                />
              ))}
            </section>
          )}

          {data.outgoing.length > 0 && (
            <section className="space-y-2">
              <h2 className="font-display text-paper text-lg font-bold">
                Sent
              </h2>
              {data.outgoing.map((f) => (
                <FriendRow
                  key={f.friendshipId}
                  entry={f}
                  kind="outgoing"
                  onChanged={reload}
                />
              ))}
            </section>
          )}

          <section className="space-y-2">
            <h2 className="font-display text-paper text-lg font-bold">
              Your people{' '}
              <span className="text-text-muted font-mono text-sm">
                {data.friends.length}
              </span>
            </h2>
            {data.friends.length === 0 ? (
              <Card className="text-text-muted text-sm">
                No friends yet. Add someone by their institute email — deciding
                where to eat is a group sport.
              </Card>
            ) : (
              data.friends.map((f) => (
                <FriendRow
                  key={f.friendshipId}
                  entry={f}
                  kind="friend"
                  onChanged={reload}
                />
              ))
            )}
          </section>
        </>
      ) : null}
    </main>
  );
}
