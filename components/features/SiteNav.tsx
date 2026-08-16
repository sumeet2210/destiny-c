'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { cn } from '@/lib/cn';
import styles from './site-nav.module.css';

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

export function SiteHeader({
  accountHref,
  accountLabel,
}: {
  accountHref: string;
  accountLabel: string;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const onHome = pathname === '/';
  const onOthers = pathname === '/others' || pathname.startsWith('/others/');
  const onToolboxChild = ['/saved', '/bookings'].some(
    (route) => pathname === route || pathname.startsWith(`${route}/`),
  );
  const toolboxOpen = onOthers || onToolboxChild;
  const [menuOpen, setMenuOpen] = useState(toolboxOpen);
  const menuNavigationTimerRef = useRef<number | null>(null);

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => setMenuOpen(toolboxOpen));
    return () => window.cancelAnimationFrame(frame);
  }, [toolboxOpen]);

  useEffect(
    () => () => {
      if (menuNavigationTimerRef.current !== null) {
        window.clearTimeout(menuNavigationTimerRef.current);
      }
    },
    [],
  );

  const toggleMorePage = () => {
    if (onToolboxChild) {
      router.push('/others');
      return;
    }

    const nextOpen = !onOthers;
    setMenuOpen(nextOpen);

    if (menuNavigationTimerRef.current !== null) {
      window.clearTimeout(menuNavigationTimerRef.current);
    }

    menuNavigationTimerRef.current = window.setTimeout(() => {
      router.push(nextOpen ? '/others' : '/');
      menuNavigationTimerRef.current = null;
    }, 120);
  };

  if (onHome) {
    return (
      <header className="pointer-events-none fixed inset-x-0 top-0 z-40 text-black">
        <div className="mx-auto flex h-24 max-w-[100rem] items-start justify-end px-3 pt-10 sm:px-5 sm:pt-12 lg:px-8">
          <button
            type="button"
            aria-label="Open more options"
            aria-expanded={menuOpen}
            onClick={toggleMorePage}
            className={cn(
              menuOpen && styles.open,
              'pointer-events-auto grid h-10 w-10 place-items-center rounded-full border border-[#505050] bg-black text-white transition-transform focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1DB954] active:scale-95',
            )}
          >
            <AnimatedMenuIcon />
          </button>
        </div>
      </header>
    );
  }

  if (toolboxOpen) {
    return (
      <header className="pointer-events-none fixed inset-x-0 top-0 z-40 text-black">
        <div className="mx-auto flex h-14 max-w-[100rem] items-start justify-end px-3 pt-2 sm:px-5 lg:px-8">
          <button
            type="button"
            aria-label={
              onToolboxChild ? 'Close toolbox page' : 'Close Destiny Toolbox'
            }
            aria-expanded={menuOpen}
            onClick={toggleMorePage}
            className={cn(
              menuOpen && styles.open,
              'pointer-events-auto grid h-10 w-10 place-items-center rounded-full border border-[#505050] bg-black text-white transition-transform focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1DB954] active:scale-95',
            )}
          >
            <AnimatedMenuIcon />
          </button>
        </div>
      </header>
    );
  }

  return (
    <header
      className="sticky top-0 z-40 border-b border-[#505050] bg-[#EDEDED] text-black"
      style={{ fontFamily: 'var(--font-body)' }}
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
          aria-label="Open more options"
          aria-expanded={menuOpen}
          onClick={toggleMorePage}
          className={cn(
            menuOpen && styles.open,
            'grid h-11 w-11 place-items-center rounded-full bg-black text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1DB954] lg:hidden',
          )}
        >
          <AnimatedMenuIcon />
        </button>
      </div>
    </header>
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
  const [hidden, setHidden] = useState(false);
  const lastScrollYRef = useRef(0);
  const frameRef = useRef<number | null>(null);
  const activeIndex = Math.max(
    0,
    tabs.findIndex((tab) => isTabActive(pathname, tab.href)),
  );

  useEffect(() => {
    lastScrollYRef.current = window.scrollY;

    const onScroll = () => {
      if (frameRef.current !== null) return;

      frameRef.current = window.requestAnimationFrame(() => {
        frameRef.current = null;
        const currentY = Math.max(0, window.scrollY);

        if (currentY <= 80) {
          lastScrollYRef.current = currentY;
          setHidden(false);
          return;
        }

        const delta = currentY - lastScrollYRef.current;
        if (Math.abs(delta) < 10) return;

        setHidden(delta > 0);
        lastScrollYRef.current = currentY;
      });
    };

    window.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', onScroll);
      if (frameRef.current !== null) {
        window.cancelAnimationFrame(frameRef.current);
      }
    };
  }, []);

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      setHidden(false);
      lastScrollYRef.current = window.scrollY;
    });
    return () => window.cancelAnimationFrame(frame);
  }, [pathname]);

  return (
    <nav
      aria-label="Primary app navigation"
      aria-hidden={hidden || undefined}
      inert={hidden ? true : undefined}
      className={cn(
        'fixed bottom-[calc(1rem_+_env(safe-area-inset-bottom))] left-1/2 z-40 w-[calc(100%_-_2rem)] max-w-[22.5rem] -translate-x-1/2 rounded-[20px] border border-white/15 bg-[#101010]/92 p-2 text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.07),0_16px_42px_rgba(0,0,0,0.48),0_3px_10px_rgba(0,0,0,0.34)] backdrop-blur-[18px] transition-[transform,opacity] will-change-[transform,opacity]',
        hidden
          ? 'pointer-events-none translate-y-[130%] opacity-0 duration-[600ms] ease-[cubic-bezier(0.22,0.7,0.2,1)]'
          : 'translate-y-0 opacity-100 duration-[650ms] ease-[cubic-bezier(0.16,1,0.3,1)]',
      )}
      style={{ fontFamily: 'var(--font-body)' }}
    >
      <div className="relative grid grid-cols-3">
        <div
          aria-hidden
          className="pointer-events-none absolute top-0 left-0 flex h-9 w-1/3 justify-center transition-transform duration-300 ease-[cubic-bezier(0.2,0.85,0.25,1.1)]"
          style={{ transform: `translateX(${activeIndex * 100}%)` }}
        >
          <span className="h-9 w-12 rounded-[12px] bg-[#1DB954] shadow-[inset_0_1px_0_rgba(255,255,255,0.28),0_5px_16px_rgba(29,185,84,0.3)]" />
        </div>

        {tabs.map((tab) => {
          const active = isTabActive(pathname, tab.href);
          return (
            <Link
              key={tab.href}
              href={tab.href}
              aria-current={active ? 'page' : undefined}
              className={cn(
                'group focus-visible:outline-inset relative z-10 flex min-h-[4.1rem] flex-col items-center justify-start gap-1 rounded-[14px] pt-0 pb-1 text-[11px] transition-transform duration-200 focus-visible:outline-2 focus-visible:outline-[#1DB954] active:scale-[0.97]',
              )}
            >
              <span
                className={cn(
                  'grid h-9 min-w-12 place-items-center px-2 transition-colors duration-200',
                  active
                    ? 'text-[#101010]'
                    : 'text-[#8A8A8A] group-hover:text-white',
                )}
              >
                <NavIcon name={tab.icon} />
              </span>
              <span
                className={cn(
                  'leading-none tracking-[-0.01em] transition-colors duration-200',
                  active
                    ? 'font-extrabold text-[#1DB954]'
                    : 'font-semibold text-[#8A8A8A] group-hover:text-white',
                )}
              >
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

function AnimatedMenuIcon() {
  return (
    <span className={styles.menuGlyph} aria-hidden>
      <span />
      <span />
      <span />
    </span>
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
