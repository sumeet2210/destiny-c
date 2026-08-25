'use client';

import { useState, useTransition } from 'react';
import { EVENT_TYPES } from '@/config/events';
import { Button } from '@/components/ui/Button';
import { Sheet } from '@/components/ui/Sheet';
import { Input, Label, Select, Textarea } from '@/components/ui/Input';
import { useToast } from '@/components/ui/Toast';
import { EventCard } from '@/components/features/EventCard';
import { upsertEvent } from '@/lib/owner/actions';

type OwnerEvent = {
  id: string;
  title: string;
  description: string | null;
  event_type: string;
  starts_at: string;
  ends_at: string | null;
  entry_fee: number | null;
  location_details: string | null;
  ticket_url: string | null;
  is_cancelled: boolean;
};

const toLocalInput = (iso: string | null) => {
  if (!iso) return '';
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

const toLocalDate = (iso: string | null) => toLocalInput(iso).split('T')[0];
const toLocalTime = (iso: string | null) =>
  toLocalInput(iso).split('T')[1] ?? '';

export function EventManager({ events }: { events: OwnerEvent[] }) {
  const [editing, setEditing] = useState<Partial<OwnerEvent> | null>(null);
  const [mountedAt] = useState(() => Date.now());
  const [pending, startTransition] = useTransition();
  const toast = useToast();
  const publishLimit = new Date(mountedAt + 15 * 24 * 60 * 60 * 1000);

  const upcoming = events.filter(
    (e) =>
      !e.is_cancelled &&
      new Date(e.starts_at).getTime() > mountedAt - 4 * 3_600_000,
  );
  const rest = events.filter((e) => !upcoming.includes(e));

  return (
    <div className="space-y-5">
      <Button onClick={() => setEditing({})}>+ Post an event</Button>
      <p className="text-text-muted text-[13px]">
        Events can be scheduled up to 15 days ahead.
      </p>

      {upcoming.length === 0 && (
        <p className="text-text-muted text-sm">No upcoming events.</p>
      )}

      {upcoming.map((e) => (
        <div key={e.id} className="space-y-1">
          <EventCard
            title={e.title}
            eventType={e.event_type}
            startsAt={e.starts_at}
            description={e.description}
          />
          <div className="flex gap-2">
            <Button variant="ghost" size="sm" onClick={() => setEditing(e)}>
              Edit
            </Button>
            <Button
              variant="urgent-text"
              size="sm"
              disabled={pending}
              onClick={() =>
                startTransition(async () => {
                  const res = await upsertEvent({
                    id: e.id,
                    title: e.title,
                    event_type: e.event_type,
                    starts_at: e.starts_at,
                    ends_at: e.ends_at,
                    description: e.description ?? undefined,
                    is_cancelled: true,
                  });
                  toast(
                    res.ok ? 'Event cancelled' : (res.message ?? 'Failed'),
                    res.ok ? 'positive' : 'error',
                  );
                })
              }
            >
              Cancel event
            </Button>
          </div>
        </div>
      ))}

      {rest.length > 0 && (
        <details className="text-text-muted text-sm">
          <summary className="cursor-pointer">
            Past &amp; cancelled ({rest.length})
          </summary>
          <ul className="mt-2 space-y-1 text-[13px]">
            {rest.map((e) => (
              <li key={e.id}>
                {e.title} — {new Date(e.starts_at).toLocaleDateString('en-IN')}
                {e.is_cancelled && ' (cancelled)'}
              </li>
            ))}
          </ul>
        </details>
      )}

      <Sheet
        open={editing !== null}
        onClose={() => setEditing(null)}
        title={editing?.id ? 'Edit event' : 'Post an event'}
      >
        {editing && (
          <form
            onSubmit={(ev) => {
              ev.preventDefault();
              const fd = new FormData(ev.currentTarget);
              const starts = `${String(fd.get('start_date'))}T${String(fd.get('start_time'))}`;
              const ends = `${String(fd.get('end_date'))}T${String(fd.get('end_time'))}`;
              startTransition(async () => {
                const res = await upsertEvent({
                  id: editing.id,
                  title: String(fd.get('title')),
                  description: String(fd.get('description') || ''),
                  event_type: String(fd.get('event_type')),
                  starts_at: new Date(starts).toISOString(),
                  ends_at: new Date(ends).toISOString(),
                  entry_fee: fd.get('entry_fee')
                    ? Number(fd.get('entry_fee'))
                    : null,
                  location_details: String(fd.get('location_details') || ''),
                  ticket_url: String(fd.get('ticket_url') || ''),
                });
                toast(
                  res.ok ? 'Event saved' : (res.message ?? 'Failed'),
                  res.ok ? 'positive' : 'error',
                );
                if (res.ok) setEditing(null);
              });
            }}
            className="space-y-4"
          >
            <div>
              <Label htmlFor="ev-title">Title</Label>
              <Input
                id="ev-title"
                name="title"
                required
                defaultValue={editing.title ?? ''}
              />
            </div>
            <div>
              <Label htmlFor="ev-type">Type</Label>
              <Select
                id="ev-type"
                name="event_type"
                defaultValue={editing.event_type ?? 'other'}
              >
                {EVENT_TYPES.map((t) => (
                  <option key={t.key} value={t.key}>
                    {t.label}
                  </option>
                ))}
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="ev-start-date">Start date</Label>
                <Input
                  id="ev-start-date"
                  name="start_date"
                  type="date"
                  required
                  min={toLocalDate(new Date(mountedAt).toISOString())}
                  max={toLocalDate(publishLimit.toISOString())}
                  className="font-mono"
                  defaultValue={toLocalDate(editing.starts_at ?? null)}
                />
              </div>
              <div>
                <Label htmlFor="ev-start-time">Start time</Label>
                <Input
                  id="ev-start-time"
                  name="start_time"
                  type="time"
                  required
                  className="font-mono"
                  defaultValue={toLocalTime(editing.starts_at ?? null)}
                />
              </div>
              <div>
                <Label htmlFor="ev-end-date">End date</Label>
                <Input
                  id="ev-end-date"
                  name="end_date"
                  type="date"
                  required
                  className="font-mono"
                  defaultValue={toLocalDate(editing.ends_at ?? null)}
                />
              </div>
              <div>
                <Label htmlFor="ev-end-time">End time</Label>
                <Input
                  id="ev-end-time"
                  name="end_time"
                  type="time"
                  required
                  className="font-mono"
                  defaultValue={toLocalTime(editing.ends_at ?? null)}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="ev-fee">Entry fee</Label>
                <Input
                  id="ev-fee"
                  name="entry_fee"
                  type="number"
                  min="0"
                  inputMode="numeric"
                  placeholder="0 for free"
                  defaultValue={editing.entry_fee ?? ''}
                />
              </div>
              <div>
                <Label htmlFor="ev-location">Location note</Label>
                <Input
                  id="ev-location"
                  name="location_details"
                  placeholder="Rooftop, first floor..."
                  defaultValue={editing.location_details ?? ''}
                />
              </div>
            </div>
            <div>
              <Label htmlFor="ev-ticket">Ticket link (optional)</Label>
              <Input
                id="ev-ticket"
                name="ticket_url"
                type="url"
                placeholder="https://"
                defaultValue={editing.ticket_url ?? ''}
              />
            </div>
            <div>
              <Label htmlFor="ev-desc">Description</Label>
              <Textarea
                id="ev-desc"
                name="description"
                defaultValue={editing.description ?? ''}
              />
            </div>
            <Button type="submit" disabled={pending} className="w-full">
              {pending ? 'Saving…' : 'Publish event'}
            </Button>
          </form>
        )}
      </Sheet>
    </div>
  );
}
