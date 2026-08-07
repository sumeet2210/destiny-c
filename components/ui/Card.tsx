import { cn } from '@/lib/cn';

/**
 * Card shell: surface-muted on canvas, 14px radius, 16px padding, no shadow,
 * no gradient — depth comes from the surface step alone (design.md §3).
 */
export function Card({
  className,
  children,
  ...rest
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        'rounded-card border-border-hairline bg-surface-muted border p-4',
        className,
      )}
      {...rest}
    >
      {children}
    </div>
  );
}

/** Media block that bleeds to the card edges (design.md §4). */
export function CardMedia({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div
      className={cn(
        'rounded-t-card -mx-4 -mt-4 mb-3 overflow-hidden',
        className,
      )}
    >
      {children}
    </div>
  );
}

/** Receipt-reference dashed rule above a card footer (design.md §4). */
export function CardFooter({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div
      className={cn(
        'border-border-hairline mt-3 border-t border-dashed pt-3',
        className,
      )}
    >
      {children}
    </div>
  );
}
