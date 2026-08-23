// Seed-mode API tests. With no Supabase configured, public reads serve the typed
// seed and every authed route is walled off at 503 by requireUser — so the
// booking-window / single-experience / 15-day validations (which live behind that
// wall) are exercised by calling their controllers directly, before any DB touch.
import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { createApp } from '../src/app.js';
import { isSupabaseConfigured } from '../src/config/index.js';
import { validateBookingWindow } from '../src/lib/domain/booking.js';
import { create as createBooking } from '../src/controllers/bookings.controller.js';
import { upsertEvent } from '../src/controllers/owner.controller.js';
import {
  setRestaurantStatus,
  updateUser,
  moderateOffer,
} from '../src/controllers/admin.controller.js';

const app = createApp();
const HOUR = 3_600_000;
const DAY = 24 * HOUR;
const iso = (ms) => new Date(Date.now() + ms).toISOString();

/** A res double for controllers whose validation rejects before any DB access. */
function mockRes() {
  return {
    statusCode: 200,
    payload: undefined,
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(body) {
      this.payload = body;
      return this;
    },
  };
}

describe('environment', () => {
  it('runs this suite in seed mode (no live Supabase)', () => {
    // If this fails, a stray backend/.env is pointing the suite at a real
    // project; the auth-wall and seed-shape assertions below assume seed mode.
    expect(isSupabaseConfigured()).toBe(false);
  });
});

describe('health + routing', () => {
  it('GET /health', async () => {
    const res = await request(app).get('/health');
    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({ ok: true, service: 'destiny-backend' });
  });

  it('unknown route → 404 envelope', async () => {
    const res = await request(app).get('/nope');
    expect(res.status).toBe(404);
    expect(res.body).toEqual({ ok: false, error: 'Not found' });
  });
});

describe('public catalog reads (seed)', () => {
  it('GET /restaurants returns a summary list', async () => {
    const res = await request(app).get('/restaurants');
    expect(res.status).toBe(200);
    expect(res.body.ok).toBe(true);
    expect(Array.isArray(res.body.restaurants)).toBe(true);
    expect(res.body.restaurants.length).toBeGreaterThan(0);
    const first = res.body.restaurants[0];
    expect(first).toHaveProperty('id');
    expect(first).toHaveProperty('name');
    expect(first).toHaveProperty('isOpen');
  });

  it('filters are applied server-side (veg=veg)', async () => {
    const res = await request(app).get('/restaurants?veg=veg');
    expect(res.status).toBe(200);
    expect(res.body.restaurants.every((r) => r.is_veg_only)).toBe(true);
  });

  it('GET /restaurants/:id returns a detail bundle; unknown → 404', async () => {
    const list = await request(app).get('/restaurants');
    const id = list.body.restaurants[0].id;
    const res = await request(app).get(`/restaurants/${id}`);
    expect(res.status).toBe(200);
    expect(res.body.ok).toBe(true);
    for (const key of ['summary', 'menu', 'offers', 'events', 'reviews']) {
      expect(res.body).toHaveProperty(key);
    }

    const missing = await request(app).get('/restaurants/does-not-exist');
    expect(missing.status).toBe(404);
    expect(missing.body.ok).toBe(false);
  });

  it('GET /restaurants/:id/also-like returns an array', async () => {
    const list = await request(app).get('/restaurants');
    const id = list.body.restaurants[0].id;
    const res = await request(app).get(`/restaurants/${id}/also-like`);
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.restaurants)).toBe(true);
  });

  it('GET /offers/ticker returns an array', async () => {
    const res = await request(app).get('/offers/ticker');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.offers)).toBe(true);
  });

  it('GET /search/index returns restaurants + dishes', async () => {
    const res = await request(app).get('/search/index');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.restaurants)).toBe(true);
    expect(Array.isArray(res.body.dishes)).toBe(true);
  });

  it('GET /search/dishes?q= returns hits', async () => {
    const res = await request(app).get('/search/dishes?q=a');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.dishes)).toBe(true);
  });

  it('GET /events + interest-counts', async () => {
    const list = await request(app).get('/events');
    expect(list.status).toBe(200);
    expect(Array.isArray(list.body.events)).toBe(true);

    const counts = await request(app).get('/events/interest-counts');
    expect(counts.status).toBe(200);
    expect(counts.body.ok).toBe(true);
    expect(typeof counts.body.counts).toBe('object');
  });
});

describe('profile-view logger (anon, seed)', () => {
  it('POST /views acknowledges without writing', async () => {
    const res = await request(app)
      .post('/views')
      .send({ restaurantId: 'r1', source: 'search' });
    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({ ok: true, mode: 'seed' });
  });

  it('POST /views without restaurantId → 400', async () => {
    const res = await request(app).post('/views').send({ source: 'search' });
    expect(res.status).toBe(400);
    expect(res.body.ok).toBe(false);
  });
});

describe('auth wall (seed mode → 503)', () => {
  const authedGets = ['/bookings', '/social/saved', '/owner/bundle', '/auth/me'];
  for (const path of authedGets) {
    it(`GET ${path} → 503`, async () => {
      const res = await request(app).get(path);
      expect(res.status).toBe(503);
      expect(res.body.ok).toBe(false);
    });
  }

  it('POST /auth/student/otp → 503 (auth needs a project)', async () => {
    const res = await request(app)
      .post('/auth/student/otp')
      .send({ email: 'someone@student.nitw.ac.in' });
    expect(res.status).toBe(503);
  });
});

describe('cron secret gating', () => {
  it('POST /cron/reminders without a token → 401', async () => {
    const res = await request(app).post('/cron/reminders');
    expect(res.status).toBe(401);
    expect(res.body).toEqual({ ok: false, error: 'unauthorized' });
  });

  it('POST /cron/reminders with a wrong token → 401', async () => {
    const res = await request(app)
      .post('/cron/reminders')
      .set('Authorization', 'Bearer not-the-secret');
    expect(res.status).toBe(401);
  });
});

describe('admin console auth wall (seed mode → 503)', () => {
  // Admin routes run on the service-role client, but requireUser walls them off
  // before any handler when there is no live project — so no service key is ever
  // touched in seed mode. Both guards (requireUser + requireAdmin) sit on the
  // router; here we prove the first one holds.
  const adminGets = [
    '/admin/overview',
    '/admin/restaurants',
    '/admin/users',
    '/admin/offers/flagged',
    '/admin/reviews',
  ];
  for (const path of adminGets) {
    it(`GET ${path} → 503`, async () => {
      const res = await request(app).get(path);
      expect(res.status).toBe(503);
      expect(res.body.ok).toBe(false);
    });
  }

  it('POST /admin/restaurants/:id/status → 503', async () => {
    const res = await request(app)
      .post('/admin/restaurants/r1/status')
      .send({ status: 'active' });
    expect(res.status).toBe(503);
  });

  it('PATCH /admin/users/:id → 503', async () => {
    const res = await request(app)
      .patch('/admin/users/u1')
      .send({ role: 'owner' });
    expect(res.status).toBe(503);
  });
});

describe('admin validation (pre-DB paths)', () => {
  it('setRestaurantStatus rejects an invalid status (400)', async () => {
    const req = { params: { id: 'r1' }, body: { status: 'bogus' } };
    await expect(setRestaurantStatus(req, mockRes())).rejects.toMatchObject({
      status: 400,
    });
  });

  it('updateUser rejects an empty patch (400)', async () => {
    const req = { params: { id: 'u1' }, user: { id: 'admin-1' }, body: {} };
    await expect(updateUser(req, mockRes())).rejects.toMatchObject({
      status: 400,
    });
  });

  it('updateUser rejects an invalid role (400)', async () => {
    const req = {
      params: { id: 'u1' },
      user: { id: 'admin-1' },
      body: { role: 'superuser' },
    };
    await expect(updateUser(req, mockRes())).rejects.toMatchObject({
      status: 400,
    });
  });

  it('updateUser blocks an admin demoting themselves (400)', async () => {
    const req = {
      params: { id: 'admin-1' },
      user: { id: 'admin-1' },
      body: { role: 'owner' },
    };
    await expect(updateUser(req, mockRes())).rejects.toMatchObject({
      status: 400,
    });
  });

  it('moderateOffer rejects an unknown action (400)', async () => {
    const req = { params: { id: 'o1' }, body: { action: 'nuke' } };
    await expect(moderateOffer(req, mockRes())).rejects.toMatchObject({
      status: 400,
    });
  });
});

describe('booking-window validation (domain source of truth)', () => {
  it('rejects under the 1-hour lead time', () => {
    const r = validateBookingWindow(new Date(Date.now() + 10 * 60_000), new Date(Date.now() + 70 * 60_000));
    expect(r.ok).toBe(false);
  });

  it('rejects an end at/before the start', () => {
    const start = new Date(Date.now() + 3 * HOUR);
    const r = validateBookingWindow(start, new Date(start.getTime() - 60_000));
    expect(r.ok).toBe(false);
  });

  it('accepts a valid window', () => {
    const start = new Date(Date.now() + 3 * HOUR);
    const r = validateBookingWindow(start, new Date(start.getTime() + HOUR));
    expect(r.ok).toBe(true);
  });
});

describe('booking create validation (pre-DB paths)', () => {
  const base = {
    restaurantId: 'r1',
    bookingTime: iso(3 * HOUR),
    bookingEndTime: iso(4 * HOUR),
    headcount: 2,
  };

  it('rejects choosing an offer AND an event (single-experience)', async () => {
    const req = { body: { ...base, offerId: 'o1', eventId: 'e1' } };
    await expect(createBooking(req, mockRes())).rejects.toMatchObject({
      status: 400,
    });
  });

  it('rejects a headcount over 15', async () => {
    const req = { body: { ...base, headcount: 99 } };
    await expect(createBooking(req, mockRes())).rejects.toMatchObject({
      status: 400,
    });
  });

  it('rejects a start inside the lead-time window (422)', async () => {
    const req = {
      body: { ...base, bookingTime: iso(10 * 60_000), bookingEndTime: iso(2 * HOUR) },
    };
    await expect(createBooking(req, mockRes())).rejects.toMatchObject({
      status: 422,
    });
  });
});

describe('owner event validation (15-day publish window)', () => {
  // Minimal req.db so ownedRestaurantId() resolves before the window check runs.
  const reqWith = (body) => ({
    user: { id: 'owner-1' },
    db: {
      from: () => ({
        select: () => ({
          eq: () => ({ maybeSingle: async () => ({ data: { id: 'r1' } }) }),
        }),
      }),
    },
    body,
  });

  it('rejects an event more than 15 days out', async () => {
    const req = reqWith({ title: 'Gig', event_type: 'music', starts_at: iso(20 * DAY) });
    await expect(upsertEvent(req, mockRes())).rejects.toMatchObject({
      status: 422,
    });
  });

  it('rejects an invalid start date', async () => {
    const req = reqWith({ title: 'Gig', event_type: 'music', starts_at: 'not-a-date' });
    await expect(upsertEvent(req, mockRes())).rejects.toMatchObject({
      status: 422,
    });
  });
});
