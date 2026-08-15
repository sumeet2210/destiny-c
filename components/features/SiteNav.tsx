'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { cn } from '@/lib/cn';

type NavIconName = 'home' | 'events' | 'others';

const tabs: ReadonlyArray<{
  href: string;
  label: string;
  icon: NavIconName;
}> = [
  { href: '/', label: 'Home', icon: 'home' },
  { href: '/events', label: 'Events', icon: 'events' },
  { href: '/others', label: 'Others', icon: 'others' },
];

const menuLinks = [
  ['/', 'Home'],
  ['/search', 'Search restaurants'],
  ['/events', 'Events'],
  ['/saved', 'Saved'],
  ['/bookings', 'Bookings'],
  ['/friends', 'Friends'],
  ['/others', 'More'],
] as const;

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
          <div className="mx-auto flex h-14 max-w-[100rem] items-start justify-end px-3 pt-2 sm:px-5 lg:px-8">
            <button
              type="button"
              aria-label="Open navigation menu"
              aria-expanded={menuOpen}
              onClick={() => setMenuOpen(true)}
              className="pointer-events-auto grid h-10 w-10 place-items-center rounded-full border border-[#505050] bg-black text-white transition-transform focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1DB954] active:scale-95"
            >
              <MenuIcon />
            </button>
          </div>
        </header>
        <NavigationMenu
          open={menuOpen}
          onClose={() => setMenuOpen(false)}
          accountHref={accountHref}
          accountLabel={accountLabel}
        />
      </>
    );
  }

  return (
    <>
      <header
        className="sticky top-0 z-40 border-b border-[#505050] bg-[#EDEDED] text-black"
        style={{ fontFamily: 'var(--font-destiny), Manrope, sans-serif' }}
      >
        <div className="mx-auto flex h-16 max-w-[100rem] items-center justify-between gap-4 px-4 sm:px-6 lg:px-10">
          <Wordmark />

          <nav
            aria-label="Primary navigation"
            className="hidden items-center gap-1 rounded-full border border-[#505050] bg-white p-1 lg:flex"
          >
            {tabs.slice(1).map((tab) => (
              <NavLink key={tab.href} href={tab.href} label={tab.label} />
            ))}
            <NavLink href="/friends" label="Friends" />
          </nav>

          <Link
            href={accountHref}
            className="hidden min-h-11 items-center justify-center rounded-full border border-[#1DB954] bg-[#1DB954] px-4 text-[13px] font-extrabold text-black transition-colors hover:border-[#1DB954] hover:bg-black hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1DB954] lg:inline-flex"
          >
            {accountLabel}
          </Link>

          <button
            type="button"
            aria-label="Open navigation menu"
            aria-expanded={menuOpen}
            onClick={() => setMenuOpen(true)}
            className="grid h-11 w-11 place-items-center rounded-full bg-black text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1DB954] lg:hidden"
          >
            <MenuIcon />
          </button>
        </div>
      </header>
      <NavigationMenu
        open={menuOpen}
        onClose={() => setMenuOpen(false)}
        accountHref={accountHref}
        accountLabel={accountLabel}
      />
    </>
  );
}

function Wordmark() {
  return (
    <Link
      href="/"
      aria-label="Destiny home"
      className="relative block h-11 w-28 overflow-hidden focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1DB954]"
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/brand/destiny-wordmark.png"
        alt="Destiny"
        className="absolute top-1/2 left-1/2 w-28 max-w-none -translate-x-1/2 -translate-y-1/2"
      />
    </Link>
  );
}

function NavigationMenu({
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
  const pathname = usePathname();
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
      style={{ fontFamily: 'var(--font-destiny), Manrope, sans-serif' }}
    >
      <div className="flex min-h-full flex-col p-5 pt-[max(1.25rem,env(safe-area-inset-top))]">
        <div className="flex items-center justify-between border-b border-[#505050] pb-5">
          <span className="text-lg font-bold">Menu</span>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close navigation menu"
            className="grid h-11 w-11 place-items-center rounded-full border border-[#505050] text-white hover:bg-white hover:text-black focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1DB954]"
          >
            <CloseIcon />
          </button>
        </div>

        <nav aria-label="Site navigation" className="grid py-4">
          {menuLinks.map(([href, label]) => {
            const active =
              pathname === href || (href !== '/' && pathname.startsWith(href));
            return (
              <Link
                key={href}
                href={href}
                aria-current={active ? 'page' : undefined}
                onClick={onClose}
                className={cn(
                  'flex min-h-12 items-center justify-between border-b border-[#505050] text-[15px] font-semibold focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1DB954]',
                  active ? 'text-[#1DB954]' : 'text-white hover:text-[#1DB954]',
                )}
              >
                {label}
                <MenuArrowIcon />
              </Link>
            );
          })}
        </nav>

        <Link
          href={accountHref}
          onClick={onClose}
          className="mt-auto inline-flex min-h-12 items-center justify-center rounded-full border border-[#1DB954] bg-[#1DB954] px-5 font-bold text-black hover:bg-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1DB954]"
        >
          {accountLabel === 'Log in' ? 'Log in' : `Open ${accountLabel}`}
        </Link>
      </div>
    </dialog>
  );
}

function NavLink({ href, label }: { href: string; label: string }) {
  const pathname = usePathname();
  const active = pathname === href || pathname.startsWith(`${href}/`);
  return (
    <Link
      href={href}
      aria-current={active ? 'page' : undefined}
      className={cn(
        'inline-flex min-h-10 items-center rounded-full px-3 text-[13px] font-bold transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1DB954]',
        active ? 'bg-black text-white' : 'text-black hover:bg-[#EDEDED]',
      )}
    >
      {label}
    </Link>
  );
}

export function MobileTabBar() {
  const pathname = usePathname();

  return (
    <nav
      aria-label="Primary app navigation"
      className="fixed inset-x-0 bottom-0 z-40 border-t border-[#505050] bg-black/95 pb-[env(safe-area-inset-bottom)] text-white shadow-[0_-0.75rem_2.5rem_rgba(43,43,43,0.34)] backdrop-blur-xl"
      style={{ fontFamily: 'var(--font-destiny), Manrope, sans-serif' }}
    >
      <div className="mx-auto flex max-w-[38rem] px-2">
        {tabs.map((tab) => {
          const active = isTabActive(pathname, tab.href);
          return (
            <Link
              key={tab.href}
              href={tab.href}
              aria-current={active ? 'page' : undefined}
              className={cn(
                'focus-visible:outline-inset flex min-h-[4.25rem] flex-1 flex-col items-center justify-center gap-0.5 py-1.5 text-[10px] font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-[#1DB954]',
                active ? 'text-[#1DB954]' : 'text-[#8A8A8A] hover:text-white',
              )}
            >
              <span
                className={cn(
                  'grid h-7 min-w-10 place-items-center rounded-full px-2 transition-colors',
                  active && 'bg-[#1DB954]/15',
                )}
              >
                <NavIcon name={tab.icon} />
              </span>
              <span className={active ? 'font-extrabold' : undefined}>
                {tab.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

function isTabActive(pathname: string, href: string) {
  if (href === '/') {
    return (
      ['/discover', '/search', '/quiz', '/restaurant'].some(
        (route) => pathname === route || pathname.startsWith(`${route}/`),
      ) || pathname === '/'
    );
  }
  if (href === '/events') {
    return pathname === '/events' || pathname.startsWith('/events/');
  }
  return [
    '/others',
    '/saved',
    '/bookings',
    '/friends',
    '/account',
    '/login',
    '/owner',
  ].some((route) => pathname === route || pathname.startsWith(`${route}/`));
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
  if (name === 'events') {
    return (
      <svg {...common}>
        <rect x="3" y="5" width="18" height="16" rx="2" />
        <path d="M16 3v4M8 3v4M3 10h18" />
      </svg>
    );
  }
  return (
    <svg {...common}>
      <circle cx="6" cy="6" r="1.5" />
      <circle cx="18" cy="6" r="1.5" />
      <circle cx="6" cy="18" r="1.5" />
      <circle cx="18" cy="18" r="1.5" />
    </svg>
  );
}
