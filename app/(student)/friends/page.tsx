import { AddFriendForm } from '@/components/features/AddFriendForm';
import { FriendRow } from '@/components/features/FriendRow';
import { Card } from '@/components/ui/Card';
import { requireStudent } from '@/lib/auth/session';
import { getFriendsBundle } from '@/lib/queries/social';
import { isSupabaseConfigured } from '@/lib/supabase/server';

export const metadata = { title: 'Friends' };

export default async function FriendsPage() {
  if (!isSupabaseConfigured()) {
    return (
      <main className="mx-auto max-w-md px-4 py-6">
        <h1 className="font-display text-paper text-2xl font-extrabold">
          Friends
        </h1>
        <Card className="text-text-muted mt-4 text-sm">
          Seed mode — the social layer needs a live Supabase project.
        </Card>
      </main>
    );
  }

  await requireStudent('/friends');
  const { friends, incoming, outgoing } = await getFriendsBundle();

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

      <AddFriendForm />

      {incoming.length > 0 && (
        <section className="space-y-2">
          <h2 className="font-display text-paper text-lg font-bold">
            Requests
          </h2>
          {incoming.map((f) => (
            <FriendRow key={f.friendshipId} entry={f} kind="incoming" />
          ))}
        </section>
      )}

      {outgoing.length > 0 && (
        <section className="space-y-2">
          <h2 className="font-display text-paper text-lg font-bold">Sent</h2>
          {outgoing.map((f) => (
            <FriendRow key={f.friendshipId} entry={f} kind="outgoing" />
          ))}
        </section>
      )}

      <section className="space-y-2">
        <h2 className="font-display text-paper text-lg font-bold">
          Your people{' '}
          <span className="text-text-muted font-mono text-sm">
            {friends.length}
          </span>
        </h2>
        {friends.length === 0 ? (
          <Card className="text-text-muted text-sm">
            No friends yet. Add someone by their institute email — deciding
            where to eat is a group sport.
          </Card>
        ) : (
          friends.map((f) => (
            <FriendRow key={f.friendshipId} entry={f} kind="friend" />
          ))
        )}
      </section>
    </main>
  );
}
