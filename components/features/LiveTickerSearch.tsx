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

export function LiveTickerSearch({ index }: { index: QuickSearchIndex }) {
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
    const needle = debouncedQuery.toLocaleLowerCase();
    if (!needle) return [];

    const restaurantMatches: Suggestion[] = index.restaurants
      .filter((restaurant) =>
        restaurant.name.toLocaleLowerCase().includes(needle),
      )
      .slice(0, 4)
      .map((restaurant) => ({
        key: `restaurant-${restaurant.id}`,
        kind: 'restaurant',
        title: restaurant.name,
        detail: restaurant.area,
        href: `/restaurant/${restaurant.id}?from=homepage_search`,
      }));

    const dishMatches: Suggestion[] = index.dishes
      .filter((dish) => dish.name.toLocaleLowerCase().includes(needle))
      .slice(0, 6)
      .map((dish) => ({
        key: `dish-${dish.id}`,
        kind: 'dish',
        title: dish.name,
        detail: `${dish.restaurantName} · ₹${dish.price}`,
        href: `/restaurant/${dish.restaurantId}?from=homepage_search`,
      }));

    return [...restaurantMatches, ...dishMatches];
  }, [debouncedQuery, index]);

  const isLoading = query.trim() !== debouncedQuery;
  const showDropdown = open && query.trim().length > 0;
  const activeSuggestion = suggestions[activeIndex];

  const clear = () => {
    setQuery('');
    setDebouncedQuery('');
    setOpen(false);
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
    <div ref={rootRef} className={styles.root}>
      <form className={styles.form} role="search" onSubmit={submit}>
        <SearchIcon />
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
          onFocus={() => {
            if (query.trim()) setOpen(true);
          }}
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
              onChoose={navigateToSuggestion}
              onHover={setActiveIndex}
            />
          )}
          {!isLoading && (
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
  onChoose,
  onHover,
}: {
  suggestions: Suggestion[];
  activeIndex: number;
  onChoose: (suggestion: Suggestion) => void;
  onHover: (index: number) => void;
}) {
  const groups = [
    {
      kind: 'restaurant' as const,
      label: 'Restaurants',
      items: suggestions.filter((item) => item.kind === 'restaurant'),
    },
    {
      kind: 'dish' as const,
      label: 'Dishes',
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
                {group.label.slice(0, -1)}
              </span>
            </button>
          );
        })}
      </div>
    ) : null,
  );
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
