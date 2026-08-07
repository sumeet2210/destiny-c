import { cn } from '@/lib/cn';

type ChipProps = {
  active?: boolean;
  disabled?: boolean;
} & React.ButtonHTMLAttributes<HTMLButtonElement>;

/**
 * Pill chip. surface-raised + hairline at rest, turmeric fill when active —
 * one active state, one color (design.md §4).
 */
export function Chip({
  active = false,
  disabled,
  className,
  children,
  ...rest
}: ChipProps) {
  return (
    <button
      type="button"
      disabled={disabled}
      aria-pressed={active}
      className={cn(
        'rounded-chip inline-flex shrink-0 items-center gap-1.5 border px-3.5 py-1.5 text-[13px] font-medium transition-colors',
        active
          ? 'border-accent-primary bg-accent-primary text-ink-on-primary'
          : 'border-border-hairline bg-surface-raised text-paper',
        disabled && 'cursor-not-allowed opacity-40',
        className,
      )}
      {...rest}
    >
      {children}
    </button>
  );
}
