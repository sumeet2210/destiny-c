'use client';

// P5-3: per-day opening hours with split shifts and closed days.

import { useState, useTransition } from 'react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { useToast } from '@/components/ui/Toast';
import {
  DAY_LABELS,
  WEEK,
  type DayKey,
  type OpeningHours,
  type Shift,
} from '@/lib/domain/hours';
import { updateRestaurant } from '@/lib/owner/actions';

export function HoursEditor({ initial }: { initial: OpeningHours }) {
  const [hours, setHours] = useState<OpeningHours>(initial);
  const [pending, startTransition] = useTransition();
  const toast = useToast();

  const setDay = (day: DayKey, shifts: Shift[]) =>
    setHours((h) => ({ ...h, [day]: shifts }));

  return (
    <Card className="space-y-4">
      <div>
        <h2 className="font-display text-paper text-lg font-bold">
          Opening hours
        </h2>
        <p className="text-text-muted mt-1 text-[13px]">
          Split shifts are fine (lunch close, dinner reopen). A close time
          earlier than the open time means you run past midnight. No shifts =
          closed that day.
        </p>
      </div>

      {WEEK.map((day) => {
        const shifts = hours[day] ?? [];
        return (
          <div key={day} className="border-border-hairline border-t pt-3">
            <div className="flex items-center justify-between">
              <span className="text-paper text-sm font-medium">
                {DAY_LABELS[day]}
              </span>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() =>
                    setDay(day, [...shifts, { open: '11:00', close: '23:00' }])
                  }
                >
                  + shift
                </Button>
                {shifts.length > 0 && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setDay(day, [])}
                  >
                    Closed
                  </Button>
                )}
              </div>
            </div>
            {shifts.length === 0 ? (
              <p className="text-text-muted text-[13px]">Closed</p>
            ) : (
              shifts.map((shift, i) => (
                <div key={i} className="mt-2 flex items-center gap-2">
                  <Input
                    type="time"
                    aria-label={`${DAY_LABELS[day]} shift ${i + 1} opens`}
                    className="w-auto font-mono"
                    value={shift.open}
                    onChange={(e) =>
                      setDay(
                        day,
                        shifts.map((s, j) =>
                          j === i ? { ...s, open: e.target.value } : s,
                        ),
                      )
                    }
                  />
                  <span className="text-text-muted">–</span>
                  <Input
                    type="time"
                    aria-label={`${DAY_LABELS[day]} shift ${i + 1} closes`}
                    className="w-auto font-mono"
                    value={shift.close}
                    onChange={(e) =>
                      setDay(
                        day,
                        shifts.map((s, j) =>
                          j === i ? { ...s, close: e.target.value } : s,
                        ),
                      )
                    }
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    aria-label="Remove shift"
                    onClick={() =>
                      setDay(
                        day,
                        shifts.filter((_, j) => j !== i),
                      )
                    }
                  >
                    ✕
                  </Button>
                </div>
              ))
            )}
          </div>
        );
      })}

      <Button
        disabled={pending}
        onClick={() =>
          startTransition(async () => {
            const res = await updateRestaurant({ opening_hours: hours });
            toast(
              res.ok ? 'Hours saved' : (res.message ?? 'Could not save'),
              res.ok ? 'positive' : 'error',
            );
          })
        }
      >
        {pending ? 'Saving…' : 'Save hours'}
      </Button>
    </Card>
  );
}
