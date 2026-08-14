import { cn } from '@/lib/cn';

/** Flat content surface; color and radius come from the active page world. */
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

/** Media block that bleeds to the card edges. */
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

/** Optional separated card footer. */
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
