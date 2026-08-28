import { redirect } from 'next/navigation';
import { MobileTabBar, SiteHeader } from '@/components/features/SiteNav';
import { getSessionUser } from '@/lib/auth/session';

/** Shared public/student chrome: header, account chip and bottom tab bar. */
export async function AppShell({
  children,
  allowOwner = false,
}: {
  children: React.ReactNode;
  allowOwner?: boolean;
}) {
  const user = await getSessionUser();
  const ownerPortalHref = '/owner/profile';
  const isOwner = user?.role === 'owner';

  // Public discovery is useful to owners as a live preview. Student-only
  // routes keep their role guard, so an owner cannot accidentally enter a
  // student login or account flow while their owner session is active.
  if (isOwner && !allowOwner) redirect('/owner/dashboard');

  return (
    <>
      {/* Bottom padding clears the fixed tab bar. It lives with the tab bar
          rather than in the root layout so owner pages, which render neither,
          don't carry 6rem of dead space. */}
      <div className="flex min-h-full flex-col pb-[calc(6rem+env(safe-area-inset-bottom))]">
        <SiteHeader
          accountHref={isOwner ? ownerPortalHref : user ? '/account' : '/login'}
          accountLabel={
            isOwner
              ? 'Owner portal'
              : (user?.full_name?.split(' ')[0] ??
                (user ? 'Account' : 'Log in'))
          }
          portalHref={isOwner ? ownerPortalHref : '/owner/login'}
          ownerMode={isOwner}
        />
        <div className="flex-1">{children}</div>
      </div>
      <MobileTabBar profileHref={isOwner ? ownerPortalHref : '/account'} />
    </>
  );
}
