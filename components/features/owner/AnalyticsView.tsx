'use client';

// P7-2: 7/30 day toggle and source breakdown. The interesting number for an
// owner is the source split — did posting an event actually bring people?

import { useMemo, useState } from 'react';
import { Card } from '@/components/ui/Card';
import { Chip } from '@/components/ui/Chip';
import { CRAVINGS } from '@/config/cravings';

type Data = {
  totals: { last7: number; last30: number };
  byDay: { day: string; views: number }[];
  bySource: { source_filter: string; views: number }[];
};

const sourceLabel = (s: string): string => {
  if (s.startsWith('craving:')) {
    const tag = s.slice('craving:'.length);
    const craving = CRAVINGS.find((c) => c.tag === tag);
    return `Craving chip: ${craving?.label ?? tag}`;
  }
  return (
    {
      homepage_feed: 'Homepage feed',
      search: 'Search',
      quiz: 'The quiz',
      events: 'Events',
      friend_activity: 'Friend activity',
      direct: 'Direct / shared link',
    }[s] ?? s
  );
};

export function AnalyticsView({ data }: { data: Data }) {
  const [range, setRange] = useState<7 | 30>(7);
  const [mountedAt] = useState(() => Date.now());

  const days = useMemo(() => {
    const cutoff = mountedAt - range * 86_400_000;
    return data.byDay.filter((d) => new Date(d.day).getTime() >= cutoff);
  }, [data.byDay, range, mountedAt]);

  const total = range === 7 ? data.totals.last7 : data.totals.last30;
  const maxDay = Math.max(1, ...days.map((d) => d.views));
  const maxSource = Math.max(1, ...data.bySource.map((s) => s.views));

  return (
    <div className="space-y-5">
      <div className="flex gap-2">
        <Chip active={range === 7} onClick={() => setRange(7)}>
          Last 7 days
        </Chip>
        <Chip active={range === 30} onClick={() => setRange(30)}>
          Last 30 days
        </Chip>
      </div>

      <Card>
        <p className="text-text-muted text-[13px]">Profile views</p>
        <p className="text-paper mt-1 font-mono text-3xl font-bold">{total}</p>
      </Card>

      <Card className="space-y-2">
        <p className="text-paper text-sm font-semibold">By day</p>
        {days.length === 0 ? (
          <p className="text-text-muted text-[13px]">
            No views in this window yet.
          </p>
        ) : (
          <div className="space-y-1.5">
            {days.map((d) => (
              <div key={d.day} className="flex items-center gap-2 text-[12px]">
                <span className="text-text-muted w-16 shrink-0 font-mono">
                  {new Date(d.day).toLocaleDateString('en-IN', {
                    day: 'numeric',
                    month: 'short',
                  })}
                </span>
                <span
                  className="rounded-chip bg-accent-primary h-3"
                  style={{ width: `${(d.views / maxDay) * 100}%` }}
                />
                <span className="text-text-muted font-mono">{d.views}</span>
              </div>
            ))}
          </div>
        )}
      </Card>

      <Card className="space-y-2">
        <p className="text-paper text-sm font-semibold">What brought them</p>
        {data.bySource.length === 0 ? (
          <p className="text-text-muted text-[13px]">Nothing yet.</p>
        ) : (
          <div className="space-y-1.5">
            {data.bySource.map((s) => (
              <div
                key={s.source_filter}
                className="flex items-center gap-2 text-[12px]"
              >
                <span className="text-text-muted w-36 shrink-0 truncate">
                  {sourceLabel(s.source_filter)}
                </span>
                <span
                  className="rounded-chip bg-accent-secondary h-3"
                  style={{ width: `${(s.views / maxSource) * 70}%` }}
                />
                <span className="text-text-muted font-mono">{s.views}</span>
              </div>
            ))}
          </div>
        )}
        <p className="text-text-muted pt-1 text-[11px]">
          All-time split. If &ldquo;Events&rdquo; is climbing, your events are
          doing their job.
        </p>
      </Card>
    </div>
  );
}
