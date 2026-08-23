'use client';

// Client guard for the whole admin console, mirroring the owner (manage) layout.
// Auth lives in Express and the Next server holds no session, so access is gated
// by <AuthGuard role="admin">, which reads the localStorage session after mount
// and bounces non-admins. Every /admin/* page renders inside this shell, so the
// individual pages need no guard of their own.
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { AdminNav } from '@/components/features/AdminNav';
import { AuthGuard } from '@/components/features/AuthGuard';
import { Button } from '@/components/ui/Button';
import { useSession } from '@/lib/session';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { signOut } = useSession();
  const router = useRouter();

  return (
    <AuthGuard role="admin">
      <div className="mx-auto flex min-h-full w-full max-w-6xl">
        <aside className="border-border-hairline hidden w-52 shrink-0 flex-col gap-1 border-r p-4 sm:flex">
          <Link
            href="/"
            className="font-display text-accent-primary text-lg font-extrabold"
          >
            Destiny
          </Link>
          <p className="text-text-muted mb-4 text-[11px] font-semibold tracking-[0.14em] uppercase">
            Admin console
          </p>
          <AdminNav />
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="mt-auto w-full"
            onClick={async () => {
              await signOut();
              router.push('/owner/login');
            }}
          >
            Log out
          </Button>
        </aside>
        <div className="min-w-0 flex-1">
          <div className="border-border-hairline border-b p-3 sm:hidden">
            <AdminNav horizontal />
          </div>
          <div className="p-4 sm:p-6">{children}</div>
        </div>
      </div>
    </AuthGuard>
  );
}
