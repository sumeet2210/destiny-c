import Link from 'next/link';
import { MobileTabBar, SiteHeader } from '@/components/features/SiteNav';
import { getSessionUser } from '@/lib/auth/session';

/** Shared public/student chrome: header, mobile tab bar, account chip. */
export async function AppShell({ children }: { children: React.ReactNode }) {
  const user = await getSessionUser();

  return (
    <div className="flex min-h-full flex-col pb-16 sm:pb-0">
      <SiteHeader
        accountSlot={
          user ? (
            <Link
              href={user.role === 'owner' ? '/owner/dashboard' : '/account'}
              className="rounded-chip border-border-hairline bg-surface-raised text-paper border px-3 py-1.5 text-[13px]"
            >
              {user.full_name?.split(' ')[0] ?? 'Account'}
            </Link>
          ) : (
            <Link
              href="/login"
              className="rounded-control bg-accent-primary text-ink-on-primary px-3.5 py-1.5 text-[13px] font-semibold"
            >
              Log in
            </Link>
          )
        }
      />
      <div className="flex-1">{children}</div>
      <MobileTabBar />
    </div>
  );
}
