'use client';

import { useMemo, useState } from 'react';
import { RestaurantCard } from '@/components/features/RestaurantCard';
import { Button } from '@/components/ui/Button';
import { haversineKm } from '@/lib/domain/distance';
import type { RestaurantSummary } from '@/lib/api/types';

type Coords = { lat: number; lng: number };

/**
 * Client grid so optional geolocation can decorate cards with distance and
 * enable "nearest" (P3-10). Location is only requested on explicit tap —
 * never on load, and declining changes nothing (PRD §5.4).
 */
export function RestaurantGrid({
  restaurants,
  source,
  nearestRequested = false,
  saveSlots,
  friendNotes,
}: {
  restaurants: RestaurantSummary[];
  source: string;
  nearestRequested?: boolean;
  saveSlots?: Record<string, React.ReactNode>;
  friendNotes?: Record<string, string>;
}) {
  const [coords, setCoords] = useState<Coords | null>(null);
  const [geoState, setGeoState] = useState<
    'idle' | 'asking' | 'denied' | 'granted'
  >('idle');

  const askLocation = () => {
    if (!('geolocation' in navigator)) {
      setGeoState('denied');
      return;
    }
    setGeoState('asking');
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setGeoState('granted');
      },
      () => setGeoState('denied'),
      { maximumAge: 300_000, timeout: 10_000 },
    );
  };

  const decorated = useMemo(() => {
    const withDistance = restaurants.map((r) => ({
      r,
      distanceKm:
        coords && r.lat !== null && r.lng !== null
          ? haversineKm(coords.lat, coords.lng, r.lat, r.lng)
          : null,
    }));
    if (nearestRequested && coords) {
      withDistance.sort(
        (a, b) => (a.distanceKm ?? Infinity) - (b.distanceKm ?? Infinity),
      );
    }
    return withDistance;
  }, [restaurants, coords, nearestRequested]);

  return (
    <div className="space-y-3">
      {nearestRequested && geoState !== 'granted' && (
        <div className="rounded-card border-border-hairline bg-surface-muted text-text-muted flex items-center justify-between gap-3 border p-3 text-[13px]">
          {geoState === 'denied' ? (
            <span>
              No location, no problem — showing the usual order instead.
            </span>
          ) : (
            <>
              <span>Sorting by nearest needs your location once.</span>
              <Button
                size="sm"
                variant="outline"
                onClick={askLocation}
                disabled={geoState === 'asking'}
              >
                {geoState === 'asking' ? 'Asking…' : 'Use my location'}
              </Button>
            </>
          )}
        </div>
      )}
      <div className="restaurant-grid grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {decorated.map(({ r, distanceKm }) => (
          <RestaurantCard
            key={r.id}
            restaurant={r}
            // A friend's save is its own analytics source (P3-13).
            source={friendNotes?.[r.id] ? 'friend_activity' : source}
            distanceKm={distanceKm}
            saveSlot={saveSlots?.[r.id]}
            friendNote={friendNotes?.[r.id]}
          />
        ))}
      </div>
    </div>
  );
}
