import { cn } from '@/lib/cn';
import { VegMark } from './VegMark';

/**
 * Receipt-style menu row: veg square, name left, dotted leader, mono price
 * right. The leader is the point of the layout — don't collapse it into a
 * plain flex row (design.md §4).
 */
export function MenuRow({
  name,
  price,
  isVeg,
  unavailable = false,
  className,
}: {
  name: string;
  price: number;
  isVeg: boolean;
  unavailable?: boolean;
  className?: string;
}) {
  return (
    <div
      className={cn(
        'flex items-baseline gap-2 py-1.5',
        unavailable && 'opacity-40',
        className,
      )}
    >
      <VegMark isVeg={isVeg} className="self-center" />
      <span className="text-paper text-sm">
        {name}
        {unavailable && (
          <span className="text-text-muted ml-2 text-[11px]">sold out</span>
        )}
      </span>
      <span
        aria-hidden
        className="border-border-hairline mx-1 flex-1 border-b border-dotted"
      />
      <span className="text-paper font-mono text-sm">₹{price}</span>
    </div>
  );
}
