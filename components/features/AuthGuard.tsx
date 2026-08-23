'use client';

// Client-side route guard. The Next server no longer holds the session (auth
// moved into Express; tokens live in localStorage), so protected route groups
// can't gate on the server the way middleware/requireStudent used to. This reads
// the session after mount and redirects visitors who are absent or the wrong
// role to the appropriate login.
import { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useSession } from '@/lib/session';
import type { SessionUser } from '@/lib/session';

type Role = SessionUser['role'];

export function AuthGuard({
  role,
  children,
}: {
  /** Required role. Omit to require only that *someone* is signed in. */
  role?: Role;
  children: React.ReactNode;
}) {
  const { isAuthenticated, role: currentRole } = useSession();
  const router = useRouter();
  const pathname = usePathname();
  // useSyncExternalStore returns the server snapshot (null session) on the first
  // client render, then re-syncs to the hydrated localStorage session in the
  // same commit that flips `mounted`. Gating on `mounted` means we never act on
  // that first null render — otherwise a logged-in user would be bounced to
  // login for a frame. SSR and first client render both produce the fallback,
  // so there is no hydration mismatch.
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const allowed = isAuthenticated && (!role || currentRole === role);

  useEffect(() => {
    if (!mounted || allowed) return;
    if (!isAuthenticated) {
      // Owners and admins both authenticate with email/password at the owner
      // login; only students use the OTP page (which carries a ?next back).
      const usesPasswordLogin = role === 'owner' || role === 'admin';
      const loginPath = usesPasswordLogin ? '/owner/login' : '/login';
      const suffix = usesPasswordLogin
        ? ''
        : `?next=${encodeURIComponent(pathname)}`;
      router.replace(`${loginPath}${suffix}`);
    } else {
      // Signed in but wrong audience — send them to their own home.
      const home =
        currentRole === 'owner'
          ? '/owner/dashboard'
          : currentRole === 'admin'
            ? '/admin'
            : '/';
      router.replace(home);
    }
  }, [mounted, allowed, isAuthenticated, currentRole, role, router, pathname]);

  if (!allowed) return <RouteGuardFallback />;
  return <>{children}</>;
}

function RouteGuardFallback() {
  return (
    <div className="grid min-h-[60vh] place-items-center px-6">
      <div className="flex flex-col items-center gap-3 text-center">
        <span
          className="h-8 w-8 animate-spin rounded-full border-2 border-[#1DB954] border-t-transparent"
          aria-hidden
        />
        <p className="text-sm text-neutral-500">Checking your session…</p>
      </div>
    </div>
  );
}
