import { OwnerNav } from '@/components/features/OwnerNav';
import { requireOwner } from '@/lib/auth/session';
import { signOut } from '@/lib/auth/actions';
import { isSupabaseConfigured } from '@/lib/supabase/server';

export default async function OwnerManageLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Seed mode has no auth; let the pages render their not-configured notices.
  if (isSupabaseConfigured()) {
    await requireOwner();
  }

  return (
    <div className="bg-surface-muted min-h-full w-full">
      <OwnerNav signOutAction={signOut} />
      <main className="min-h-[calc(100vh-4rem)] p-4 sm:p-6 lg:p-8">
        {children}
      </main>
    </div>
  );
}
