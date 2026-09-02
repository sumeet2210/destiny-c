'use client';

import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';
import { getEventTypeLabel } from '@/config/events';
import { Button } from '@/components/ui/Button';
import { Sheet } from '@/components/ui/Sheet';
import { Input, Label, Textarea } from '@/components/ui/Input';
import { useToast } from '@/components/ui/Toast';
import { resizeToWebp } from '@/components/features/owner/PhotoManager';
import {
  deleteEvent,
  uploadPromotionImage,
  upsertEvent,
} from '@/lib/owner/actions';

type OwnerEvent = {
  id: string;
  title: string;
  description: string | null;
  event_type: string;
  custom_event_type: string | null;
  starts_at: string;
  ends_at: string | null;
  entry_fee: number | null;
  location_details: string | null;
  is_cancelled: boolean;
  cover_image_url: string | null;
};

const toLocalInput = (iso: string | null) => {
  if (!iso) return '';
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

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
                          {getEventTypeLabel(e.event_type, e.custom_event_type)}
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
                {status.key === 'upcoming' || status.key === 'live' ? (
                  <div className="border-border-hairline flex justify-end border-t px-3 py-2.5">
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
                            custom_event_type: e.custom_event_type ?? undefined,
                            starts_at: e.starts_at,
                            ends_at: e.ends_at,
                            description: e.description ?? undefined,
                            entry_fee: e.entry_fee,
                            location_details: e.location_details ?? undefined,
                            cover_image_url: e.cover_image_url,
                            is_cancelled: true,
                          });
                          toast(
                            res.ok
                              ? 'Event taken down'
                              : (res.message ?? 'Failed'),
                            res.ok ? 'positive' : 'error',
                          );
                          if (res.ok) router.refresh();
                        })
                      }
                    >
                      Take down
                    </Button>
                  </div>
                ) : status.key === 'cancelled' || status.key === 'past' ? (
                  <div className="border-border-hairline flex justify-end border-t px-3 py-2.5">
                    <Button
                      variant="urgent-text"
                      size="sm"
                      className="min-h-11"
                      disabled={pending}
                      onClick={() => {
                        if (
                          !window.confirm(
                            `Delete “${e.title}” permanently? This cannot be undone.`,
                          )
                        ) {
                          return;
                        }
                        startTransition(async () => {
                          const res = await deleteEvent(e.id);
                          toast(
                            res.ok
                              ? 'Event deleted'
                              : (res.message ?? 'Failed'),
                            res.ok ? 'positive' : 'error',
                          );
                          if (res.ok) router.refresh();
                        });
                      }}
                    >
                      Delete
                    </Button>
                  </div>
                ) : null}
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
              const startsLocal = String(fd.get('starts_at') || '');
              const endsLocal = String(fd.get('ends_at') || '');
              if (!startsLocal || !endsLocal) {
                toast('Choose the start and end date and time.', 'error');
                return;
              }
              const photo = fd.get('photo');
              const photoFile =
                photo instanceof File && photo.size > 0 ? photo : null;
              if (!editing.id && !photoFile) {
                toast('Add an event photo.', 'error');
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
                  event_type: editing.event_type ?? 'other',
                  custom_event_type: editing.custom_event_type ?? undefined,
                  starts_at: new Date(startsLocal).toISOString(),
                  ends_at: new Date(endsLocal).toISOString(),
                  entry_fee: editing.entry_fee ?? null,
                  location_details: String(fd.get('location_details') || ''),
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
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <Label htmlFor="ev-title">Event title</Label>
                <Input
                  id="ev-title"
                  name="title"
                  required
                  defaultValue={editing.title ?? ''}
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
              <Label htmlFor="ev-desc">Description</Label>
              <Textarea
                id="ev-desc"
                name="description"
                rows={4}
                defaultValue={editing.description ?? ''}
              />
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <Label htmlFor="ev-start">Start date and time</Label>
                <Input
                  id="ev-start"
                  name="starts_at"
                  type="datetime-local"
                  required
                  min={
                    editing.id
                      ? undefined
                      : toLocalInput(new Date(mountedAt).toISOString())
                  }
                  max={toLocalInput(publishLimit.toISOString())}
                  className="font-mono"
                  onChange={closeDateTimePicker}
                  defaultValue={toLocalInput(editing.starts_at ?? null)}
                />
              </div>
              <div>
                <Label htmlFor="ev-end">End date and time</Label>
                <Input
                  id="ev-end"
                  name="ends_at"
                  type="datetime-local"
                  required
                  className="font-mono"
                  onChange={closeDateTimePicker}
                  defaultValue={toLocalInput(editing.ends_at ?? null)}
                />
              </div>
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

function closeDateTimePicker(event: React.ChangeEvent<HTMLInputElement>) {
  if (event.currentTarget.value) event.currentTarget.blur();
}

function EventDetail({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0">
      <dt className="text-text-muted">{label}</dt>
      <dd className="text-paper break-words">{value}</dd>
    </div>
  );
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
