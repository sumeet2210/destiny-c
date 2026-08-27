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
    <div className="flex min-h-full w-full bg-[#101010]">
      <aside className="hidden w-60 shrink-0 self-start overflow-y-auto sm:sticky sm:top-0 sm:flex sm:h-screen">
        <OwnerNav signOutAction={signOut} />
      </aside>
      <div className="min-w-0 flex-1">
        <div className="sm:hidden">
          <OwnerNav horizontal signOutAction={signOut} />
        </div>
        <main className="bg-surface-muted min-h-full p-4 sm:rounded-tl-[1.75rem] sm:p-6 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}
