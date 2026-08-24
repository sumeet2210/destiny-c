import Link from 'next/link';
import { AdminNav } from '@/components/features/AdminNav';
import { Button } from '@/components/ui/Button';
import { requireAdmin } from '@/lib/auth/session';
import { signOut } from '@/lib/auth/actions';
import { isSupabaseConfigured } from '@/lib/supabase/server';

/**
 * The admin console gets its own route group so it inherits neither the student
 * tab bar (AppShell wraps only (public) and (student)) nor the owner sidebar.
 *
 * This guard is a convenience, not the security boundary: lib/queries/admin.ts
 * and lib/admin/actions.ts each call requireAdmin() themselves, because they run
 * on the service-role client where RLS does not apply.
 */
export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Seed mode has no auth; let the pages render their not-configured notices.
  if (isSupabaseConfigured()) {
    await requireAdmin();
  }

  return (
    <div className="mx-auto flex min-h-full w-full max-w-6xl">
      <aside className="border-border-hairline hidden w-52 shrink-0 flex-col gap-1 border-r p-4 sm:flex">
        <Link
          href="/admin"
          className="font-display text-accent-primary mb-4 text-lg font-extrabold"
        >
          Destiny{' '}
          <span className="text-text-muted text-xs font-normal">admin</span>
        </Link>
        <AdminNav />
        <form action={signOut} className="mt-auto">
          <Button type="submit" variant="ghost" size="sm" className="w-full">
            Log out
          </Button>
        </form>
      </aside>
      <div className="min-w-0 flex-1">
        <div className="border-border-hairline border-b p-3 sm:hidden">
          <AdminNav horizontal />
        </div>
        <div className="p-4 sm:p-6">{children}</div>
      </div>
    </div>
  );
}
