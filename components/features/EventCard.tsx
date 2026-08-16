import Link from 'next/link';
import { EVENT_TYPES, type EventTypeKey } from '@/config/events';
import { Card } from '@/components/ui/Card';
import { cn } from '@/lib/cn';

const typeMeta = (key: string) =>
  EVENT_TYPES.find((t) => t.key === (key as EventTypeKey)) ??
  EVENT_TYPES[EVENT_TYPES.length - 1];

const IST = 'Asia/Kolkata';

function dateParts(iso: string) {
  const d = new Date(iso);
  return {
    day: d.toLocaleDateString('en-IN', { day: 'numeric', timeZone: IST }),
    month: d.toLocaleDateString('en-IN', { month: 'short', timeZone: IST }),
    weekday: d.toLocaleDateString('en-IN', { weekday: 'short', timeZone: IST }),
    time: d.toLocaleTimeString('en-IN', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
      timeZone: IST,
    }),
  };
}

/**
 * Event card: type icon, tear-off date block, time, RSVP slot (design.md §4).
 */
export function EventCard({
  title,
  eventType,
  startsAt,
  restaurantName,
  restaurantId,
  description,
  rsvpSlot,
  className,
}: {
  title: string;
  eventType: string;
  startsAt: string;
  restaurantName?: string;
  restaurantId?: string;
  description?: string | null;
  rsvpSlot?: React.ReactNode;
  className?: string;
}) {
  const meta = typeMeta(eventType);
  const { day, month, weekday, time } = dateParts(startsAt);

  return (
    <Card className={cn('event-card flex gap-4', className)}>
      {/* Tear-off calendar date block, carried over from the prototype. */}
      <div className="rounded-control border-border-hairline bg-surface-raised flex h-fit shrink-0 flex-col items-center border px-3 py-2">
        <span className="text-text-muted text-[11px] tracking-wide uppercase">
          {month}
        </span>
        <span className="text-paper font-mono text-xl font-bold">{day}</span>
        <span className="text-text-muted text-[11px]">{weekday}</span>
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-text-muted text-[12px]">
          {meta.label}
          <span aria-hidden> · </span>
          <span className="font-mono">{time}</span>
        </p>
        <h3 className="font-display text-paper mt-0.5 truncate text-base font-bold">
          {title}
        </h3>
        {restaurantName &&
          (restaurantId ? (
            <Link
              href={`/restaurant/${restaurantId}`}
              className="text-text-muted text-[13px] underline-offset-2 hover:underline"
            >
              at {restaurantName}
            </Link>
          ) : (
            <p className="text-text-muted text-[13px]">at {restaurantName}</p>
          ))}
        {description && (
          <p className="text-text-muted mt-1 line-clamp-2 text-[13px]">
            {description}
          </p>
        )}
        {rsvpSlot && <div className="mt-2">{rsvpSlot}</div>}
      </div>
    </Card>
  );
}
