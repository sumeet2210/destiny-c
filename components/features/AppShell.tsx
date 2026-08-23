'use client';

import { SiteHeader } from '@/components/features/SiteNav';
import { useSession } from '@/lib/session';

/** Shared public/student chrome: header and account chip. Client-rendered now
 *  that the session lives in the browser (localStorage) instead of a server
 *  cookie, so it reads useSession() rather than awaiting getSessionUser(). The
 *  wrapping layout stays a Server Component; {children} is passed straight
 *  through, so public pages keep server-rendering while only this chrome is
 *  client-side. */
export function AppShell({ children }: { children: React.ReactNode }) {
  const { user } = useSession();

  const accountHref = user
    ? user.role === 'owner'
      ? '/owner/dashboard'
      : '/account'
    : '/login';
  const accountLabel =
    user?.full_name?.split(' ')[0] ?? (user ? 'Account' : 'Log in');

  return (
    <div className="flex min-h-full flex-col">
      <SiteHeader accountHref={accountHref} accountLabel={accountLabel} />
      <div className="flex-1">{children}</div>
    </div>
  );
}
