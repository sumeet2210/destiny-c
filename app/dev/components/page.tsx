'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Card, CardFooter, CardMedia } from '@/components/ui/Card';
import { Chip } from '@/components/ui/Chip';
import { Input, Label, Select, Textarea } from '@/components/ui/Input';
import { MenuRow } from '@/components/ui/MenuRow';
import { PhotoCarousel } from '@/components/ui/PhotoCarousel';
import { Sheet } from '@/components/ui/Sheet';
import { Skeleton } from '@/components/ui/Skeleton';
import { ToastProvider, useToast } from '@/components/ui/Toast';
import { VegMark } from '@/components/ui/VegMark';
import { EventCard } from '@/components/features/EventCard';
import { OfferBadge } from '@/components/features/OfferBadge';

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="space-y-3">
      <h2 className="font-display text-paper text-lg font-bold">{title}</h2>
      {children}
    </section>
  );
}

function ToastDemo() {
  const toast = useToast();
  return (
    <div className="flex gap-2">
      <Button
        size="sm"
        variant="outline"
        onClick={() => toast('Saved to your list')}
      >
        Default toast
      </Button>
      <Button
        size="sm"
        variant="outline"
        onClick={() => toast('Booking sent to the owner', 'positive')}
      >
        Positive
      </Button>
      <Button
        size="sm"
        variant="outline"
        onClick={() => toast('Something went wrong', 'error')}
      >
        Error
      </Button>
    </div>
  );
}

export default function KitchenSink() {
  const [sheetOpen, setSheetOpen] = useState(false);
  const [demoTimes] = useState(() => ({
    inOneHour: new Date(Date.now() + 61 * 60_000).toISOString(),
    in20Min: new Date(Date.now() + 20 * 60_000).toISOString(),
    tomorrow: new Date(Date.now() + 86_400_000).toISOString(),
  }));
  const { inOneHour, in20Min, tomorrow } = demoTimes;

  return (
    <ToastProvider>
      <main className="mx-auto max-w-2xl space-y-10 px-4 py-10">
        <h1 className="font-display text-paper text-2xl font-extrabold">
          Kitchen sink <span className="text-text-muted">/dev/components</span>
        </h1>

        <Section title="Chip">
          <div className="flex flex-wrap gap-2">
            <Chip>Default</Chip>
            <Chip active>Active</Chip>
            <Chip disabled>Disabled</Chip>
            <Chip>Featured</Chip>
          </div>
        </Section>

        <Section title="Button">
          <div className="flex flex-wrap items-center gap-2">
            <Button>Primary</Button>
            <Button variant="outline">Outline</Button>
            <Button variant="ghost">Ghost</Button>
            <Button variant="urgent-text">Cancel booking</Button>
            <Button disabled>Disabled</Button>
            <Button size="sm">Small</Button>
            <Button size="lg">Large</Button>
          </div>
        </Section>

        <Section title="Inputs">
          <div className="max-w-sm space-y-3">
            <div>
              <Label htmlFor="ks-name">Name</Label>
              <Input id="ks-name" placeholder="What should we call you?" />
            </div>
            <div>
              <Label htmlFor="ks-req">Special request</Label>
              <Textarea
                id="ks-req"
                placeholder="Birthday table, window seat…"
              />
            </div>
            <div>
              <Label htmlFor="ks-sel">Headcount</Label>
              <Select id="ks-sel" defaultValue="2">
                {[1, 2, 3, 4].map((n) => (
                  <option key={n} value={n}>
                    {n}
                  </option>
                ))}
              </Select>
            </div>
            <Input disabled placeholder="Disabled" />
          </div>
        </Section>

        <Section title="Veg mark + MenuRow (receipt pattern)">
          <div className="text-text-muted flex items-center gap-3 text-sm">
            <VegMark isVeg /> veg
            <VegMark isVeg={false} /> non-veg
          </div>
          <Card>
            <MenuRow name="Chicken Dum Biryani" price={220} isVeg={false} />
            <MenuRow name="Veg Biryani" price={160} isVeg />
            <MenuRow
              name="Ghost Pepper Momos (6)"
              price={150}
              isVeg={false}
              unavailable
            />
            <MenuRow name="Kulhad Chai" price={30} isVeg />
          </Card>
        </Section>

        <Section title="OfferBadge — rest vs urgent countdown">
          <div className="flex flex-wrap gap-3">
            <OfferBadge
              title="Student thali ₹99"
              discountText="₹21 off"
              expiresAt={inOneHour}
            />
            <OfferBadge
              title="Happy hour"
              discountText="B2G1"
              expiresAt={in20Min}
            />
          </div>
        </Section>

        <Section title="Card + media + dashed footer">
          <Card className="max-w-sm">
            <CardMedia>
              <PhotoCarousel
                photos={['/seed/biryani-adda.svg', '/seed/gallery-food-1.svg']}
                alt="Biryani Adda"
              />
            </CardMedia>
            <h3 className="font-display text-paper text-[17px] font-bold">
              Biryani Adda
            </h3>
            <p className="text-text-muted text-[13px]">
              Kakatiya · <span className="text-accent-secondary">Open now</span>{' '}
              · ★ <span className="font-mono">4.5</span>
            </p>
            <CardFooter className="flex items-center justify-between text-[13px]">
              <span className="text-text-muted">per head, roughly</span>
              <span className="text-accent-primary font-mono font-bold">
                ₹180
              </span>
            </CardFooter>
          </Card>
        </Section>

        <Section title="EventCard">
          <EventCard
            title="Open Mic Friday"
            eventType="open_mic"
            startsAt={tomorrow}
            restaurantName="Hunter Road Grill"
            description="Rooftop open mic — comedy, poetry, acoustic sets."
            rsvpSlot={
              <Button size="sm" variant="outline">
                I&apos;m going
              </Button>
            }
          />
        </Section>

        <Section title="Skeleton">
          <div className="max-w-sm space-y-2">
            <Skeleton className="aspect-[8/5] w-full" />
            <Skeleton className="h-5 w-2/3" />
            <Skeleton className="h-4 w-1/3" />
          </div>
        </Section>

        <Section title="Sheet + Toast">
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setSheetOpen(true)}>
              Open sheet
            </Button>
          </div>
          <ToastDemo />
          <Sheet
            open={sheetOpen}
            onClose={() => setSheetOpen(false)}
            title="Filters"
          >
            <p className="text-text-muted text-sm">
              Sheet body sits on surface-raised with a scrim behind it — the
              only thing that floats.
            </p>
            <Button className="mt-4 w-full" onClick={() => setSheetOpen(false)}>
              Done
            </Button>
          </Sheet>
        </Section>
      </main>
    </ToastProvider>
  );
}
