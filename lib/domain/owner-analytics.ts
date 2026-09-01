export type AnalyticsViewEvent = {
  created_at: string;
  source_filter: string;
};

export type AnalyticsBookingEvent = {
  student_id: string;
  created_at: string;
  offer_id: string | null;
  status: string;
};

export type AnalyticsPeriod = {
  profileViews: number;
  offerViews: number;
  offerClaims: number;
  bookings: number;
  conversionRate: number;
  newCustomers: number;
  repeatCustomers: number;
  byDay: { day: string; views: number }[];
  bySource: { source_filter: string; views: number }[];
};

export type OwnerAnalyticsSummary = {
  saved: number;
  periods: Record<7 | 30, AnalyticsPeriod>;
};

const DAY_MS = 86_400_000;
const IST = 'Asia/Kolkata';

function dayKey(value: string) {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: IST,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date(value));
}

function summarizePeriod(
  days: 7 | 30,
  views: AnalyticsViewEvent[],
  bookings: AnalyticsBookingEvent[],
  now: number,
): AnalyticsPeriod {
  const cutoff = now - days * DAY_MS;
  const periodViews = views.filter(
    (view) => new Date(view.created_at).getTime() >= cutoff,
  );
  const validBookings = bookings.filter(
    (booking) => booking.status !== 'cancelled',
  );
  const periodBookings = validBookings.filter(
    (booking) => new Date(booking.created_at).getTime() >= cutoff,
  );

  const firstBookingByStudent = new Map<string, number>();
  for (const booking of validBookings) {
    const createdAt = new Date(booking.created_at).getTime();
    const current = firstBookingByStudent.get(booking.student_id);
    if (current === undefined || createdAt < current) {
      firstBookingByStudent.set(booking.student_id, createdAt);
    }
  }

  const activeCustomers = new Set(
    periodBookings.map((booking) => booking.student_id),
  );
  let newCustomers = 0;
  let repeatCustomers = 0;
  for (const studentId of activeCustomers) {
    const firstBooking = firstBookingByStudent.get(studentId);
    if (firstBooking !== undefined && firstBooking >= cutoff) {
      newCustomers += 1;
    } else {
      repeatCustomers += 1;
    }
  }

  const dayCounts = new Map<string, number>();
  const sourceCounts = new Map<string, number>();
  for (const view of periodViews) {
    const day = dayKey(view.created_at);
    dayCounts.set(day, (dayCounts.get(day) ?? 0) + 1);
    sourceCounts.set(
      view.source_filter,
      (sourceCounts.get(view.source_filter) ?? 0) + 1,
    );
  }

  return {
    profileViews: periodViews.length,
    offerViews: periodViews.filter((view) => view.source_filter === 'offer')
      .length,
    offerClaims: periodBookings.filter((booking) => booking.offer_id !== null)
      .length,
    bookings: periodBookings.length,
    conversionRate:
      periodViews.length === 0
        ? 0
        : (periodBookings.length / periodViews.length) * 100,
    newCustomers,
    repeatCustomers,
    byDay: [...dayCounts.entries()]
      .map(([day, dayViews]) => ({ day, views: dayViews }))
      .sort((a, b) => a.day.localeCompare(b.day)),
    bySource: [...sourceCounts.entries()]
      .map(([source_filter, sourceViews]) => ({
        source_filter,
        views: sourceViews,
      }))
      .sort((a, b) => b.views - a.views),
  };
}

export function buildOwnerAnalyticsSummary({
  views,
  bookings,
  saved,
  now = Date.now(),
}: {
  views: AnalyticsViewEvent[];
  bookings: AnalyticsBookingEvent[];
  saved: number;
  now?: number;
}): OwnerAnalyticsSummary {
  return {
    saved,
    periods: {
      7: summarizePeriod(7, views, bookings, now),
      30: summarizePeriod(30, views, bookings, now),
    },
  };
}
