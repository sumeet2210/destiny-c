import Link from 'next/link';
import { OwnerNav } from '@/components/features/OwnerNav';
import { Button } from '@/components/ui/Button';
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
    <div className="mx-auto flex min-h-full w-full max-w-6xl">
      <aside className="border-border-hairline hidden w-52 shrink-0 flex-col gap-1 border-r p-4 sm:flex">
        <Link
          href="/owner/dashboard"
          className="font-display text-accent-primary mb-4 text-lg font-extrabold"
        >
          Destiny
        </Link>
        <OwnerNav />
        <form action={signOut} className="mt-auto">
          <Button type="submit" variant="ghost" size="sm" className="w-full">
            Log out
          </Button>
        </form>
      </aside>
      <div className="min-w-0 flex-1">
        <div className="border-border-hairline border-b p-3 sm:hidden">
          <OwnerNav horizontal />
        </div>
        <div className="p-4 sm:p-6">{children}</div>
      </div>
    </div>
  );
}
