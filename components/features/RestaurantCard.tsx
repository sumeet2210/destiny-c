import Link from 'next/link';
import { Card, CardFooter, CardMedia } from '@/components/ui/Card';
import { PhotoCarousel } from '@/components/ui/PhotoCarousel';
import { OfferBadge } from '@/components/features/OfferBadge';
import { VIBES } from '@/config/vibes';
import { formatDistance } from '@/lib/domain/distance';
import { cn } from '@/lib/cn';

export type RestaurantCardData = {
  id: string;
  name: string;
  area: string;
  price_per_head: number | null;
  is_veg_only: boolean;
  student_discount: boolean;
  vibe_tags: string[];
  photos: string[];
  isOpen: boolean;
  closingInMinutes: number | null;
  rating: number | null;
  reviewCount: number;
  liveOffer: {
    title: string;
    discount_text: string | null;
    expires_at: string;
  } | null;
};

const vibeLabel = (tag: string) =>
  VIBES.find((v) => v.tag === tag)?.label ?? tag;

/**
 * The directory card: media carousel, meta row, vibe pills, dashed receipt
 * footer with mono turmeric price (design.md §4, §7).
 */
export function RestaurantCard({
  restaurant: r,
  source,
  distanceKm,
  saveSlot,
  friendNote,
  className,
}: {
  restaurant: RestaurantCardData;
  /** Where the student came from — becomes profile_views.source_filter. */
  source: string;
  distanceKm?: number | null;
  saveSlot?: React.ReactNode;
  friendNote?: string | null;
  className?: string;
}) {
  return (
    <Card className={cn('restaurant-card relative flex flex-col', className)}>
      <CardMedia className="restaurant-card-media relative">
        <PhotoCarousel
          photos={r.photos}
          alt={r.name}
          aspect="restaurant-card-image aspect-[8/5]"
        />
        {saveSlot && (
          <div className="absolute top-2 right-2 z-10">{saveSlot}</div>
        )}
      </CardMedia>

      {r.liveOffer && (
        <div className="restaurant-card-offer mb-2">
          <OfferBadge
            title={r.liveOffer.title}
            discountText={r.liveOffer.discount_text}
            expiresAt={r.liveOffer.expires_at}
          />
        </div>
      )}

      <Link
        href={`/restaurant/${r.id}?from=${encodeURIComponent(source)}`}
        className="restaurant-card-title font-display text-paper text-[17px] font-bold after:absolute after:inset-0 after:content-['']"
      >
        {r.name}
      </Link>

      <p className="restaurant-card-meta text-text-muted mt-0.5 flex flex-wrap items-center gap-x-2 text-[13px]">
        <span>{r.area}</span>
        {typeof distanceKm === 'number' && (
          <>
            <span aria-hidden>·</span>
            <span className="font-mono">{formatDistance(distanceKm)}</span>
          </>
        )}
        <span aria-hidden>·</span>
        {r.isOpen ? (
          r.closingInMinutes !== null && r.closingInMinutes <= 45 ? (
            <span className="text-accent-urgent-text">
              Closing in{' '}
              <span className="font-mono">{r.closingInMinutes}m</span>
            </span>
          ) : (
            <span className="text-accent-secondary">Open now</span>
          )
        ) : (
          <span>Closed</span>
        )}
        {r.rating !== null && (
          <>
            <span aria-hidden>·</span>
            <span>
              <span aria-hidden>★ </span>
              <span className="font-mono">{r.rating.toFixed(1)}</span>{' '}
              <span className="text-[11px]">({r.reviewCount})</span>
            </span>
          </>
        )}
      </p>

      {(r.vibe_tags.length > 0 || r.is_veg_only || r.student_discount) && (
        <div className="restaurant-card-tags mt-2 flex flex-wrap gap-1.5">
          {r.is_veg_only && (
            <span className="rounded-chip border-accent-secondary text-accent-secondary border px-2 py-0.5 text-[11px]">
              Pure veg
            </span>
          )}
          {r.student_discount && (
            <span className="rounded-chip border-accent-primary text-accent-primary border px-2 py-0.5 text-[11px]">
              Student discount
            </span>
          )}
          {r.vibe_tags.slice(0, 3).map((tag) => (
            <span
              key={tag}
              className="rounded-chip border-border-hairline bg-surface-raised text-text-muted border px-2 py-0.5 text-[11px]"
            >
              {vibeLabel(tag)}
            </span>
          ))}
        </div>
      )}

      <CardFooter className="restaurant-card-footer mt-auto flex items-center justify-between text-[13px]">
        <span className="text-text-muted">
          {friendNote ?? (r.price_per_head ? 'per head, roughly' : '')}
        </span>
        {r.price_per_head && (
          <span className="text-accent-primary font-mono font-bold">
            ₹{r.price_per_head}
          </span>
        )}
      </CardFooter>
    </Card>
  );
}
