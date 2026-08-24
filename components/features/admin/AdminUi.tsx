import Link from 'next/link';
import { Card } from '@/components/ui/Card';
import { cn } from '@/lib/cn';

/** Titled block. Mirrors the heading rhythm the owner pages use. */
export function Section({
  title,
  subtitle,
  actions,
  children,
}: {
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section className="mb-8">
      <div className="mb-3 flex flex-wrap items-end justify-between gap-2">
        <div>
          <h2 className="font-display text-paper text-lg font-bold">{title}</h2>
          {subtitle ? (
            <p className="text-text-muted text-sm">{subtitle}</p>
          ) : null}
        </div>
        {actions}
      </div>
      {children}
    </section>
  );
}

/** Single count. `tone="urgent"` marks the numbers that need someone to act. */
export function Stat({
  label,
  value,
  tone = 'default',
  href,
}: {
  label: string;
  value: number;
  tone?: 'default' | 'urgent';
  href?: string;
}) {
  const body = (
    <>
      <div
        className={cn(
          'font-display text-2xl font-extrabold',
          tone === 'urgent' && value > 0
            ? 'text-accent-urgent-text'
            : 'text-paper',
        )}
      >
        {value}
      </div>
      <div className="text-text-muted text-xs">{label}</div>
    </>
  );
  const className =
    'rounded-card border-border-hairline bg-surface-muted border p-3';
  return href ? (
    <Link
      href={href}
      className={cn(className, 'hover:bg-surface-raised block')}
    >
      {body}
    </Link>
  ) : (
    <div className={className}>{body}</div>
  );
}

/**
 * Chip-shaped link. The filter state lives in the URL rather than in component
 * state so the lists stay Server Components — Chip itself is a <button>, which
 * would force the whole filter row into the client.
 */
export function FilterLink({
  href,
  active,
  children,
}: {
  href: string;
  active: boolean;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      aria-current={active ? 'page' : undefined}
      className={cn(
        'rounded-chip inline-flex shrink-0 items-center gap-1.5 border px-3.5 py-1.5 text-[13px] font-medium transition-colors',
        active
          ? 'border-accent-primary bg-accent-primary text-ink-on-primary'
          : 'border-border-hairline bg-surface-raised text-paper hover:brightness-110',
      )}
    >
      {children}
    </Link>
  );
}

const STATUS_TONE: Record<string, string> = {
  active: 'text-accent-primary',
  pending_approval: 'text-accent-urgent-text',
  suspended: 'text-text-muted',
};

export function StatusPill({ status }: { status: string }) {
  return (
    <span
      className={cn(
        'rounded-chip border-border-hairline border px-2 py-0.5 text-xs',
        STATUS_TONE[status] ?? 'text-paper',
      )}
    >
      {status.replace(/_/g, ' ')}
    </span>
  );
}

/** Seed mode: no Supabase project, so nothing to administer. */
export function NotConfigured() {
  return (
    <Card>
      <p className="text-text-muted text-sm">
        The admin console needs a live Supabase project. Set{' '}
        <code>NEXT_PUBLIC_SUPABASE_URL</code> and{' '}
        <code>SUPABASE_SECRET_KEY</code> to use it.
      </p>
    </Card>
  );
}

export function Empty({ children }: { children: React.ReactNode }) {
  return (
    <Card>
      <p className="text-text-muted text-sm">{children}</p>
    </Card>
  );
}
