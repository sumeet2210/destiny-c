'use client';

import { useState, useTransition } from 'react';
import {
  FAVORITE_CUISINES,
  FOOD_TYPES,
  SPICE_PREFERENCES,
  isFavoriteCuisine,
  isFoodType,
  isSpicePreference,
  type FavoriteCuisine,
  type FoodType,
  type SpicePreference,
} from '@/config/food-preferences';
import { updateStudentFoodPreferences } from '@/lib/auth/actions';
import { cn } from '@/lib/cn';
import { useToast } from '@/components/ui/Toast';

export function FoodPreferences({
  initialFoodType,
  initialFavoriteCuisines,
  initialSpicePreference,
}: {
  initialFoodType?: string | null;
  initialFavoriteCuisines?: string[];
  initialSpicePreference?: string | null;
}) {
  const [foodType, setFoodType] = useState<FoodType | null>(
    isFoodType(initialFoodType) ? initialFoodType : null,
  );
  const [cuisines, setCuisines] = useState<FavoriteCuisine[]>(
    (initialFavoriteCuisines ?? []).filter(isFavoriteCuisine),
  );
  const [spice, setSpice] = useState<SpicePreference | null>(
    isSpicePreference(initialSpicePreference) ? initialSpicePreference : null,
  );
  const [editing, setEditing] = useState(
    !(
      isFoodType(initialFoodType) &&
      (initialFavoriteCuisines ?? []).some(isFavoriteCuisine) &&
      isSpicePreference(initialSpicePreference)
    ),
  );
  const [pending, startTransition] = useTransition();
  const toast = useToast();

  const toggleCuisine = (cuisine: FavoriteCuisine) =>
    setCuisines((current) =>
      current.includes(cuisine)
        ? current.filter((item) => item !== cuisine)
        : [...current, cuisine],
    );

  const save = () =>
    startTransition(async () => {
      const result = await updateStudentFoodPreferences({
        foodType,
        favoriteCuisines: cuisines,
        spicePreference: spice,
      });
      toast(
        result.ok ? 'Taste map saved' : (result.message ?? 'Could not save'),
        result.ok ? 'positive' : 'error',
      );
      if (result.ok) setEditing(false);
    });

  return (
    <section className="relative overflow-hidden rounded-[1.5rem] border border-white/10 bg-[radial-gradient(circle_at_100%_0%,rgba(29,185,84,0.16),transparent_32%),linear-gradient(145deg,#202020,#141414)] p-5 shadow-[0_20px_50px_rgba(0,0,0,0.28)]">
      <div
        className="pointer-events-none absolute top-0 right-0 size-32 rounded-full border border-[#1DB954]/15"
        aria-hidden
      />

      <header className="relative mb-6 flex items-center gap-3">
        <span className="grid size-10 place-items-center rounded-full bg-[#1DB954] text-black">
          <TasteIcon />
        </span>
        <div>
          <p className="text-[10px] font-black tracking-[0.18em] text-[#1DB954] uppercase">
            Taste map
          </p>
          <h2 className="font-display text-paper text-xl font-extrabold">
            Make Destiny yours
          </h2>
        </div>
      </header>

      {!editing ? (
        <div className="relative space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <PreferenceSummary
              label="Food type"
              value={
                FOOD_TYPES.find((option) => option.value === foodType)?.label ??
                'Not selected'
              }
            />
            <PreferenceSummary
              label="Spice"
              value={
                SPICE_PREFERENCES.find((option) => option.value === spice)
                  ?.label ?? 'Not selected'
              }
            />
          </div>
          <div className="rounded-xl border border-white/10 bg-black/20 p-3">
            <p className="text-text-muted text-[9px] font-black tracking-[0.14em] uppercase">
              Favorite cuisines
            </p>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {cuisines.map((cuisine) => (
                <span
                  key={cuisine}
                  className="rounded-full border border-[#1DB954]/30 bg-[#1DB954]/10 px-2.5 py-1 text-[10px] font-bold text-[#64E891]"
                >
                  {cuisine}
                </span>
              ))}
            </div>
          </div>
          <button
            type="button"
            onClick={() => setEditing(true)}
            className="inline-flex min-h-10 items-center gap-2 rounded-xl border border-white/15 px-3 text-[11px] font-extrabold text-white transition-colors hover:border-[#1DB954] hover:text-[#1DB954]"
          >
            <EditIcon />
            Edit preferences
          </button>
        </div>
      ) : (
        <>
          <fieldset className="relative space-y-3">
            <legend className="text-paper text-sm font-extrabold">
              Food type
            </legend>
            <div className="grid grid-cols-2 gap-2">
              {FOOD_TYPES.map((option) => {
                const selected = foodType === option.value;
                return (
                  <button
                    key={option.value}
                    type="button"
                    aria-pressed={selected}
                    onClick={() => setFoodType(option.value)}
                    className={cn(
                      'flex min-h-11 items-center gap-2 rounded-xl border px-3 text-left text-[12px] font-bold transition-[border-color,background-color,color,transform] active:scale-[0.98]',
                      selected
                        ? 'border-[#1DB954] bg-[#1DB954] text-black'
                        : 'border-white/10 bg-black/20 text-[#B8B8B8] hover:border-[#1DB954]/60 hover:text-white',
                    )}
                  >
                    <span
                      className={cn(
                        'size-2 rounded-full border',
                        selected
                          ? 'border-black bg-black'
                          : 'border-[#1DB954] bg-transparent',
                      )}
                    />
                    {option.label}
                  </button>
                );
              })}
            </div>
          </fieldset>

          <fieldset className="relative mt-6 space-y-3">
            <legend className="text-paper text-sm font-extrabold">
              Favorite cuisines
            </legend>
            <p className="text-text-muted -mt-2 text-[11px]">
              Pick as many as you like.
            </p>
            <div className="flex flex-wrap gap-2">
              {FAVORITE_CUISINES.map((cuisine) => {
                const selected = cuisines.includes(cuisine);
                return (
                  <button
                    key={cuisine}
                    type="button"
                    aria-pressed={selected}
                    onClick={() => toggleCuisine(cuisine)}
                    className={cn(
                      'rounded-full border px-3 py-2 text-[11px] font-bold transition-colors',
                      selected
                        ? 'border-[#1DB954] bg-[#1DB954]/15 text-[#64E891]'
                        : 'border-white/10 bg-black/20 text-[#969696] hover:border-white/25 hover:text-white',
                    )}
                  >
                    {selected ? '+ ' : ''}
                    {cuisine}
                  </button>
                );
              })}
            </div>
          </fieldset>

          <fieldset className="relative mt-6 space-y-3">
            <legend className="text-paper text-sm font-extrabold">
              Spice preference
            </legend>
            <div className="grid grid-cols-3 gap-2">
              {SPICE_PREFERENCES.map((option) => {
                const selected = spice === option.value;
                return (
                  <button
                    key={option.value}
                    type="button"
                    aria-pressed={selected}
                    onClick={() => setSpice(option.value)}
                    className={cn(
                      'rounded-xl border px-2 py-3 text-center transition-colors',
                      selected
                        ? 'border-[#1DB954] bg-[#1DB954]/12 text-white'
                        : 'border-white/10 bg-black/20 text-[#8A8A8A] hover:border-white/25',
                    )}
                  >
                    <span className="mb-2 flex h-3 items-end justify-center gap-0.5">
                      {[1, 2, 3].map((level) => (
                        <span
                          key={level}
                          className={cn(
                            'w-1 rounded-full',
                            level <= option.level
                              ? 'bg-[#1DB954]'
                              : 'bg-white/15',
                            level === 1 && 'h-1.5',
                            level === 2 && 'h-2.5',
                            level === 3 && 'h-3',
                          )}
                        />
                      ))}
                    </span>
                    <span className="text-[11px] font-extrabold">
                      {option.label}
                    </span>
                  </button>
                );
              })}
            </div>
          </fieldset>

          <button
            type="button"
            disabled={pending}
            onClick={save}
            className="mt-6 inline-flex min-h-11 w-full items-center justify-between rounded-xl border border-[#1DB954] bg-[#1DB954] px-4 text-[12px] font-black text-black transition-colors hover:bg-transparent hover:text-[#1DB954] disabled:cursor-wait disabled:opacity-60"
          >
            <span>{pending ? 'Saving taste map…' : 'Save my preferences'}</span>
            <span aria-hidden>→</span>
          </button>
        </>
      )}
    </section>
  );
}

function PreferenceSummary({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-white/10 bg-black/20 p-3">
      <p className="text-text-muted text-[9px] font-black tracking-[0.14em] uppercase">
        {label}
      </p>
      <p className="text-paper mt-1.5 text-xs font-extrabold">{value}</p>
    </div>
  );
}

function EditIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
      className="size-4 fill-none stroke-current stroke-2"
    >
      <path
        d="m4 20 4.2-1 10.4-10.4a2.1 2.1 0 0 0-3-3L5.2 16 4 20Zm10.2-13 3 3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function TasteIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
      className="size-5 fill-none stroke-current stroke-[1.8]"
    >
      <path
        d="M6 3v8a3 3 0 0 0 3 3V3M6 8h3M15 3v18M15 3c3 1 4 4 4 7v2h-4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
