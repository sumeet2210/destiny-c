'use client';

import { useRouter } from 'next/navigation';
import {
  type FormEvent,
  type KeyboardEvent,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import type { QuickSearchIndex } from '@/lib/queries/catalog';
import { cn } from '@/lib/cn';
import styles from './live-ticker-search.module.css';

type Suggestion =
  | {
      key: string;
      kind: 'restaurant';
      title: string;
      detail: string;
      href: string;
    }
  | {
      key: string;
      kind: 'dish';
      title: string;
      detail: string;
      href: string;
    };

const DEBOUNCE_MS = 180;

export function LiveTickerSearch({
  index,
  className,
}: {
  index: QuickSearchIndex;
  className?: string;
}) {
  const router = useRouter();
  const rootRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [query, setQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);

  useEffect(() => {
    const timer = window.setTimeout(
      () => setDebouncedQuery(query.trim()),
      DEBOUNCE_MS,
    );
    return () => window.clearTimeout(timer);
  }, [query]);

  useEffect(() => {
    const closeOnOutsidePress = (event: PointerEvent) => {
      const target = event.target;
      if (
        target instanceof Node &&
        rootRef.current &&
        !rootRef.current.contains(target)
      ) {
        setOpen(false);
        setActiveIndex(-1);
      }
    };
    document.addEventListener('pointerdown', closeOnOutsidePress);
    return () =>
      document.removeEventListener('pointerdown', closeOnOutsidePress);
  }, []);

  const suggestions = useMemo(() => {
    const needle = normalizeSearch(debouncedQuery);
    if (!needle) {
      const recommendedRestaurants: Suggestion[] = index.restaurants
        .slice(0, 3)
        .map((restaurant) => ({
          key: `restaurant-${restaurant.id}`,
          kind: 'restaurant',
          title: restaurant.name,
          detail: `${restaurant.area} · Popular with the squad`,
          href: `/restaurant/${restaurant.id}?from=homepage_search`,
        }));
      const recommendedDishes: Suggestion[] = [...index.dishes]
        .sort((a, b) => a.price - b.price || a.name.localeCompare(b.name))
        .slice(0, 3)
        .map((dish) => ({
          key: `dish-${dish.id}`,
          kind: 'dish',
          title: dish.name,
          detail: `${dish.restaurantName} · ₹${dish.price}`,
          href: `/restaurant/${dish.restaurantId}?from=homepage_search`,
        }));

      return [...recommendedRestaurants, ...recommendedDishes];
    }

    const restaurantMatches: Suggestion[] = index.restaurants
      .map((restaurant) => ({
        restaurant,
        score: searchScore(restaurant.name, needle),
      }))
      .filter(
        (
          match,
        ): match is {
          restaurant: (typeof index.restaurants)[number];
          score: number;
        } => match.score !== null,
      )
      .sort(
        (a, b) =>
          a.score - b.score ||
          b.restaurant.trendingViews - a.restaurant.trendingViews ||
          a.restaurant.name.localeCompare(b.restaurant.name),
      )
      .slice(0, 4)
      .map(({ restaurant }) => ({
        key: `restaurant-${restaurant.id}`,
        kind: 'restaurant',
        title: restaurant.name,
        detail: restaurant.area,
        href: `/restaurant/${restaurant.id}?from=homepage_search`,
      }));

    const dishMatches: Suggestion[] = index.dishes
      .map((dish) => ({ dish, score: searchScore(dish.name, needle) }))
      .filter(
        (
          match,
        ): match is {
          dish: (typeof index.dishes)[number];
          score: number;
        } => match.score !== null,
      )
      .sort(
        (a, b) =>
          a.score - b.score ||
          a.dish.price - b.dish.price ||
          a.dish.name.localeCompare(b.dish.name),
      )
      .slice(0, 6)
      .map(({ dish }) => ({
        key: `dish-${dish.id}`,
        kind: 'dish',
        title: dish.name,
        detail: `${dish.restaurantName} · ₹${dish.price}`,
        href: `/restaurant/${dish.restaurantId}?from=homepage_search`,
      }));

    return [...restaurantMatches, ...dishMatches];
  }, [debouncedQuery, index]);

  const isLoading = Boolean(query.trim()) && query.trim() !== debouncedQuery;
  const showDropdown = open;
  const activeSuggestion = suggestions[activeIndex];

  const clear = () => {
    setQuery('');
    setDebouncedQuery('');
    setOpen(true);
    setActiveIndex(-1);
    inputRef.current?.focus();
  };

  const navigateToSuggestion = (suggestion: Suggestion) => {
    setOpen(false);
    router.push(suggestion.href);
  };

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (activeSuggestion) {
      navigateToSuggestion(activeSuggestion);
      return;
    }
    const value = query.trim();
    if (!value) return;
    setOpen(false);
    router.push(`/search?q=${encodeURIComponent(value)}`);
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Escape') {
      setOpen(false);
      setActiveIndex(-1);
      return;
    }
    if (!showDropdown || suggestions.length === 0) return;
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      setActiveIndex((current) => (current + 1) % suggestions.length);
    }
    if (event.key === 'ArrowUp') {
      event.preventDefault();
      setActiveIndex((current) =>
        current <= 0 ? suggestions.length - 1 : current - 1,
      );
    }
  };

  return (
    <div
      ref={rootRef}
      className={cn(styles.root, className)}
      onBlurCapture={(event) => {
        const nextTarget = event.relatedTarget;
        if (
          nextTarget instanceof Node &&
          event.currentTarget.contains(nextTarget)
        ) {
          return;
        }
        setOpen(false);
        setActiveIndex(-1);
      }}
    >
      <form className={styles.form} role="search" onSubmit={submit}>
        <span className={styles.searchIconWrap}>
          <SearchIcon />
        </span>
        <input
          ref={inputRef}
          type="search"
          value={query}
          placeholder="What are you craving?"
          aria-label="Search restaurants or dishes"
          role="combobox"
          aria-autocomplete="list"
          aria-expanded={showDropdown}
          aria-controls="ticker-search-suggestions"
          aria-activedescendant={
            activeSuggestion
              ? `ticker-option-${activeSuggestion.key}`
              : undefined
          }
          onFocus={() => setOpen(true)}
          onChange={(event) => {
            setQuery(event.target.value);
            setOpen(Boolean(event.target.value.trim()));
            setActiveIndex(-1);
          }}
          onKeyDown={handleKeyDown}
        />
        {isLoading && (
          <span className={styles.spinner} aria-label="Searching" />
        )}
        {query && !isLoading && (
          <button
            type="button"
            className={styles.clearButton}
            onClick={clear}
            aria-label="Clear search"
          >
            ×
          </button>
        )}
      </form>

      {showDropdown && (
        <div
          id="ticker-search-suggestions"
          className={styles.dropdown}
          role="listbox"
          aria-label="Search suggestions"
        >
          {isLoading ? (
            <div className={styles.statusRow}>
              <span className={styles.smallSpinner} aria-hidden />
              Finding the good stuff…
            </div>
          ) : suggestions.length === 0 ? (
            <div className={styles.emptyState}>
              <strong>No matches yet.</strong>
              <span>Try a restaurant, dish, or a shorter craving.</span>
            </div>
          ) : (
            <SuggestionGroups
              suggestions={suggestions}
              activeIndex={activeIndex}
              recommended={!debouncedQuery}
              onChoose={navigateToSuggestion}
              onHover={setActiveIndex}
            />
          )}
          {!isLoading && Boolean(query.trim()) && (
            <button
              type="submit"
              className={styles.fullSearch}
              onClick={() => {
                const value = query.trim();
                if (value)
                  router.push(`/search?q=${encodeURIComponent(value)}`);
              }}
            >
              See all results for “{query.trim()}”
            </button>
          )}
        </div>
      )}
    </div>
  );
}

function SuggestionGroups({
  suggestions,
  activeIndex,
  recommended,
  onChoose,
  onHover,
}: {
  suggestions: Suggestion[];
  activeIndex: number;
  recommended: boolean;
  onChoose: (suggestion: Suggestion) => void;
  onHover: (index: number) => void;
}) {
  const groups = [
    {
      kind: 'restaurant' as const,
      label: recommended ? 'Recommended restaurants' : 'Restaurants',
      items: suggestions.filter((item) => item.kind === 'restaurant'),
    },
    {
      kind: 'dish' as const,
      label: recommended ? 'Quick dish picks' : 'Dishes',
      items: suggestions.filter((item) => item.kind === 'dish'),
    },
  ];

  return groups.map((group) =>
    group.items.length > 0 ? (
      <div key={group.kind} className={styles.group}>
        <span className={styles.groupLabel}>{group.label}</span>
        {group.items.map((suggestion) => {
          const index = suggestions.findIndex(
            (candidate) => candidate.key === suggestion.key,
          );
          return (
            <button
              key={suggestion.key}
              id={`ticker-option-${suggestion.key}`}
              type="button"
              role="option"
              aria-selected={index === activeIndex}
              className={
                index === activeIndex
                  ? `${styles.suggestion} ${styles.activeSuggestion}`
                  : styles.suggestion
              }
              onPointerEnter={() => onHover(index)}
              onClick={() => onChoose(suggestion)}
            >
              <span className={styles.typeIcon} aria-hidden>
                {group.kind === 'restaurant' ? <PlaceIcon /> : <DishIcon />}
              </span>
              <span className={styles.suggestionCopy}>
                <strong>{suggestion.title}</strong>
                <small>{suggestion.detail}</small>
              </span>
              <span className={styles.typeLabel}>
                {group.kind === 'restaurant' ? 'Restaurant' : 'Dish'}
              </span>
            </button>
          );
        })}
      </div>
    ) : null,
  );
}

function normalizeSearch(value: string) {
  return value
    .toLocaleLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

function searchScore(value: string, normalizedQuery: string) {
  const normalizedValue = normalizeSearch(value);
  if (normalizedValue === normalizedQuery) return 0;
  if (normalizedValue.startsWith(normalizedQuery)) return 1;

  const words = normalizedValue.split(' ');
  const queryWords = normalizedQuery.split(' ');
  if (
    queryWords.every((queryWord) =>
      words.some((word) => word.startsWith(queryWord)),
    )
  ) {
    return 2;
  }
  if (normalizedValue.includes(normalizedQuery)) return 3;

  const allowedDistance = normalizedQuery.length >= 7 ? 2 : 1;
  if (normalizedQuery.length < 3) return null;
  const closestDistance = Math.min(
    editDistance(normalizedValue, normalizedQuery),
    ...words.map((word) => editDistance(word, normalizedQuery)),
  );
  return closestDistance <= allowedDistance ? 4 + closestDistance : null;
}

function editDistance(left: string, right: string) {
  const previous = Array.from(
    { length: right.length + 1 },
    (_, index) => index,
  );

  for (let leftIndex = 1; leftIndex <= left.length; leftIndex += 1) {
    const current = [leftIndex];
    for (let rightIndex = 1; rightIndex <= right.length; rightIndex += 1) {
      current[rightIndex] = Math.min(
        current[rightIndex - 1] + 1,
        previous[rightIndex] + 1,
        previous[rightIndex - 1] +
          (left[leftIndex - 1] === right[rightIndex - 1] ? 0 : 1),
      );
    }
    previous.splice(0, previous.length, ...current);
  }

  return previous[right.length];
}

function SearchIcon() {
  return (
    <svg className={styles.searchIcon} viewBox="0 0 24 24" aria-hidden>
      <circle cx="11" cy="11" r="6.5" />
      <path d="m16 16 4 4" />
    </svg>
  );
}

function PlaceIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden>
      <path d="M12 21s6-5.8 6-12a6 6 0 1 0-12 0c0 6.2 6 12 6 12Z" />
      <circle cx="12" cy="9" r="2" />
    </svg>
  );
}

function DishIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden>
      <path d="M4 16h16M6 16a6 6 0 0 1 12 0M12 7V4M8 8 6.5 5.5M16 8l1.5-2.5" />
    </svg>
  );
}
