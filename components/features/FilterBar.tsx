'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { AREAS } from '@/config/areas';
import { CRAVINGS } from '@/config/cravings';
import { PRICE_BUCKETS } from '@/config/price-buckets';
import { VIBES } from '@/config/vibes';
import { Button } from '@/components/ui/Button';
import { Chip } from '@/components/ui/Chip';
import { Input, Label, Select } from '@/components/ui/Input';
import { Sheet } from '@/components/ui/Sheet';
import styles from './filter-bar.module.css';

const PANEL_KEYS = [
  'price',
  'area',
  'vibe',
  'discount',
  'ac',
  'service',
  'rating',
] as const;

/** URL-backed search controls; the server remains the filtering authority. */
export function FilterBar() {
  const router = useRouter();
  const params = useSearchParams();
  const [sheetOpen, setSheetOpen] = useState(false);
  const [query, setQuery] = useState(params.get('q') ?? '');
  const debounce = useRef<ReturnType<typeof setTimeout> | null>(null);

  const set = (patch: Record<string, string | null>) => {
    const next = new URLSearchParams(params.toString());
    for (const [key, value] of Object.entries(patch)) {
      if (value === null || value === '') next.delete(key);
      else next.set(key, value);
    }
    router.replace(`/search?${next.toString()}`, { scroll: false });
  };

  const toggle = (key: string, value: string) =>
    set({ [key]: params.get(key) === value ? null : value });

  useEffect(() => {
    return () => {
      if (debounce.current) clearTimeout(debounce.current);
    };
  }, []);

  const panelCount = PANEL_KEYS.filter((key) => params.get(key)).length;

  return (
    <div className={styles.filters}>
      <div className={styles.searchField}>
        <SearchIcon />
        <Input
          type="search"
          value={query}
          aria-label="Search restaurants and dishes"
          placeholder="Try biryani, chai, rooftop..."
          className={styles.searchInput}
          onChange={(event) => {
            const value = event.target.value;
            setQuery(value);
            if (debounce.current) clearTimeout(debounce.current);
            debounce.current = setTimeout(() => set({ q: value || null }), 300);
          }}
        />
      </div>

      <div
        className={styles.cravingRail}
        role="group"
        aria-label="Filter by craving"
      >
        {CRAVINGS.map((craving) => (
          <Chip
            key={craving.tag}
            active={params.get('craving') === craving.tag}
            onClick={() => toggle('craving', craving.tag)}
          >
            {craving.label}
          </Chip>
        ))}
      </div>

      <div className={styles.quickRow}>
        <div className={styles.quickChoices}>
          <Chip
            active={params.get('veg') === 'veg'}
            onClick={() => toggle('veg', 'veg')}
          >
            Veg
          </Chip>
          <Chip
            active={params.get('veg') === 'nonveg'}
            onClick={() => toggle('veg', 'nonveg')}
          >
            Non-veg
          </Chip>
          <Chip
            active={params.get('open') === '1'}
            onClick={() => toggle('open', '1')}
          >
            Open now
          </Chip>
          <Chip
            active={params.get('offer') === '1'}
            onClick={() => toggle('offer', '1')}
          >
            Live offer
          </Chip>
        </div>

        <div className={styles.filterActions}>
          <Chip
            onClick={() => setSheetOpen(true)}
            className={styles.filterTrigger}
          >
            <TuneIcon /> Filters
            {panelCount > 0 && (
              <span className={styles.filterCount}>{panelCount}</span>
            )}
          </Chip>

          <Select
            aria-label="Sort restaurants"
            className={styles.sort}
            value={params.get('sort') ?? 'trending'}
            onChange={(event) =>
              set({
                sort:
                  event.target.value === 'trending' ? null : event.target.value,
              })
            }
          >
            <option value="trending">Trending today</option>
            <option value="price_asc">Price: low to high</option>
            <option value="rating">Highest rated</option>
            <option value="nearest">Nearest</option>
          </Select>
        </div>
      </div>

      <Sheet
        open={sheetOpen}
        onClose={() => setSheetOpen(false)}
        title="Refine the shortlist"
        className={styles.sheet}
      >
        <div className={styles.sheetBody}>
          <div>
            <Label>Price per head</Label>
            <div className={styles.sheetChoices}>
              {PRICE_BUCKETS.map((bucket) => (
                <Chip
                  key={bucket.key}
                  active={params.get('price') === bucket.key}
                  onClick={() => toggle('price', bucket.key)}
                >
                  {bucket.label}
                </Chip>
              ))}
            </div>
          </div>
          <div>
            <Label>Area</Label>
            <div className={styles.sheetChoices}>
              {AREAS.map((area) => (
                <Chip
                  key={area}
                  active={params.get('area') === area}
                  onClick={() => toggle('area', area)}
                >
                  {area}
                </Chip>
              ))}
            </div>
          </div>
          <div>
            <Label>Vibe</Label>
            <div className={styles.sheetChoices}>
              {VIBES.map((vibe) => (
                <Chip
                  key={vibe.tag}
                  active={params.get('vibe') === vibe.tag}
                  onClick={() => toggle('vibe', vibe.tag)}
                >
                  {vibe.label}
                </Chip>
              ))}
            </div>
          </div>
          <div>
            <Label>Practical details</Label>
            <div className={styles.sheetChoices}>
              <Chip
                active={params.get('discount') === '1'}
                onClick={() => toggle('discount', '1')}
              >
                Student discount
              </Chip>
              <Chip
                active={params.get('ac') === 'ac'}
                onClick={() => toggle('ac', 'ac')}
              >
                AC
              </Chip>
              <Chip
                active={params.get('ac') === 'nonac'}
                onClick={() => toggle('ac', 'nonac')}
              >
                Non-AC
              </Chip>
              <Chip
                active={params.get('service') === 'dinein'}
                onClick={() => toggle('service', 'dinein')}
              >
                Dine-in
              </Chip>
              <Chip
                active={params.get('service') === 'takeaway'}
                onClick={() => toggle('service', 'takeaway')}
              >
                Takeaway
              </Chip>
              <Chip
                active={params.get('rating') === '4'}
                onClick={() => toggle('rating', '4')}
              >
                Rated 4+
              </Chip>
            </div>
          </div>
          <div className={styles.sheetActions}>
            <Button
              variant="outline"
              onClick={() => {
                const keep = new URLSearchParams();
                const currentQuery = params.get('q');
                if (currentQuery) keep.set('q', currentQuery);
                router.replace(`/search?${keep.toString()}`, { scroll: false });
              }}
            >
              Reset filters
            </Button>
            <Button onClick={() => setSheetOpen(false)}>Show results</Button>
          </div>
        </div>
      </Sheet>
    </div>
  );
}

function SearchIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden>
      <circle cx="10.5" cy="10.5" r="6.5" />
      <path d="m15.5 15.5 5 5" />
    </svg>
  );
}

function TuneIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden>
      <path d="M4 7h10M18 7h2M4 17h2M10 17h10M14 4v6M6 14v6" />
    </svg>
  );
}
