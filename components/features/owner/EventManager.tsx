'use client';

import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';
import { EVENT_TYPES } from '@/config/events';
import { Button } from '@/components/ui/Button';
import { Sheet } from '@/components/ui/Sheet';
import { Input, Label, Select, Textarea } from '@/components/ui/Input';
import { useToast } from '@/components/ui/Toast';
import { resizeToWebp } from '@/components/features/owner/PhotoManager';
import { uploadPromotionImage, upsertEvent } from '@/lib/owner/actions';

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
  cover_image_url: string | null;
};

const toLocalInput = (iso: string | null) => {
  if (!iso) return '';
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

const localDate = (iso: string | null) => toLocalInput(iso).slice(0, 10);
const localTime = (iso: string | null) => toLocalInput(iso).slice(11, 16);

export function EventManager({ events }: { events: OwnerEvent[] }) {
  const router = useRouter();
  const [editing, setEditing] = useState<Partial<OwnerEvent> | null>(null);
  const [mountedAt] = useState(() => Date.now());
  const [pending, startTransition] = useTransition();
  const toast = useToast();
  const publishLimit = new Date(mountedAt + 15 * 24 * 60 * 60 * 1000);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <p className="text-text-muted text-sm">
          <span className="text-paper font-mono font-semibold">
            {events.length}
          </span>{' '}
          total
        </p>
        <Button className="min-h-11" onClick={() => setEditing({})}>
          New event
        </Button>
      </div>

      {events.length === 0 && (
        <div className="border-border-hairline rounded-card border border-dashed px-4 py-8 text-center">
          <p className="text-paper text-sm font-semibold">No events yet</p>
          <p className="text-text-muted mx-auto mt-1 max-w-xs text-[13px] leading-5">
            Add the next screening, open mic, or special night when it is ready.
          </p>
        </div>
      )}

      {events.length > 0 && (
        <div className="grid gap-3">
          {events.map((e) => {
            const status = getEventStatus(e, mountedAt);
            return (
              <article
                key={e.id}
                className="border-border-hairline rounded-card overflow-hidden border bg-[#1a1a1a]"
              >
                <div className="flex min-w-0 flex-col gap-3 p-3 sm:flex-row">
                  {e.cover_image_url ? (
                    // eslint-disable-next-line @next/next/no-img-element -- owner uploads are resized before storage.
                    <img
                      src={e.cover_image_url}
                      alt=""
                      className="rounded-control h-32 w-full shrink-0 object-cover sm:h-28 sm:w-28"
                    />
                  ) : null}
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="text-accent-primary text-[10px] font-bold tracking-[0.08em] uppercase">
                          {eventTypeLabel(e.event_type)}
                        </p>
                        <h3 className="text-paper mt-0.5 text-sm leading-5 font-bold">
                          {e.title}
                        </h3>
                      </div>
                      <div className="-mt-2 -mr-2 flex shrink-0 items-center gap-1">
                        <span className={status.className}>{status.label}</span>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="min-h-11"
                          onClick={() => setEditing(e)}
                        >
                          Edit
                        </Button>
                      </div>
                    </div>
                    {e.description && (
                      <p className="text-text-muted mt-2 line-clamp-2 text-[12px] leading-5">
                        {e.description}
                      </p>
                    )}
                    <dl className="mt-2 grid grid-cols-2 gap-x-3 gap-y-1 text-[11px]">
                      <EventDetail
                        label="When"
                        value={formatOwnerDateTime(e.starts_at)}
                      />
                      <EventDetail
                        label="Entry"
                        value={formatEntryFee(e.entry_fee)}
                      />
                      {e.location_details ? (
                        <EventDetail
                          label="Location"
                          value={e.location_details}
                        />
                      ) : null}
                      {e.ends_at ? (
                        <EventDetail
                          label="Ends"
                          value={formatOwnerDateTime(e.ends_at)}
                        />
                      ) : null}
                    </dl>
                  </div>
                </div>
                <div className="border-border-hairline flex flex-wrap items-center justify-between gap-2 border-t px-3 py-2.5">
                  <div>
                    {e.ticket_url ? (
                      <a
                        href={e.ticket_url}
                        target="_blank"
                        rel="noreferrer"
                        className="text-text-muted text-[11px] font-semibold hover:text-white hover:underline"
                      >
                        Ticket link
                      </a>
                    ) : (
                      <span className="text-text-muted text-[11px]">
                        No ticket link
                      </span>
                    )}
                  </div>
                  {status.key === 'upcoming' || status.key === 'live' ? (
                    <Button
                      variant="urgent-text"
                      size="sm"
                      className="min-h-11"
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
                            res.ok
                              ? 'Event cancelled'
                              : (res.message ?? 'Failed'),
                            res.ok ? 'positive' : 'error',
                          );
                          if (res.ok) router.refresh();
                        })
                      }
                    >
                      Cancel event
                    </Button>
                  ) : null}
                </div>
              </article>
            );
          })}
        </div>
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
              const startDate = String(fd.get('start_date'));
              const startTime = String(fd.get('start_time'));
              const endDate = String(fd.get('end_date'));
              const endTime = String(fd.get('end_time'));
              const photo = fd.get('photo');
              const photoFile =
                photo instanceof File && photo.size > 0 ? photo : null;
              if (!editing.id && !photoFile) {
                toast('Add an event photo.', 'error');
                return;
              }
              if (Boolean(endDate) !== Boolean(endTime)) {
                toast('Choose both an end date and end time.', 'error');
                return;
              }
              startTransition(async () => {
                let coverImageUrl = editing.cover_image_url ?? null;
                if (photoFile) {
                  let upload;
                  try {
                    const blob = await resizeToWebp(photoFile);
                    const imageData = new FormData();
                    imageData.set(
                      'file',
                      new File([blob], 'event.webp', { type: 'image/webp' }),
                    );
                    upload = await uploadPromotionImage(imageData);
                  } catch {
                    toast('Could not process that image', 'error');
                    return;
                  }
                  if (!upload.ok || !upload.url) {
                    toast(upload.message ?? 'Could not upload photo', 'error');
                    return;
                  }
                  coverImageUrl = upload.url;
                }
                const res = await upsertEvent({
                  id: editing.id,
                  title: String(fd.get('title')),
                  description: String(fd.get('description') || ''),
                  event_type: String(fd.get('event_type')),
                  starts_at: new Date(
                    `${startDate}T${startTime}`,
                  ).toISOString(),
                  ends_at:
                    endDate && endTime
                      ? new Date(`${endDate}T${endTime}`).toISOString()
                      : null,
                  entry_fee: fd.get('entry_fee')
                    ? Number(fd.get('entry_fee'))
                    : null,
                  location_details: String(fd.get('location_details') || ''),
                  ticket_url: String(fd.get('ticket_url') || ''),
                  cover_image_url: coverImageUrl,
                });
                toast(
                  res.ok ? 'Event saved' : (res.message ?? 'Failed'),
                  res.ok ? 'positive' : 'error',
                );
                if (res.ok) {
                  setEditing(null);
                  router.refresh();
                }
              });
            }}
            className="space-y-4"
          >
            <div>
              <Label htmlFor="ev-photo">
                Event photo{editing.id ? ' (optional to replace)' : ''}
              </Label>
              <Input
                id="ev-photo"
                name="photo"
                type="file"
                accept="image/*"
                required={!editing.id}
              />
            </div>
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
                  min={
                    editing.id
                      ? undefined
                      : localDate(new Date(mountedAt).toISOString())
                  }
                  max={localDate(publishLimit.toISOString())}
                  className="font-mono"
                  defaultValue={localDate(editing.starts_at ?? null)}
                />
              </div>
              <div>
                <Label htmlFor="ev-end-date">End date (optional)</Label>
                <Input
                  id="ev-end-date"
                  name="end_date"
                  type="date"
                  className="font-mono"
                  defaultValue={localDate(editing.ends_at ?? null)}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="ev-start-time">Start time</Label>
                <Input
                  id="ev-start-time"
                  name="start_time"
                  type="time"
                  required
                  className="font-mono"
                  defaultValue={localTime(editing.starts_at ?? null)}
                />
              </div>
              <div>
                <Label htmlFor="ev-end-time">End time (optional)</Label>
                <Input
                  id="ev-end-time"
                  name="end_time"
                  type="time"
                  className="font-mono"
                  defaultValue={localTime(editing.ends_at ?? null)}
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
              {pending ? 'Saving…' : editing.id ? 'Save' : 'Publish event'}
            </Button>
          </form>
        )}
      </Sheet>
    </div>
  );
}

function EventDetail({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0">
      <dt className="text-text-muted">{label}</dt>
      <dd className="text-paper break-words">{value}</dd>
    </div>
  );
}

function formatEntryFee(value: number | null) {
  if (value === null) return 'Not specified';
  return value === 0 ? 'Free' : `₹${value}`;
}

function eventTypeLabel(value: string) {
  return EVENT_TYPES.find((type) => type.key === value)?.label ?? 'Event';
}

function formatOwnerDateTime(value: string) {
  return new Date(value).toLocaleString('en-IN', {
    day: 'numeric',
    month: 'short',
    hour: 'numeric',
    minute: '2-digit',
    timeZone: 'Asia/Kolkata',
  });
}

function getEventStatus(event: OwnerEvent, now: number) {
  const startsAt = new Date(event.starts_at).getTime();
  const endsAt = event.ends_at
    ? new Date(event.ends_at).getTime()
    : startsAt + 4 * 60 * 60 * 1000;
  const baseClass =
    'rounded-full border px-2 py-1 text-[10px] font-bold tracking-[0.08em] uppercase';

  if (event.is_cancelled) {
    return {
      key: 'cancelled' as const,
      label: 'Cancelled',
      className: `${baseClass} border-border-hairline text-text-muted`,
    };
  }
  if (endsAt <= now) {
    return {
      key: 'past' as const,
      label: 'Past',
      className: `${baseClass} border-border-hairline text-text-muted`,
    };
  }
  if (startsAt <= now) {
    return {
      key: 'live' as const,
      label: 'Live',
      className: `${baseClass} border-accent-primary/40 bg-accent-primary/8 text-accent-primary`,
    };
  }
  return {
    key: 'upcoming' as const,
    label: 'Upcoming',
    className: `${baseClass} border-border-hairline text-paper`,
  };
}
