import { cn } from '@/lib/cn';

type Variant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'urgent-text';
type Size = 'sm' | 'md' | 'lg';

const variants: Record<Variant, string> = {
  // The active page world supplies the semantic primary color.
  primary:
    'bg-accent-primary text-ink-on-primary font-semibold hover:brightness-105 disabled:hover:brightness-100',
  secondary:
    'bg-border-hairline text-paper font-semibold hover:brightness-110 disabled:hover:brightness-100',
  outline:
    'border border-border-hairline bg-transparent text-paper hover:bg-surface-raised',
  ghost: 'bg-transparent text-paper hover:bg-surface-raised',
  // Text-only destructive/urgent action.
  'urgent-text':
    'bg-transparent text-accent-urgent-text hover:bg-surface-raised',
};

const sizes: Record<Size, string> = {
  sm: 'h-8 px-3 text-[13px]',
  md: 'h-10 px-4 text-sm',
  lg: 'h-12 px-5 text-[15px]',
};

export function Button({
  variant = 'primary',
  size = 'md',
  className,
  ...rest
}: {
  variant?: Variant;
  size?: Size;
} & React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      data-ui-button
      data-variant={variant}
      className={cn(
        'rounded-control inline-flex items-center justify-center gap-2 transition-colors disabled:cursor-not-allowed disabled:opacity-40',
        variants[variant],
        sizes[size],
        className,
      )}
      {...rest}
    />
  );
}
