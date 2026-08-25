'use client';

import { useMemo, useState } from 'react';
import { Button } from '@/components/ui/Button';

type Coordinates = { lat: number; lng: number };
const TILE_SIZE = 256;
const ZOOM = 14;
const FALLBACK: Coordinates = { lat: 17.9689, lng: 79.5941 };

function toWorld({ lat, lng }: Coordinates) {
  const scale = TILE_SIZE * 2 ** ZOOM;
  const sin = Math.sin(
    (Math.max(-85.0511, Math.min(85.0511, lat)) * Math.PI) / 180,
  );
  return {
    x: ((lng + 180) / 360) * scale,
    y: (0.5 - Math.log((1 + sin) / (1 - sin)) / (4 * Math.PI)) * scale,
  };
}

function fromWorld(x: number, y: number): Coordinates {
  const scale = TILE_SIZE * 2 ** ZOOM;
  return {
    lng: (x / scale) * 360 - 180,
    lat:
      (180 / Math.PI) *
      Math.atan(Math.sinh(Math.PI - (2 * Math.PI * y) / scale)),
  };
}

export function LocationPicker({
  lat,
  lng,
  onChange,
}: {
  lat: number | null;
  lng: number | null;
  onChange: (coordinates: Coordinates) => void;
}) {
  const [locating, setLocating] = useState(false);
  const [choosing, setChoosing] = useState(false);
  const center = lat === null || lng === null ? FALLBACK : { lat, lng };
  const world = toWorld(center);
  const tiles = useMemo(() => {
    const centerX = Math.floor(world.x / TILE_SIZE);
    const centerY = Math.floor(world.y / TILE_SIZE);
    return Array.from({ length: 15 }, (_, index) => ({
      x: centerX + (index % 5) - 2,
      y: centerY + Math.floor(index / 5) - 1,
    }));
  }, [world.x, world.y]);

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
        <Button
          type="button"
          variant="outline"
          disabled={locating}
          onClick={() => {
            setLocating(true);
            navigator.geolocation.getCurrentPosition(
              ({ coords }) => {
                onChange({ lat: coords.latitude, lng: coords.longitude });
                setLocating(false);
              },
              () => setLocating(false),
              { enableHighAccuracy: true },
            );
          }}
        >
          {locating ? 'Finding location…' : 'Use current location'}
        </Button>
        <Button
          type="button"
          variant="outline"
          aria-expanded={choosing}
          onClick={() => setChoosing((current) => !current)}
        >
          {choosing ? 'Hide map' : 'Choose your own location'}
        </Button>
      </div>

      {choosing ? (
        <div
          role="application"
          aria-label="Restaurant location map. Click to place the pin."
          className="border-border-hairline bg-surface-raised rounded-control relative h-72 cursor-crosshair overflow-hidden border"
          onClick={(event) => {
            const rect = event.currentTarget.getBoundingClientRect();
            onChange(
              fromWorld(
                world.x + event.clientX - rect.left - rect.width / 2,
                world.y + event.clientY - rect.top - rect.height / 2,
              ),
            );
          }}
        >
          {tiles.map((tile) => (
            <span
              key={`${tile.x}-${tile.y}`}
              className="pointer-events-none absolute h-64 w-64 bg-cover"
              style={{
                left: `calc(50% + ${tile.x * TILE_SIZE - world.x}px)`,
                top: `calc(50% + ${tile.y * TILE_SIZE - world.y}px)`,
                backgroundImage: `url(https://tile.openstreetmap.org/${ZOOM}/${tile.x}/${tile.y}.png)`,
              }}
            />
          ))}
          <span className="bg-accent-primary border-canvas after:bg-accent-primary pointer-events-none absolute top-1/2 left-1/2 z-10 h-4 w-4 -translate-x-1/2 -translate-y-full rounded-full border-2 shadow-lg after:absolute after:top-3 after:left-1/2 after:h-2 after:w-2 after:-translate-x-1/2 after:rotate-45" />
          <span className="bg-canvas/80 text-text-muted pointer-events-none absolute right-2 bottom-2 z-20 rounded px-2 py-1 text-[10px]">
            © OpenStreetMap contributors
          </span>
        </div>
      ) : null}
      <p className="text-text-muted text-xs">
        {lat === null || lng === null
          ? 'No location selected yet.'
          : `Location selected: ${lat.toFixed(6)}, ${lng.toFixed(6)}`}
      </p>
    </div>
  );
}
