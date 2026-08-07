'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/cn';

const tabs = [
  { href: '/', label: 'Home', icon: '🏠' },
  { href: '/search', label: 'Search', icon: '🔎' },
  { href: '/events', label: 'Events', icon: '📅' },
  { href: '/saved', label: 'Saved', icon: '🔖' },
  { href: '/bookings', label: 'Bookings', icon: '🍽️' },
] as const;

export function SiteHeader({ accountSlot }: { accountSlot?: React.ReactNode }) {
  return (
    <header className="border-border-hairline bg-canvas/95 sticky top-0 z-40 border-b backdrop-blur">
      <div className="mx-auto flex h-14 max-w-5xl items-center justify-between gap-4 px-4">
        <Link
          href="/"
          className="font-display text-accent-primary text-xl font-extrabold"
        >
          Destiny
        </Link>
        <nav className="hidden items-center gap-1 sm:flex">
          {tabs.slice(1).map((t) => (
            <NavLink key={t.href} href={t.href} label={t.label} />
          ))}
          <NavLink href="/friends" label="Friends" />
        </nav>
        <div className="flex items-center gap-2">{accountSlot}</div>
      </div>
    </header>
  );
}

function NavLink({ href, label }: { href: string; label: string }) {
  const pathname = usePathname();
  const active =
    pathname === href || (href !== '/' && pathname.startsWith(href));
  return (
    <Link
      href={href}
      className={cn(
        'rounded-control px-3 py-1.5 text-sm',
        active
          ? 'bg-surface-raised text-paper'
          : 'text-text-muted hover:text-paper',
      )}
    >
      {label}
    </Link>
  );
}

/** Mobile bottom tab bar — this is a phone product first (build plan §1). */
export function MobileTabBar() {
  const pathname = usePathname();
  return (
    <nav className="border-border-hairline bg-surface-muted fixed inset-x-0 bottom-0 z-40 border-t pb-[env(safe-area-inset-bottom)] sm:hidden">
      <div className="flex">
        {tabs.map((t) => {
          const active =
            pathname === t.href ||
            (t.href !== '/' && pathname.startsWith(t.href));
          return (
            <Link
              key={t.href}
              href={t.href}
              className={cn(
                'flex flex-1 flex-col items-center gap-0.5 py-2 text-[11px]',
                active ? 'text-accent-primary' : 'text-text-muted',
              )}
            >
              <span aria-hidden className="text-base leading-none">
                {t.icon}
              </span>
              {t.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
