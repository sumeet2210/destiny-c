'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { cn } from '@/lib/cn';
import styles from './owner-nav.module.css';

// Offers/events and reviews/analytics each live on one page now. The old routes
// still resolve — they redirect — but they are deliberately absent here: a
// `/owner/offers` entry would also match `/owner/offers-events` below.
const items = [
  { href: '/', label: 'Home' },
  { href: '/owner/bookings', label: 'Bookings' },
  { href: '/owner/profile', label: 'Profile' },
  { href: '/owner/hours', label: 'Timing & Hours' },
  { href: '/owner/menu', label: 'Menu' },
  { href: '/owner/offers-events', label: 'Offers & Events' },
  { href: '/owner/analytics', label: 'Restaurant Analytics' },
] as const;

export function OwnerNav({
  signOutAction,
}: {
  signOutAction: () => Promise<void>;
}) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const isActive = (href: string) =>
    href === '/' ? pathname === '/' : pathname.startsWith(href);

  useEffect(() => {
    if (!open) return;
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false);
    };
    window.addEventListener('keydown', closeOnEscape);
    return () => window.removeEventListener('keydown', closeOnEscape);
  }, [open]);

  return (
    <header className={styles.header}>
      <div className={styles.topBar}>
        <p className={styles.brand}>Restaurant portal</p>
        <button
          type="button"
          className={styles.menuButton}
          aria-label={open ? 'Close navigation menu' : 'Open navigation menu'}
          aria-expanded={open}
          aria-controls="owner-navigation-menu"
          onClick={() => setOpen((current) => !current)}
        >
          <span className={styles.menuIcon} aria-hidden>
            <span />
            <span />
            <span />
          </span>
        </button>
      </div>

      {open ? (
        <>
          <button
            type="button"
            className={styles.backdrop}
            aria-label="Close navigation menu"
            onClick={() => setOpen(false)}
          />
          <nav
            id="owner-navigation-menu"
            aria-label="Owner tools"
            className={styles.menuPanel}
          >
            {items.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setOpen(false)}
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
        </>
      ) : null}
    </header>
  );
}
