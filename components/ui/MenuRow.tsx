import { cn } from '@/lib/cn';
import { VegMark } from './VegMark';

export function MenuRow({
  name,
  price,
  isVeg,
  unavailable = false,
  appearance = 'default',
  className,
}: {
  name: string;
  price: number;
  isVeg: boolean;
  unavailable?: boolean;
  appearance?: 'default' | 'destiny';
  className?: string;
}) {
  const destiny = appearance === 'destiny';

  return (
    <div
      className={cn(
        'flex items-baseline gap-2',
        destiny ? 'min-h-12 border-b border-black/10 py-3' : 'py-1.5',
        unavailable && 'opacity-40',
        className,
      )}
    >
      <VegMark isVeg={isVeg} className="self-center" />
      <span className={cn('text-sm', destiny ? 'text-black' : 'text-paper')}>
        {name}
        {unavailable && (
          <span
            className={cn(
              'ml-2 text-[11px]',
              destiny ? 'text-[#8A8A8A]' : 'text-text-muted',
            )}
          >
            sold out
          </span>
        )}
      </span>
      {!destiny && (
        <span
          aria-hidden
          className="border-border-hairline mx-1 flex-1 border-b border-dotted"
        />
      )}
      <span
        className={cn(
          'ml-auto text-sm font-bold tabular-nums',
          destiny ? 'text-black' : 'text-paper font-mono',
        )}
      >
        ₹{price}
      </span>
    </div>
  );
}
