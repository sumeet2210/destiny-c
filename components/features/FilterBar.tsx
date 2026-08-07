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

const PANEL_KEYS = [
  'price',
  'area',
  'vibe',
  'discount',
  'ac',
  'service',
  'rating',
] as const;

/**
 * Search controls (P3-4, P3-8): quick chips always visible — craving, veg,
 * open now, has offer — and a filter sheet with a count badge on the trigger
 * (design.md §7). State lives in the URL so the server does the filtering.
 */
export function FilterBar() {
  const router = useRouter();
  const params = useSearchParams();
  const [sheetOpen, setSheetOpen] = useState(false);
  const [query, setQuery] = useState(params.get('q') ?? '');
  const debounce = useRef<ReturnType<typeof setTimeout> | null>(null);

  const set = (patch: Record<string, string | null>) => {
    const next = new URLSearchParams(params.toString());
    for (const [k, v] of Object.entries(patch)) {
      if (v === null || v === '') next.delete(k);
      else next.set(k, v);
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

  const panelCount = PANEL_KEYS.filter((k) => params.get(k)).length;

  return (
    <div className="space-y-3">
      <Input
        type="search"
        value={query}
        placeholder="Search restaurants and dishes — try “biryani”"
        onChange={(e) => {
          const v = e.target.value;
          setQuery(v);
          if (debounce.current) clearTimeout(debounce.current);
          debounce.current = setTimeout(() => set({ q: v || null }), 300);
        }}
      />

      <div className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4">
        {CRAVINGS.map((c) => (
          <Chip
            key={c.tag}
            active={params.get('craving') === c.tag}
            onClick={() => toggle('craving', c.tag)}
          >
            <span aria-hidden>{c.emoji}</span> {c.label}
          </Chip>
        ))}
      </div>

      <div className="flex flex-wrap items-center gap-2">
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

        <Chip onClick={() => setSheetOpen(true)} className="ml-auto">
          Filters
          {panelCount > 0 && (
            <span className="rounded-chip bg-accent-primary text-ink-on-primary px-1.5 font-mono text-[11px] font-bold">
              {panelCount}
            </span>
          )}
        </Chip>

        <Select
          aria-label="Sort"
          className="w-auto py-1.5 text-[13px]"
          value={params.get('sort') ?? 'trending'}
          onChange={(e) =>
            set({ sort: e.target.value === 'trending' ? null : e.target.value })
          }
        >
          <option value="trending">Trending today</option>
          <option value="price_asc">Price: low to high</option>
          <option value="rating">Highest rated</option>
          <option value="nearest">Nearest</option>
        </Select>
      </div>

      <Sheet
        open={sheetOpen}
        onClose={() => setSheetOpen(false)}
        title="Filters"
      >
        <div className="space-y-4">
          <div>
            <Label>Price per head</Label>
            <div className="flex flex-wrap gap-2">
              {PRICE_BUCKETS.map((b) => (
                <Chip
                  key={b.key}
                  active={params.get('price') === b.key}
                  onClick={() => toggle('price', b.key)}
                >
                  {b.label}
                </Chip>
              ))}
            </div>
          </div>
          <div>
            <Label>Area</Label>
            <div className="flex flex-wrap gap-2">
              {AREAS.map((a) => (
                <Chip
                  key={a}
                  active={params.get('area') === a}
                  onClick={() => toggle('area', a)}
                >
                  {a}
                </Chip>
              ))}
            </div>
          </div>
          <div>
            <Label>Vibe</Label>
            <div className="flex flex-wrap gap-2">
              {VIBES.map((v) => (
                <Chip
                  key={v.tag}
                  active={params.get('vibe') === v.tag}
                  onClick={() => toggle('vibe', v.tag)}
                >
                  {v.label}
                </Chip>
              ))}
            </div>
          </div>
          <div>
            <Label>More</Label>
            <div className="flex flex-wrap gap-2">
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
                ★ 4+
              </Chip>
            </div>
          </div>
          <div className="flex gap-2 pt-2">
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => {
                const keep = new URLSearchParams();
                const q = params.get('q');
                if (q) keep.set('q', q);
                router.replace(`/search?${keep.toString()}`, { scroll: false });
              }}
            >
              Reset
            </Button>
            <Button className="flex-1" onClick={() => setSheetOpen(false)}>
              Show results
            </Button>
          </div>
        </div>
      </Sheet>
    </div>
  );
}
