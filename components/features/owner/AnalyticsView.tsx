'use client';

import { useState } from 'react';
import { Chip } from '@/components/ui/Chip';
import { CRAVINGS } from '@/config/cravings';
import type { OwnerAnalyticsSummary } from '@/lib/domain/owner-analytics';
import styles from './analytics-view.module.css';

const sourceLabel = (source: string): string => {
  if (source.startsWith('craving:')) {
    const tag = source.slice('craving:'.length);
    const craving = CRAVINGS.find((item) => item.tag === tag);
    return `Craving: ${craving?.label ?? tag}`;
  }

  return (
    {
      homepage_feed: 'Homepage feed',
      search: 'Search',
      quiz: 'The quiz',
      events: 'Events',
      friend_activity: 'Friend activity',
      offer: 'Offer cards',
      direct: 'Direct or shared link',
    }[source] ?? source
  );
};

function formatPercent(value: number) {
  if (value === 0) return '0%';
  return `${value < 10 ? value.toFixed(1) : Math.round(value)}%`;
}

export function AnalyticsView({
  data,
  ratings,
}: {
  data: OwnerAnalyticsSummary;
  ratings: { average: number | null; count: number };
}) {
  const [range, setRange] = useState<7 | 30>(7);
  const period = data.periods[range];
  const maxDay = Math.max(1, ...period.byDay.map((day) => day.views));
  const maxSource = Math.max(
    1,
    ...period.bySource.map((source) => source.views),
  );

  return (
    <div className={styles.dashboard}>
      <div className={styles.rangeBar}>
        <div className={styles.rangeControls} aria-label="Analytics date range">
          <Chip active={range === 7} onClick={() => setRange(7)}>
            7 days
          </Chip>
          <Chip active={range === 30} onClick={() => setRange(30)}>
            30 days
          </Chip>
        </div>
      </div>

      <section className={styles.funnel} aria-labelledby="conversion-title">
        <div className={styles.funnelHeader}>
          <h2 id="conversion-title">Your conversion journey</h2>
        </div>

        <div className={styles.journey}>
          <JourneyStep
            number="01"
            label="Profile Views"
            value={period.profileViews.toLocaleString('en-IN')}
            detail="Students who opened your profile"
          />
          <JourneyStep
            number="02"
            label="Bookings"
            value={period.bookings.toLocaleString('en-IN')}
            detail={`${period.offerClaims.toLocaleString('en-IN')} made with an offer`}
          />
          <JourneyStep
            number="03"
            label="Conversion Rate"
            value={formatPercent(period.conversionRate)}
            detail="Views that became an action"
            accent
          />
        </div>

        <p className={styles.formulaNote}>
          Conversion Rate — Views → bookings/claims. Offer claims are bookings
          made with an offer, so every customer action is counted once.
        </p>
      </section>

      <section aria-labelledby="customer-title">
        <SectionHeading
          id="customer-title"
          title="Who is choosing you"
          copy="Saves show future intent; new and repeat customers show who acted in this period."
        />
        <div className={styles.customerGrid}>
          <MetricCard
            label="Saved"
            value={data.saved.toLocaleString('en-IN')}
            detail="Current students who saved your restaurant"
            meta="Current total"
          />
          <MetricCard
            label="New Customers"
            value={period.newCustomers.toLocaleString('en-IN')}
            detail="First booking with your restaurant"
            meta={`Last ${range} days`}
          />
          <MetricCard
            label="Repeat Customers"
            value={period.repeatCustomers.toLocaleString('en-IN')}
            detail="Returned after an earlier booking"
            meta={`Last ${range} days`}
          />
        </div>
      </section>

      <section
        className={styles.splitSection}
        aria-label="Offer and rating metrics"
      >
        <article className={styles.offerCard}>
          <div>
            <h2>Offer Views &amp; Claims</h2>
            <p>
              See whether offer discovery is turning into reservation intent.
            </p>
          </div>
          <div className={styles.offerValues}>
            <div>
              <strong>{period.offerViews.toLocaleString('en-IN')}</strong>
              <span>Offer views</span>
            </div>
            <div>
              <strong>{period.offerClaims.toLocaleString('en-IN')}</strong>
              <span>Claims</span>
            </div>
          </div>
        </article>

        <div className={styles.ratingGrid}>
          <MetricCard
            label="Total Ratings"
            value={ratings.count.toLocaleString('en-IN')}
            detail="Ratings received from completed visits"
            meta="All time"
          />
          <MetricCard
            label="Average Rating"
            value={ratings.average === null ? '—' : ratings.average.toFixed(1)}
            detail="Your public score out of 5"
            meta="All time"
            accent
          />
        </div>
      </section>

      <section aria-labelledby="attention-title">
        <SectionHeading
          id="attention-title"
          kicker="Attention detail"
          title="When and where students found you"
          copy={`Profile-view detail for the last ${range} days.`}
        />
        <div className={styles.chartGrid}>
          <article className={styles.chartCard}>
            <h3>Views by day</h3>
            {period.byDay.length === 0 ? (
              <EmptyChart />
            ) : (
              <div className={styles.barList}>
                {period.byDay.map((day) => (
                  <div key={day.day} className={styles.barRow}>
                    <span>
                      {new Date(`${day.day}T12:00:00`).toLocaleDateString(
                        'en-IN',
                        { day: 'numeric', month: 'short' },
                      )}
                    </span>
                    <div className={styles.barTrack}>
                      <div
                        className={styles.primaryBar}
                        style={{ width: `${(day.views / maxDay) * 100}%` }}
                        aria-label={`${day.views} profile views`}
                      />
                    </div>
                    <strong>{day.views}</strong>
                  </div>
                ))}
              </div>
            )}
          </article>

          <article className={styles.chartCard}>
            <h3>Discovery sources</h3>
            {period.bySource.length === 0 ? (
              <EmptyChart />
            ) : (
              <div className={styles.barList}>
                {period.bySource.map((source) => (
                  <div key={source.source_filter} className={styles.barRow}>
                    <span title={sourceLabel(source.source_filter)}>
                      {sourceLabel(source.source_filter)}
                    </span>
                    <div className={styles.barTrack}>
                      <div
                        className={styles.secondaryBar}
                        style={{
                          width: `${(source.views / maxSource) * 100}%`,
                        }}
                        aria-label={`${source.views} profile views from ${sourceLabel(source.source_filter)}`}
                      />
                    </div>
                    <strong>{source.views}</strong>
                  </div>
                ))}
              </div>
            )}
          </article>
        </div>
      </section>
    </div>
  );
}

function JourneyStep({
  number,
  label,
  value,
  detail,
  accent = false,
}: {
  number: string;
  label: string;
  value: string;
  detail: string;
  accent?: boolean;
}) {
  return (
    <div className={styles.journeyStep} data-accent={accent || undefined}>
      <span className={styles.stepNumber}>{number}</span>
      <p>{label}</p>
      <strong>{value}</strong>
      <small>{detail}</small>
    </div>
  );
}

function MetricCard({
  label,
  value,
  detail,
  meta,
  accent = false,
}: {
  label: string;
  value: string;
  detail: string;
  meta: string;
  accent?: boolean;
}) {
  return (
    <article className={styles.metricCard} data-accent={accent || undefined}>
      <div className={styles.metricTopline}>
        <h3>{label}</h3>
        <span>{meta}</span>
      </div>
      <strong>{value}</strong>
      <p>{detail}</p>
    </article>
  );
}

function SectionHeading({
  id,
  kicker,
  title,
  copy,
}: {
  id: string;
  kicker?: string;
  title: string;
  copy: string;
}) {
  return (
    <div className={styles.sectionHeading}>
      {kicker ? <p>{kicker}</p> : null}
      <h2 id={id}>{title}</h2>
      <span>{copy}</span>
    </div>
  );
}

function EmptyChart() {
  return (
    <div className={styles.emptyChart}>
      <p>No activity in this window yet.</p>
      <span>New profile activity will appear here.</span>
    </div>
  );
}
