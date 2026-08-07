import { cn } from '@/lib/cn';

export function Skeleton({ className }: { className?: string }) {
  return (
    <div
      aria-hidden
      className={cn(
        'rounded-control bg-surface-raised animate-pulse',
        className,
      )}
    />
  );
}
