'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useMemo, useState, useTransition } from 'react';
import { Sheet } from '@/components/ui/Sheet';
import { useToast } from '@/components/ui/Toast';
import { CRAVINGS, type CravingTag } from '@/config/cravings';
import { haversineKm, formatDistance } from '@/lib/domain/distance';
import type { RestaurantSummary } from '@/lib/queries/catalog';
import { toggleSaved } from '@/lib/social/actions';
import styles from './squad-going-section.module.css';

type BudgetFilter = 'under-150' | '150-250' | '250-plus' | null;
type DistanceFilter = 'under-3' | 'under-6' | null;
type GroupFilter = 'solo' | 'duo' | 'small' | 'large' | null;

type SquadFilters = {
  cuisine: CravingTag | null;
  budget: BudgetFilter;
  distance: DistanceFilter;
  group: GroupFilter;
  openNow: boolean;
};

const EMPTY_FILTERS: SquadFilters = {
  cuisine: null,
  budget: null,
  distance: null,
  group: null,
  openNow: false,
};

const NITW_CAMPUS = { lat: 17.9833, lng: 79.5308 };

const BUDGET_OPTIONS: ReadonlyArray<{
  value: NonNullable<BudgetFilter>;
  label: string;
}> = [
  { value: 'under-150', label: 'Under ₹150' },
  { value: '150-250', label: '₹150–₹250' },
  { value: '250-plus', label: '₹250+' },
];

const DISTANCE_OPTIONS: ReadonlyArray<{
  value: NonNullable<DistanceFilter>;
  label: string;
}> = [
  { value: 'under-3', label: 'Within 3 km' },
  { value: 'under-6', label: 'Within 6 km' },
];

const GROUP_OPTIONS: ReadonlyArray<{
  value: NonNullable<GroupFilter>;
  label: string;
}> = [
  { value: 'solo', label: 'Solo' },
  { value: 'duo', label: 'Two people' },
  { value: 'small', label: '3–4 people' },
  { value: 'large', label: '5+ people' },
];

export function SquadGoingSection({
  restaurants,
  loggedIn,
  initialSavedIds,
}: {
  restaurants: RestaurantSummary[];
  loggedIn: boolean;
  initialSavedIds: string[];
}) {
  const router = useRouter();
  const toast = useToast();
  const [filters, setFilters] = useState<SquadFilters>(EMPTY_FILTERS);
  const [draft, setDraft] = useState<SquadFilters>(EMPTY_FILTERS);
  const [filterOpen, setFilterOpen] = useState(false);
  const [savedIds, setSavedIds] = useState(() => new Set(initialSavedIds));
  const [poppingId, setPoppingId] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  const availableCuisines = useMemo(
    () =>
      CRAVINGS.filter((craving) =>
        restaurants.some((restaurant) =>
          restaurant.cravingTags.includes(craving.tag),
        ),
      ),
    [restaurants],
  );

  const decorated = useMemo(
    () =>
      restaurants.map((restaurant) => ({
        restaurant,
        distanceKm:
          restaurant.lat !== null && restaurant.lng !== null
            ? haversineKm(
                NITW_CAMPUS.lat,
                NITW_CAMPUS.lng,
                restaurant.lat,
                restaurant.lng,
              )
            : null,
      })),
    [restaurants],
  );

  const filtered = useMemo(
    () =>
      decorated.filter(({ restaurant, distanceKm }) => {
        if (
          filters.cuisine &&
          !restaurant.cravingTags.includes(filters.cuisine)
        ) {
          return false;
        }
        if (!matchesBudget(restaurant.price_per_head, filters.budget)) {
          return false;
        }
        if (!matchesDistance(distanceKm, filters.distance)) return false;
        if (!matchesGroup(restaurant, filters.group)) return false;
        if (filters.openNow && !restaurant.isOpen) return false;
        return true;
      }),
    [decorated, filters],
  );

  const activeFilterCount = countActiveFilters(filters);

  const openFilters = () => {
    setDraft(filters);
    setFilterOpen(true);
  };

  const clearFilters = () => {
    setDraft(EMPTY_FILTERS);
    setFilters(EMPTY_FILTERS);
  };

  const saveRestaurant = (restaurant: RestaurantSummary) => {
    const nextPath = `/restaurant/${restaurant.id}?from=friend_activity`;
    if (!loggedIn) {
      router.push(`/login?next=${encodeURIComponent(nextPath)}`);
      return;
    }

    const wasSaved = savedIds.has(restaurant.id);
    setSavedIds((current) => {
      const next = new Set(current);
      if (wasSaved) next.delete(restaurant.id);
      else next.add(restaurant.id);
      return next;
    });

    if (!wasSaved) {
      setPoppingId(restaurant.id);
      window.setTimeout(() => setPoppingId(null), 420);
    }

    startTransition(async () => {
      const result = await toggleSaved(restaurant.id);
      if (!result.ok) {
        setSavedIds((current) => {
          const next = new Set(current);
          if (wasSaved) next.add(restaurant.id);
          else next.delete(restaurant.id);
          return next;
        });
        toast(result.message ?? 'Could not save this place', 'error');
      }
    });
  };

  return (
    <section className={styles.section} aria-labelledby="squad-going-title">
      <div className={styles.headingRow}>
        <div>
          <h2 id="squad-going-title">Where the Squad&apos;s Going</h2>
          <p>Real places nearby, narrowed down for the whole table.</p>
        </div>
        <button
          type="button"
          className={styles.filterButton}
          onClick={openFilters}
          aria-haspopup="dialog"
        >
          <FilterIcon />
          <span>Filters</span>
          {activeFilterCount > 0 && (
            <span
              className={styles.filterCount}
              aria-label={`${activeFilterCount} active filters`}
            >
              {activeFilterCount}
            </span>
          )}
        </button>
      </div>

      <p className={styles.resultCount} aria-live="polite">
        {filtered.length} {filtered.length === 1 ? 'place' : 'places'} ready for
        the squad
      </p>

      {filtered.length > 0 ? (
        <div className={styles.grid}>
          {filtered.map(({ restaurant, distanceKm }) => (
            <SquadPlaceCard
              key={restaurant.id}
              restaurant={restaurant}
              distanceKm={distanceKm}
              saved={savedIds.has(restaurant.id)}
              popping={poppingId === restaurant.id}
              onSave={() => saveRestaurant(restaurant)}
            />
          ))}
        </div>
      ) : (
        <div className={styles.emptyState}>
          <strong>No places match that plan yet.</strong>
          <span>Try clearing one filter and bring the squad back in.</span>
          <button type="button" onClick={clearFilters}>
            Clear all filters
          </button>
        </div>
      )}

      <Sheet
        open={filterOpen}
        onClose={() => setFilterOpen(false)}
        title="Refine the squad picks"
        className={styles.filterSheet}
      >
        <div className={styles.filterIntro}>
          <p>Set the plan once. Your choices stay applied in this section.</p>
          <button type="button" onClick={clearFilters}>
            Clear all
          </button>
        </div>

        <FilterGroup legend="Cuisine type">
          {availableCuisines.map((craving) => (
            <FilterChip
              key={craving.tag}
              active={draft.cuisine === craving.tag}
              onClick={() =>
                setDraft((current) => ({
                  ...current,
                  cuisine: current.cuisine === craving.tag ? null : craving.tag,
                }))
              }
            >
              {craving.label}
            </FilterChip>
          ))}
        </FilterGroup>

        <FilterGroup legend="Price / budget">
          {BUDGET_OPTIONS.map((option) => (
            <FilterChip
              key={option.value}
              active={draft.budget === option.value}
              onClick={() =>
                setDraft((current) => ({
                  ...current,
                  budget: current.budget === option.value ? null : option.value,
                }))
              }
            >
              {option.label}
            </FilterChip>
          ))}
        </FilterGroup>

        <FilterGroup legend="Distance from NITW">
          {DISTANCE_OPTIONS.map((option) => (
            <FilterChip
              key={option.value}
              active={draft.distance === option.value}
              onClick={() =>
                setDraft((current) => ({
                  ...current,
                  distance:
                    current.distance === option.value ? null : option.value,
                }))
              }
            >
              {option.label}
            </FilterChip>
          ))}
        </FilterGroup>

        <FilterGroup legend="Group size">
          {GROUP_OPTIONS.map((option) => (
            <FilterChip
              key={option.value}
              active={draft.group === option.value}
              onClick={() =>
                setDraft((current) => ({
                  ...current,
                  group: current.group === option.value ? null : option.value,
                }))
              }
            >
              {option.label}
            </FilterChip>
          ))}
        </FilterGroup>

        <label className={styles.openToggle}>
          <span>
            <strong>Open now</strong>
            <small>Hide places that are currently closed</small>
          </span>
          <input
            type="checkbox"
            checked={draft.openNow}
            onChange={(event) =>
              setDraft((current) => ({
                ...current,
                openNow: event.target.checked,
              }))
            }
          />
          <i aria-hidden />
        </label>

        <button
          type="button"
          className={styles.applyButton}
          onClick={() => {
            setFilters(draft);
            setFilterOpen(false);
          }}
        >
          Apply filters
        </button>
      </Sheet>
    </section>
  );
}

function SquadPlaceCard({
  restaurant,
  distanceKm,
  saved,
  popping,
  onSave,
}: {
  restaurant: RestaurantSummary;
  distanceKm: number | null;
  saved: boolean;
  popping: boolean;
  onSave: () => void;
}) {
  const cuisines = restaurant.cravingTags
    .map((tag) => CRAVINGS.find((craving) => craving.tag === tag)?.label)
    .filter(Boolean)
    .slice(0, 3);

  return (
    <article className={styles.card}>
      <Link
        href={`/restaurant/${restaurant.id}?from=friend_activity`}
        className={styles.cardLink}
        aria-label={`View ${restaurant.name}`}
      >
        <div className={styles.cardMedia}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={restaurant.photos[0] ?? '/home/hero-campus-feast.webp'}
            alt=""
            loading="lazy"
          />
          <span className={styles.mediaShade} aria-hidden />
          <span
            className={
              restaurant.isOpen ? styles.openBadge : styles.closedBadge
            }
          >
            {restaurant.isOpen ? 'Open now' : 'Closed'}
          </span>
        </div>

        <div className={styles.cardBody}>
          <div className={styles.cardTitleRow}>
            <div>
              <h3>{restaurant.name}</h3>
              <p>
                {cuisines.length > 0 ? cuisines.join(' · ') : restaurant.area}
              </p>
            </div>
            <span className={styles.priceLevel}>
              {priceLevel(restaurant.price_per_head)}
            </span>
          </div>

          <div className={styles.metaRow}>
            <span>
              <StarIcon />
              {restaurant.rating?.toFixed(1) ?? 'New'}
            </span>
            <span>
              {distanceKm === null
                ? restaurant.area
                : formatDistance(distanceKm)}
            </span>
            <span>
              {restaurant.price_per_head
                ? `~₹${restaurant.price_per_head}/person`
                : 'Price varies'}
            </span>
          </div>

          <div className={styles.tagRow}>
            {restaurant.student_discount && <span>Student discount</span>}
            {restaurant.vibe_tags.slice(0, 2).map((tag) => (
              <span key={tag}>{readableTag(tag)}</span>
            ))}
          </div>
        </div>
      </Link>

      <button
        type="button"
        className={`${styles.saveButton} ${saved ? styles.saved : ''} ${popping ? styles.popping : ''}`}
        aria-label={
          saved ? `Unsave ${restaurant.name}` : `Save ${restaurant.name}`
        }
        aria-pressed={saved}
        onClick={onSave}
      >
        <HeartIcon filled={saved} />
      </button>
    </article>
  );
}

function FilterGroup({
  legend,
  children,
}: {
  legend: string;
  children: React.ReactNode;
}) {
  return (
    <fieldset className={styles.filterGroup}>
      <legend>{legend}</legend>
      <div>{children}</div>
    </fieldset>
  );
}

function FilterChip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      aria-pressed={active}
      className={active ? styles.activeChip : styles.filterChip}
      onClick={onClick}
    >
      {children}
    </button>
  );
}

function matchesBudget(price: number | null, budget: BudgetFilter) {
  if (!budget) return true;
  if (price === null) return false;
  if (budget === 'under-150') return price < 150;
  if (budget === '150-250') return price >= 150 && price <= 250;
  return price > 250;
}

function matchesDistance(distanceKm: number | null, distance: DistanceFilter) {
  if (!distance) return true;
  if (distanceKm === null) return false;
  return distanceKm <= (distance === 'under-3' ? 3 : 6);
}

function matchesGroup(restaurant: RestaurantSummary, group: GroupFilter) {
  if (!group) return true;
  if (group === 'solo') {
    return (
      restaurant.takeaway ||
      restaurant.vibe_tags.some((tag) =>
        ['quick', 'study', 'chill'].includes(tag),
      )
    );
  }
  if (group === 'duo') return restaurant.dine_in || restaurant.takeaway;
  if (group === 'small') return restaurant.dine_in;
  return (
    restaurant.dine_in &&
    restaurant.vibe_tags.some((tag) => ['group', 'celebration'].includes(tag))
  );
}

function countActiveFilters(filters: SquadFilters) {
  return [
    filters.cuisine,
    filters.budget,
    filters.distance,
    filters.group,
    filters.openNow ? 'open' : null,
  ].filter(Boolean).length;
}

function priceLevel(price: number | null) {
  if (price === null || price < 150) return '₹';
  if (price <= 250) return '₹₹';
  return '₹₹₹';
}

function readableTag(tag: string) {
  return tag
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .replace(/^./, (letter) => letter.toUpperCase());
}

function FilterIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden>
      <path d="M4 7h10M18 7h2M4 17h2M10 17h10M14 4v6M7 14v6" />
    </svg>
  );
}

function StarIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden>
      <path d="m12 3 2.75 5.58 6.16.9-4.46 4.34 1.05 6.13L12 17.06l-5.5 2.89 1.05-6.13L3.1 9.48l6.15-.9L12 3Z" />
    </svg>
  );
}

function HeartIcon({ filled }: { filled: boolean }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden>
      <path
        d="M20.8 4.7a5.5 5.5 0 0 0-7.8 0L12 5.8l-1.1-1.1a5.5 5.5 0 0 0-7.8 7.8L12 21l8.8-8.5a5.5 5.5 0 0 0 0-7.8Z"
        fill={filled ? 'currentColor' : 'none'}
      />
    </svg>
  );
}
