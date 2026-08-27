'use client';

import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';
import { EVENT_TYPES } from '@/config/events';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
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

      {upcoming.length > 0 && (
        <div className="grid gap-3 xl:grid-cols-2">
          {upcoming.map((e) => (
            <Card key={e.id} className="p-3">
              <div className="flex flex-col gap-3 sm:flex-row">
                {e.cover_image_url ? (
                  // eslint-disable-next-line @next/next/no-img-element -- owner uploads are resized before storage.
                  <img
                    src={e.cover_image_url}
                    alt=""
                    className="rounded-control h-28 w-full shrink-0 object-cover sm:w-32"
                  />
                ) : null}
                <div className="min-w-0 flex-1 space-y-2">
                  <div>
                    <p className="text-accent-primary text-[10px] font-extrabold tracking-[0.08em] uppercase">
                      {eventTypeLabel(e.event_type)}
                    </p>
                    <h3 className="text-paper mt-0.5 text-sm font-bold">
                      {e.title}
                    </h3>
                  </div>
                  {e.description && (
                    <p className="text-text-muted text-[12px] leading-relaxed">
                      {e.description}
                    </p>
                  )}
                  <dl className="grid grid-cols-2 gap-x-3 gap-y-1 border-t border-white/8 pt-2 text-[11px]">
                    <EventDetail
                      label="Starts"
                      value={formatOwnerDateTime(e.starts_at)}
                    />
                    <EventDetail
                      label="Ends"
                      value={
                        e.ends_at
                          ? formatOwnerDateTime(e.ends_at)
                          : 'Not specified'
                      }
                    />
                    <EventDetail
                      label="Entry"
                      value={
                        e.entry_fee === null
                          ? 'Not specified'
                          : e.entry_fee === 0
                            ? 'Free'
                            : `₹${e.entry_fee}`
                      }
                    />
                    <EventDetail
                      label="Location"
                      value={e.location_details || 'Not specified'}
                    />
                  </dl>
                  {e.ticket_url && (
                    <a
                      href={e.ticket_url}
                      target="_blank"
                      rel="noreferrer"
                      className="text-accent-primary inline-flex text-[11px] font-bold hover:underline"
                    >
                      Open ticket link
                    </a>
                  )}
                  <div className="flex gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setEditing(e)}
                    >
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
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

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
                  min={localDate(new Date(mountedAt).toISOString())}
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
