import { redirect } from 'next/navigation';
import { MobileTabBar, SiteHeader } from '@/components/features/SiteNav';
import { getSessionUser } from '@/lib/auth/session';

/** Shared public/student chrome: header, account chip and bottom tab bar. */
export async function AppShell({ children }: { children: React.ReactNode }) {
  const user = await getSessionUser();

  // Owners are scoped to /owner/*. Every route this shell wraps is a student
  // surface, and the tab bar below points only at student destinations, so an
  // owner who lands here has no navigation that works — tapping Profile used to
  // bounce them to /login and read as a forced logout. They have their own nav
  // in (owner)/(manage), so send them there instead.
  //
  // Owners only. `admin` is also a non-student role but has no portal of its
  // own, and redirecting it here would trap it in a loop.
  if (user?.role === 'owner') redirect('/owner/dashboard');

  return (
    <>
      {/* Bottom padding clears the fixed tab bar. It lives with the tab bar
          rather than in the root layout so owner pages, which render neither,
          don't carry 6rem of dead space. */}
      <div className="flex min-h-full flex-col pb-[calc(6rem+env(safe-area-inset-bottom))]">
        <SiteHeader
          accountHref={user ? '/account' : '/login'}
          accountLabel={
            user?.full_name?.split(' ')[0] ?? (user ? 'Account' : 'Log in')
          }
        />
        <div className="flex-1">{children}</div>
      </div>
      <MobileTabBar />
    </>
  );
}
