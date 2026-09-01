'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/cn';
import styles from './owner-nav.module.css';

// Offers/events and reviews/analytics each live on one page now. The old routes
// still resolve — they redirect — but they are deliberately absent here: a
// `/owner/offers` entry would also match `/owner/offers-events` below.
const items = [
  { href: '/', label: 'Home' },
  { href: '/owner/profile', label: 'Profile' },
  { href: '/owner/hours', label: 'Timing & Hours' },
  { href: '/owner/menu', label: 'Menu' },
  { href: '/owner/offers-events', label: 'Offers & Events' },
  { href: '/owner/bookings', label: 'Bookings' },
  { href: '/owner/analytics', label: 'Restaurant Analytics' },
] as const;

export function OwnerNav({
  horizontal = false,
  signOutAction,
}: {
  horizontal?: boolean;
  signOutAction: () => Promise<void>;
}) {
  const pathname = usePathname();
  const isActive = (href: string) =>
    href === '/' ? pathname === '/' : pathname.startsWith(href);

  return (
    <nav
      aria-label="Owner tools"
      className={cn(
        styles.nav,
        horizontal ? styles.horizontal : styles.vertical,
      )}
    >
      {items.map((item) => (
        <Link
          key={item.href}
          href={item.href}
          aria-current={isActive(item.href) ? 'page' : undefined}
          className={cn(
            styles.link,
            isActive(item.href) ? styles.active : styles.inactive,
          )}
        >
          {item.label}
        </Link>
      ))}
      <form action={signOutAction} className={styles.logoutForm}>
        <button type="submit" className={styles.logoutButton}>
          Log out
        </button>
      </form>
    </nav>
  );
}
