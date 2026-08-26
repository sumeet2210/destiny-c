'use client';

import { useState, useTransition } from 'react';
import { Card } from '@/components/ui/Card';
import { Chip } from '@/components/ui/Chip';
import { useToast } from '@/components/ui/Toast';
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
import { updateStudentProfile } from '@/lib/auth/actions';
import { cn } from '@/lib/cn';

/**
 * The student's taste map: food type, favourite cuisines, spice level.
 *
 * Stored, not yet acted on — nothing in the catalog reads these columns today,
 * so the copy promises only that Destiny will remember them. Saying more would
 * be a promise the feed does not keep.
 *
 * Every field is optional and clearable. A blank answer has to stay different
 * from an answer, both because it is honest and because whatever eventually
 * reads these columns must be able to tell "no preference" from "vegetarian".
 *
 * Incoming values are re-checked against config/food-preferences.ts rather than
 * trusted: they are plain text columns behind a CHECK constraint, so a
 * vocabulary that ever shrinks would otherwise leave a dead value selected.
 */
export function FoodPreferences({
  initialFoodType,
  initialFavoriteCuisines,
  initialSpicePreference,
}: {
  initialFoodType: string | null;
  initialFavoriteCuisines: string[] | null;
  initialSpicePreference: string | null;
}) {
  const savedFoodType = isFoodType(initialFoodType) ? initialFoodType : null;
  const savedCuisines = (initialFavoriteCuisines ?? []).filter(
    isFavoriteCuisine,
  );
  const savedSpice = isSpicePreference(initialSpicePreference)
    ? initialSpicePreference
    : null;

  const [foodType, setFoodType] = useState<FoodType | null>(savedFoodType);
  const [cuisines, setCuisines] = useState<FavoriteCuisine[]>(savedCuisines);
  const [spice, setSpice] = useState<SpicePreference | null>(savedSpice);
  // Start on the editor only when there is nothing to summarise. A student who
  // answered one of the three still gets the summary, with the rest reading
  // "No preference" and an Edit button next to it.
  const [editing, setEditing] = useState(
    !savedFoodType && !savedCuisines.length && !savedSpice,
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
      const result = await updateStudentProfile({
        food_type: foodType,
        favorite_cuisines: cuisines,
        spice_preference: spice,
      });
      toast(
        result.ok ? 'Taste map saved' : (result.message ?? 'Could not save'),
        result.ok ? 'positive' : 'error',
      );
      if (result.ok) setEditing(false);
    });

  return (
    <Card className="space-y-5">
      <header>
        <p className="text-accent-primary text-[10px] font-extrabold tracking-[0.14em] uppercase">
          Taste map
        </p>
        <h2 className="font-display text-paper mt-1 text-lg font-extrabold">
          Make Destiny yours
        </h2>
        <p className="text-text-muted mt-1 text-[13px]">
          Tell us how you eat and we&apos;ll remember it. Optional, and yours to
          change or clear any time.
        </p>
      </header>

      {!editing ? (
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <PreferenceSummary
              label="Food type"
              value={
                FOOD_TYPES.find((option) => option.value === foodType)?.label ??
                'No preference'
              }
            />
            <PreferenceSummary
              label="Spice"
              value={
                SPICE_PREFERENCES.find((option) => option.value === spice)
                  ?.label ?? 'No preference'
              }
            />
          </div>
          <div className="rounded-control border-border-hairline border border-dashed p-3">
            <span className="text-text-muted block text-[10px] font-extrabold tracking-[0.12em] uppercase">
              Favourite cuisines
            </span>
            {cuisines.length ? (
              <div className="mt-2 flex flex-wrap gap-1.5">
                {cuisines.map((cuisine) => (
                  <span
                    key={cuisine}
                    className="rounded-chip border-accent-primary/40 bg-accent-primary/10 text-accent-primary border px-2.5 py-1 text-[11px] font-bold"
                  >
                    {cuisine}
                  </span>
                ))}
              </div>
            ) : (
              <p className="text-paper mt-1 text-sm font-medium">
                None picked yet
              </p>
            )}
          </div>
          <button
            type="button"
            onClick={() => setEditing(true)}
            className="rounded-control border-border-hairline text-paper hover:bg-surface-raised inline-flex min-h-11 items-center border px-3 text-[13px] font-extrabold"
          >
            Edit preferences
          </button>
        </div>
      ) : (
        <div className="space-y-5">
          <fieldset className="space-y-2">
            <legend className="text-paper text-sm font-extrabold">
              Food type
            </legend>
            <p className="text-text-muted text-[12px]">
              Tap the selected one again to clear it.
            </p>
            <div className="grid grid-cols-2 gap-2">
              {FOOD_TYPES.map((option) => (
                <Chip
                  key={option.value}
                  active={foodType === option.value}
                  onClick={() =>
                    setFoodType((current) =>
                      current === option.value ? null : option.value,
                    )
                  }
                  className="justify-center"
                >
                  {option.label}
                </Chip>
              ))}
            </div>
          </fieldset>

          <fieldset className="space-y-2">
            <legend className="text-paper text-sm font-extrabold">
              Favourite cuisines
            </legend>
            <p className="text-text-muted text-[12px]">
              Pick as many as you like.
            </p>
            <div className="flex flex-wrap gap-2">
              {FAVORITE_CUISINES.map((cuisine) => (
                <Chip
                  key={cuisine}
                  active={cuisines.includes(cuisine)}
                  onClick={() => toggleCuisine(cuisine)}
                >
                  {cuisine}
                </Chip>
              ))}
            </div>
          </fieldset>

          <fieldset className="space-y-2">
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
                    onClick={() =>
                      setSpice((current) =>
                        current === option.value ? null : option.value,
                      )
                    }
                    className={cn(
                      'rounded-control min-h-11 border px-2 py-2 text-center transition-colors',
                      selected
                        ? 'border-accent-primary bg-accent-primary text-ink-on-primary'
                        : 'border-border-hairline bg-surface-raised text-paper',
                    )}
                  >
                    <span
                      className="mb-1.5 flex h-3 items-end justify-center gap-0.5"
                      aria-hidden
                    >
                      {[1, 2, 3].map((level) => (
                        <span
                          key={level}
                          className={cn(
                            'w-1 rounded-full',
                            level <= option.level
                              ? selected
                                ? 'bg-ink-on-primary'
                                : 'bg-accent-primary'
                              : selected
                                ? 'bg-ink-on-primary/25'
                                : 'bg-border-hairline',
                            level === 1 && 'h-1.5',
                            level === 2 && 'h-2.5',
                            level === 3 && 'h-3',
                          )}
                        />
                      ))}
                    </span>
                    <span className="block text-[12px] font-extrabold">
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
            className="rounded-control border-accent-primary bg-accent-primary text-ink-on-primary inline-flex min-h-11 w-full items-center justify-between border px-4 text-[13px] font-extrabold disabled:cursor-wait disabled:opacity-60"
          >
            <span>{pending ? 'Saving…' : 'Save my preferences'}</span>
            <span aria-hidden>→</span>
          </button>
        </div>
      )}
    </Card>
  );
}

function PreferenceSummary({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-control border-border-hairline border border-dashed p-3">
      <span className="text-text-muted block text-[10px] font-extrabold tracking-[0.12em] uppercase">
        {label}
      </span>
      <p className="text-paper mt-1 text-sm font-medium">{value}</p>
    </div>
  );
}
