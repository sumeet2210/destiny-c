import { describe, expect, it } from 'vitest';
import { buildOwnerAnalyticsSummary } from './owner-analytics';

const NOW = Date.parse('2026-09-01T12:00:00.000Z');
const daysAgo = (days: number) =>
  new Date(NOW - days * 86_400_000).toISOString();

describe('buildOwnerAnalyticsSummary', () => {
  it('builds the view, offer, booking, and conversion funnel', () => {
    const summary = buildOwnerAnalyticsSummary({
      now: NOW,
      saved: 9,
      views: [
        { created_at: daysAgo(1), source_filter: 'offer' },
        { created_at: daysAgo(2), source_filter: 'search' },
        { created_at: daysAgo(12), source_filter: 'offer' },
      ],
      bookings: [
        {
          student_id: 'new-student',
          created_at: daysAgo(1),
          offer_id: 'offer-1',
          status: 'confirmed',
        },
      ],
    });

    expect(summary.saved).toBe(9);
    expect(summary.periods[7]).toMatchObject({
      profileViews: 2,
      offerViews: 1,
      offerClaims: 1,
      bookings: 1,
      conversionRate: 50,
      newCustomers: 1,
      repeatCustomers: 0,
    });
    expect(summary.periods[30].profileViews).toBe(3);
  });

  it('classifies customers by whether their first booking predates the range', () => {
    const summary = buildOwnerAnalyticsSummary({
      now: NOW,
      saved: 0,
      views: [],
      bookings: [
        {
          student_id: 'returning-student',
          created_at: daysAgo(40),
          offer_id: null,
          status: 'completed',
        },
        {
          student_id: 'returning-student',
          created_at: daysAgo(2),
          offer_id: null,
          status: 'confirmed',
        },
        {
          student_id: 'new-student',
          created_at: daysAgo(3),
          offer_id: null,
          status: 'requested',
        },
      ],
    });

    expect(summary.periods[7].newCustomers).toBe(1);
    expect(summary.periods[7].repeatCustomers).toBe(1);
    expect(summary.periods[7].conversionRate).toBe(0);
  });

  it('excludes cancelled bookings from actions and customer counts', () => {
    const summary = buildOwnerAnalyticsSummary({
      now: NOW,
      saved: 0,
      views: [{ created_at: daysAgo(1), source_filter: 'direct' }],
      bookings: [
        {
          student_id: 'cancelled-student',
          created_at: daysAgo(1),
          offer_id: 'offer-1',
          status: 'cancelled',
        },
      ],
    });

    expect(summary.periods[7]).toMatchObject({
      bookings: 0,
      offerClaims: 0,
      newCustomers: 0,
      repeatCustomers: 0,
      conversionRate: 0,
    });
  });
});
