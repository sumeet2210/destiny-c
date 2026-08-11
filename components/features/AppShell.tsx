import { MobileTabBar, SiteHeader } from '@/components/features/SiteNav';
import { getSessionUser } from '@/lib/auth/session';

/** Shared public/student chrome: header, mobile tab bar, account chip. */
export async function AppShell({ children }: { children: React.ReactNode }) {
  const user = await getSessionUser();

  return (
    <div className="flex min-h-full flex-col pb-16 sm:pb-0">
      <SiteHeader
        accountHref={
          user
            ? user.role === 'owner'
              ? '/owner/dashboard'
              : '/account'
            : '/login'
        }
        accountLabel={
          user?.full_name?.split(' ')[0] ?? (user ? 'Account' : 'Log in')
        }
      />
      <div className="flex-1">{children}</div>
      <MobileTabBar />
    </div>
  );
}
