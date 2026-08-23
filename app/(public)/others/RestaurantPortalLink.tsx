'use client';

// The portal link's destination depends on who's signed in (owners go straight
// to their dashboard, everyone else to the owner login). The Next server no
// longer holds the session, so this small client component reads it after mount
// and picks the href; the visible card markup is passed in as children so the
// server page keeps owning the layout.
import Link from 'next/link';
import { useSession } from '@/lib/session';

export function RestaurantPortalLink({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  const { role } = useSession();
  const href = role === 'owner' ? '/owner/dashboard' : '/owner/login';
  return (
    <Link href={href} className={className}>
      {children}
    </Link>
  );
}
