'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { cn } from '@/lib/cn';

type NavIconName = 'home' | 'search' | 'events' | 'saved' | 'bookings';

const tabs: ReadonlyArray<{
  href: string;
  label: string;
  icon: NavIconName;
}> = [
  { href: '/', label: 'Home', icon: 'home' },
  { href: '/search', label: 'Search', icon: 'search' },
  { href: '/events', label: 'Events', icon: 'events' },
  { href: '/saved', label: 'Saved', icon: 'saved' },
  { href: '/bookings', label: 'Bookings', icon: 'bookings' },
];

export function SiteHeader({
  accountHref,
  accountLabel,
}: {
  accountHref: string;
  accountLabel: string;
}) {
  const pathname = usePathname();
  const onHome = pathname === '/';
  const [menuOpen, setMenuOpen] = useState(false);

  if (onHome) {
    return (
      <>
        <header className="pointer-events-none fixed inset-x-0 top-0 z-40 text-black">
          <div className="mx-auto flex h-16 max-w-[100rem] items-center justify-between px-4 sm:px-6 lg:px-10">
            <span className="pointer-events-auto inline-flex min-h-11 items-center rounded-full border border-black/15 bg-white px-3 text-[12px] font-bold">
              Around campus
            </span>
            <button
              type="button"
              aria-label="Open navigation menu"
              aria-expanded={menuOpen}
              onClick={() => setMenuOpen(true)}
              className="pointer-events-auto grid h-11 w-11 place-items-center rounded-full border border-white/35 bg-black text-white transition-transform active:scale-95"
            >
              <MenuIcon />
            </button>
          </div>
        </header>
        <HomeMenu
          open={menuOpen}
          onClose={() => setMenuOpen(false)}
          accountHref={accountHref}
          accountLabel={accountLabel}
        />
      </>
    );
  }

  return (
    <header className="border-border-hairline bg-canvas/95 sticky top-0 z-40 border-b backdrop-blur">
      <div className="mx-auto flex h-14 max-w-5xl items-center justify-between gap-4 px-4">
        <Link
          href="/"
          aria-label="Destiny home"
          className="font-display text-accent-primary text-xl font-extrabold"
        >
          Destiny
        </Link>

        <nav
          aria-label="Primary navigation"
          className="hidden items-center gap-1 sm:flex"
        >
          {tabs.slice(1).map((tab) => (
            <NavLink
              key={tab.href}
              href={tab.href}
              label={tab.label}
              onHome={onHome}
            />
          ))}
          <NavLink href="/friends" label="Friends" onHome={onHome} />
        </nav>

        <Link
          href={accountHref}
          className={cn(
            'inline-flex items-center justify-center font-semibold',
            accountLabel === 'Log in'
              ? 'rounded-control bg-accent-primary text-ink-on-primary min-h-9 px-3.5 py-1.5 text-[13px]'
              : 'rounded-chip border-border-hairline bg-surface-raised text-paper min-h-9 border px-3 py-1.5 text-[13px]',
          )}
        >
          {accountLabel}
        </Link>
      </div>
    </header>
  );
}

function HomeMenu({
  open,
  onClose,
  accountHref,
  accountLabel,
}: {
  open: boolean;
  onClose: () => void;
  accountHref: string;
  accountLabel: string;
}) {
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  return (
    <dialog
      ref={dialogRef}
      onClose={onClose}
      onClick={(event) => {
        if (event.target === dialogRef.current) onClose();
      }}
      className="fixed inset-y-0 right-0 m-0 ml-auto h-dvh w-[min(22rem,88vw)] max-w-none border-0 bg-black p-0 text-white shadow-2xl backdrop:bg-black/55"
    >
      <div className="flex min-h-full flex-col p-5 pt-[max(1.25rem,env(safe-area-inset-top))]">
        <div className="flex items-center justify-between border-b border-white/15 pb-5">
          <span className="text-lg font-bold">Menu</span>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close navigation menu"
            className="grid h-11 w-11 place-items-center rounded-full border border-white/20 text-white hover:bg-white hover:text-black"
          >
            <CloseIcon />
          </button>
        </div>

        <nav aria-label="Homepage navigation" className="grid py-4">
          {[
            ['/', 'Home'],
            ['/search', 'Search restaurants'],
            ['/events', 'Events'],
            ['/saved', 'Saved'],
            ['/bookings', 'Bookings'],
            ['/friends', 'Friends'],
          ].map(([href, label]) => (
            <Link
              key={href}
              href={href}
              className="flex min-h-12 items-center justify-between border-b border-white/10 text-[15px] font-semibold hover:text-[#25CBB5]"
            >
              {label}
              <MenuArrowIcon />
            </Link>
          ))}
        </nav>

        <Link
          href={accountHref}
          className="mt-auto inline-flex min-h-12 items-center justify-center rounded-full border border-[#00B89C] bg-[#00B89C] px-5 font-bold text-black hover:bg-white"
        >
          {accountLabel === 'Log in' ? 'Log in' : `Open ${accountLabel}`}
        </Link>
      </div>
    </dialog>
  );
}

function NavLink({
  href,
  label,
  onHome,
}: {
  href: string;
  label: string;
  onHome: boolean;
}) {
  const pathname = usePathname();
  const active =
    pathname === href || (href !== '/' && pathname.startsWith(href));
  return (
    <Link
      href={href}
      aria-current={active ? 'page' : undefined}
      className={cn(
        'px-3 py-1.5 text-sm transition-colors',
        onHome
          ? cn(
              'rounded-full text-black hover:bg-black hover:text-white',
              active && 'bg-black text-white',
            )
          : cn(
              'rounded-control',
              active
                ? 'bg-surface-raised text-paper'
                : 'text-text-muted hover:text-paper',
            ),
      )}
    >
      {label}
    </Link>
  );
}

/** Mobile bottom tab bar — this is a phone product first (build plan §1). */
export function MobileTabBar() {
  const pathname = usePathname();
  const onHome = pathname === '/';
  if (onHome) return null;
  return (
    <nav
      aria-label="Mobile navigation"
      className={cn(
        'fixed inset-x-0 bottom-0 z-40 border-t pb-[env(safe-area-inset-bottom)]',
        onHome
          ? 'border-white/15 bg-black/95 text-white backdrop-blur lg:hidden'
          : 'border-border-hairline bg-surface-muted sm:hidden',
      )}
    >
      <div className="flex">
        {tabs.map((tab) => {
          const active =
            pathname === tab.href ||
            (tab.href !== '/' && pathname.startsWith(tab.href));
          return (
            <Link
              key={tab.href}
              href={tab.href}
              aria-current={active ? 'page' : undefined}
              className={cn(
                'flex min-h-14 flex-1 flex-col items-center justify-center gap-0.5 py-1.5 text-[10px]',
                onHome
                  ? active
                    ? 'text-[#00B89C]'
                    : 'text-[#E6FAF6]'
                  : active
                    ? 'text-accent-primary'
                    : 'text-text-muted',
              )}
            >
              <NavIcon name={tab.icon} />
              {tab.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

function MenuIcon() {
  return (
    <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden>
      <path
        d="M4 7h16M4 12h16M4 17h16"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden>
      <path
        d="m6 6 12 12M18 6 6 18"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  );
}

function MenuArrowIcon() {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden>
      <path
        d="M5 12h14M13 6l6 6-6 6"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function NavIcon({ name }: { name: NavIconName }) {
  const common = {
    viewBox: '0 0 24 24',
    width: 19,
    height: 19,
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 1.8,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
    'aria-hidden': true,
  };

  if (name === 'home') {
    return (
      <svg {...common}>
        <path d="m3.5 10.5 8.5-7 8.5 7" />
        <path d="M5.5 9.5V21h13V9.5M9.5 21v-6h5v6" />
      </svg>
    );
  }
  if (name === 'search') {
    return (
      <svg {...common}>
        <circle cx="10.5" cy="10.5" r="6.5" />
        <path d="m15.5 15.5 5 5" />
      </svg>
    );
  }
  if (name === 'events') {
    return (
      <svg {...common}>
        <rect x="3" y="5" width="18" height="16" rx="2" />
        <path d="M16 3v4M8 3v4M3 10h18" />
      </svg>
    );
  }
  if (name === 'saved') {
    return (
      <svg {...common}>
        <path d="M6.5 4.5A1.5 1.5 0 0 1 8 3h8a1.5 1.5 0 0 1 1.5 1.5V21L12 17.8 6.5 21V4.5Z" />
      </svg>
    );
  }
  return (
    <svg {...common}>
      <path d="M7 3v5M4.5 3v3.5A2.5 2.5 0 0 0 7 9v12M9.5 3v3.5A2.5 2.5 0 0 1 7 9M16 3v18M16 3c3 1.6 4.5 4 4.5 7.2H16" />
    </svg>
  );
}
