import { cn } from '@/lib/cn';

/**
 * Veg/non-veg indicator — never colour alone: square outline plus a filled
 * dot (veg) or triangle (non-veg), so it survives greyscale (design.md §6).
 */
export function VegMark({
  isVeg,
  className,
}: {
  isVeg: boolean;
  className?: string;
}) {
  return (
    <span
      role="img"
      aria-label={isVeg ? 'Vegetarian' : 'Non-vegetarian'}
      className={cn(
        'inline-flex size-3.5 shrink-0 items-center justify-center border',
        isVeg ? 'border-accent-secondary' : 'border-nonveg',
        className,
      )}
    >
      {isVeg ? (
        <span className="bg-accent-secondary size-1.5 rounded-full" />
      ) : (
        <span
          className="border-b-nonveg size-0 border-x-4 border-b-[7px] border-x-transparent"
          style={{ transform: 'translateY(-0.5px)' }}
        />
      )}
    </span>
  );
}
