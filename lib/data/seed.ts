// P1-12: seed data. Six restaurants with real opening hours, ~40 menu items,
// 8 offers, 5+ events, spread across craving, vibe and price buckets.
//
// This file is the single source of demo data. It powers:
//   1. Fallback mode — lib/queries/* serve these objects when Supabase env
//      vars are absent (docs/decisions.md 2026-08-07).
//   2. supabase/seed.sql — regenerate with `npm run gen:seed` after editing.
//
// Offer expiries and event times are computed relative to load time so the
// demo always has live offers and upcoming events.

import type { Tables } from '@/types/db';

export type SeedRestaurant = Tables<'restaurants'>;
export type SeedMenuItem = Tables<'menu_items'>;
export type SeedOffer = Tables<'offers'>;
export type SeedPhoto = Tables<'restaurant_photos'>;
export type SeedEvent = Tables<'events'>;
export type SeedReview = Tables<'reviews'>;

const now = () => new Date();

function endOfToday(): string {
  const d = now();
  d.setHours(23, 59, 59, 0);
  return d.toISOString();
}

function hoursFromNow(h: number): string {
  return new Date(now().getTime() + h * 3_600_000).toISOString();
}

function daysFromNow(d: number, hour = 19): string {
  const t = now();
  t.setDate(t.getDate() + d);
  t.setHours(hour, 0, 0, 0);
  return t.toISOString();
}

function daysAgo(d: number): string {
  return new Date(now().getTime() - d * 86_400_000).toISOString();
}

const rid = (n: number) => `00000000-0000-4000-8000-00000000000${n}`;
const oid = (n: number) => `00000000-0000-4000-8001-00000000000${n}`;
export const SEED_OWNER_IDS = [1, 2, 3, 4, 5, 6].map(oid);

// Deterministic ids for children so fallback-mode links are stable.
let miCounter = 0;
const mid = () =>
  `00000000-0000-4000-8002-${String(++miCounter).padStart(12, '0')}`;

export const seedRestaurants: SeedRestaurant[] = [
  {
    id: rid(1),
    owner_id: oid(1),
    name: 'Biryani Adda',
    description:
      'The heavy-duty dum biryani spot every hostel argues about. Handi portions built for sharing, and a student thali on weekdays.',
    area: 'Kakatiya',
    address: 'Kakatiya University Cross, Warangal',
    lat: 17.9884,
    lng: 79.5941,
    phone: '+91 98480 00001',
    is_veg_only: false,
    has_ac: true,
    dine_in: true,
    takeaway: true,
    student_discount: true,
    price_per_head: 180,
    vibe_tags: ['group', 'celebration', 'comfort'],
    owner_name: 'Biryani Adda Owner',
    restaurant_category: 'Restaurant',
    cuisines: ['Biryani', 'North Indian'],
    delivery: true,
    outdoor_seating: false,
    parking: true,
    wifi: false,
    upi_card: true,
    wheelchair_accessible: false,
    family_friendly: true,
    opening_hours: {
      mon: [{ open: '11:30', close: '23:30' }],
      tue: [{ open: '11:30', close: '23:30' }],
      wed: [{ open: '11:30', close: '23:30' }],
      thu: [{ open: '11:30', close: '23:30' }],
      fri: [{ open: '11:30', close: '23:59' }],
      sat: [{ open: '11:30', close: '23:59' }],
      sun: [{ open: '12:00', close: '23:00' }],
    },
    cover_image_url: '/seed/biryani-adda.svg',
    status: 'active',
    created_at: daysAgo(90),
  },
  {
    id: rid(2),
    owner_id: oid(2),
    name: 'Momo Nation',
    description:
      'Steamed, fried, tandoori and the notorious ghost-pepper momos. Quick counter service, most plates under ₹120.',
    area: 'Kakatiya',
    address: 'Excise Colony Road, Warangal',
    lat: 17.9912,
    lng: 79.5889,
    phone: '+91 98480 00002',
    is_veg_only: false,
    has_ac: false,
    dine_in: true,
    takeaway: true,
    student_discount: true,
    price_per_head: 100,
    vibe_tags: ['quick', 'chill'],
    owner_name: 'Momo Nation Owner',
    restaurant_category: 'Street food',
    cuisines: ['Chinese', 'Fast Food'],
    delivery: true,
    outdoor_seating: true,
    parking: false,
    wifi: false,
    upi_card: true,
    wheelchair_accessible: false,
    family_friendly: true,
    opening_hours: {
      mon: [{ open: '12:00', close: '22:00' }],
      tue: [{ open: '12:00', close: '22:00' }],
      wed: [],
      thu: [{ open: '12:00', close: '22:00' }],
      fri: [{ open: '12:00', close: '22:30' }],
      sat: [{ open: '12:00', close: '22:30' }],
      sun: [{ open: '12:00', close: '22:00' }],
    },
    cover_image_url: '/seed/momo-nation.svg',
    status: 'active',
    created_at: daysAgo(75),
  },
  {
    id: rid(3),
    owner_id: oid(3),
    name: 'Chai Theory',
    description:
      'Slow chai, fast wifi. Kulhad chai, maggi variations and bun maska until 2am — the unofficial night-before-exams venue.',
    area: 'Vidyaranyapuri',
    address: 'Vidyaranyapuri Main Road, Warangal',
    lat: 17.9767,
    lng: 79.6013,
    phone: '+91 98480 00003',
    is_veg_only: true,
    has_ac: false,
    dine_in: true,
    takeaway: true,
    student_discount: false,
    price_per_head: 70,
    vibe_tags: ['study', 'latenight', 'chill'],
    owner_name: 'Chai Theory Owner',
    restaurant_category: 'Cafe',
    cuisines: ['Cafe', 'Beverages', 'Fast Food'],
    delivery: false,
    outdoor_seating: true,
    parking: false,
    wifi: true,
    upi_card: true,
    wheelchair_accessible: false,
    family_friendly: true,
    opening_hours: {
      mon: [{ open: '08:00', close: '02:00' }],
      tue: [{ open: '08:00', close: '02:00' }],
      wed: [{ open: '08:00', close: '02:00' }],
      thu: [{ open: '08:00', close: '02:00' }],
      fri: [{ open: '08:00', close: '02:00' }],
      sat: [{ open: '09:00', close: '02:00' }],
      sun: [{ open: '09:00', close: '00:30' }],
    },
    cover_image_url: '/seed/chai-theory.svg',
    status: 'active',
    created_at: daysAgo(120),
  },
  {
    id: rid(4),
    owner_id: oid(4),
    name: 'Southern Spice Tiffins',
    description:
      'Ghee podi dosa, hot idli by the plate, filter coffee. Split shift: breakfast rush and a dinner reopening, closed in between.',
    area: 'Vidyaranyapuri',
    address: 'Near LB Nagar Circle, Warangal',
    lat: 17.9721,
    lng: 79.6078,
    phone: '+91 98480 00004',
    is_veg_only: true,
    has_ac: true,
    dine_in: true,
    takeaway: true,
    student_discount: true,
    price_per_head: 90,
    vibe_tags: ['comfort', 'quick'],
    owner_name: 'Southern Spice Tiffins Owner',
    restaurant_category: 'Restaurant',
    cuisines: ['South Indian'],
    delivery: true,
    outdoor_seating: false,
    parking: true,
    wifi: false,
    upi_card: true,
    wheelchair_accessible: true,
    family_friendly: true,
    opening_hours: {
      mon: [
        { open: '07:00', close: '11:30' },
        { open: '17:00', close: '22:00' },
      ],
      tue: [
        { open: '07:00', close: '11:30' },
        { open: '17:00', close: '22:00' },
      ],
      wed: [
        { open: '07:00', close: '11:30' },
        { open: '17:00', close: '22:00' },
      ],
      thu: [
        { open: '07:00', close: '11:30' },
        { open: '17:00', close: '22:00' },
      ],
      fri: [
        { open: '07:00', close: '11:30' },
        { open: '17:00', close: '22:00' },
      ],
      sat: [{ open: '07:00', close: '22:00' }],
      sun: [{ open: '07:00', close: '14:00' }],
    },
    cover_image_url: '/seed/southern-spice.svg',
    status: 'active',
    created_at: daysAgo(60),
  },
  {
    id: rid(5),
    owner_id: oid(5),
    name: 'Scoops & Stories',
    description:
      'Ice cream parlour with sundaes named after campus landmarks. Date-night booths, board games, and a brownie sizzler worth the wait.',
    area: 'Hunter Road',
    address: 'Hunter Road, Hanamkonda',
    lat: 18.0102,
    lng: 79.5623,
    phone: '+91 98480 00005',
    is_veg_only: true,
    has_ac: true,
    dine_in: true,
    takeaway: true,
    student_discount: false,
    price_per_head: 150,
    vibe_tags: ['date', 'chill', 'celebration'],
    owner_name: 'Scoops & Stories Owner',
    restaurant_category: 'Dessert shop',
    cuisines: ['Desserts', 'Beverages'],
    delivery: true,
    outdoor_seating: false,
    parking: true,
    wifi: true,
    upi_card: true,
    wheelchair_accessible: true,
    family_friendly: true,
    opening_hours: {
      mon: [{ open: '13:00', close: '23:30' }],
      tue: [{ open: '13:00', close: '23:30' }],
      wed: [{ open: '13:00', close: '23:30' }],
      thu: [{ open: '13:00', close: '23:30' }],
      fri: [{ open: '13:00', close: '00:30' }],
      sat: [{ open: '12:00', close: '00:30' }],
      sun: [{ open: '12:00', close: '23:30' }],
    },
    cover_image_url: '/seed/scoops-stories.svg',
    status: 'active',
    created_at: daysAgo(45),
  },
  {
    id: rid(6),
    owner_id: oid(6),
    name: 'Hunter Road Grill',
    description:
      'Charcoal grills, shawarma rolls and a rooftop that hosts open mics. The go-to for end-of-sem celebrations.',
    area: 'Hunter Road',
    address: 'Opp. Public Garden, Hunter Road, Hanamkonda',
    lat: 18.0075,
    lng: 79.5588,
    phone: '+91 98480 00006',
    is_veg_only: false,
    has_ac: true,
    dine_in: true,
    takeaway: false,
    student_discount: true,
    price_per_head: 350,
    vibe_tags: ['group', 'celebration', 'latenight'],
    owner_name: 'Hunter Road Grill Owner',
    restaurant_category: 'Restaurant',
    cuisines: ['North Indian', 'Continental', 'Fast Food'],
    delivery: false,
    outdoor_seating: true,
    parking: true,
    wifi: true,
    upi_card: true,
    wheelchair_accessible: false,
    family_friendly: false,
    opening_hours: {
      mon: [],
      tue: [{ open: '17:00', close: '23:59' }],
      wed: [{ open: '17:00', close: '23:59' }],
      thu: [{ open: '17:00', close: '23:59' }],
      fri: [{ open: '17:00', close: '01:00' }],
      sat: [{ open: '13:00', close: '01:00' }],
      sun: [{ open: '13:00', close: '23:30' }],
    },
    cover_image_url: '/seed/hunter-grill.svg',
    status: 'active',
    created_at: daysAgo(30),
  },
];

const menu = (
  restaurantId: string,
  items: [name: string, price: number, veg: boolean, tags: string[]][],
): SeedMenuItem[] =>
  items.map(([name, price, is_veg, craving_tags]) => ({
    id: mid(),
    restaurant_id: restaurantId,
    name,
    price,
    is_veg,
    craving_tags,
    is_available: true,
    created_at: daysAgo(30),
  }));

export const seedMenuItems: SeedMenuItem[] = [
  ...menu(rid(1), [
    ['Chicken Dum Biryani', 220, false, ['biryani']],
    ['Mutton Dum Biryani', 300, false, ['biryani']],
    ['Veg Biryani', 160, true, ['biryani']],
    ['Egg Biryani', 180, false, ['biryani']],
    ['Chicken 65', 190, false, []],
    ['Student Thali (weekdays)', 120, true, []],
    ['Double Ka Meetha', 80, true, ['sweets']],
  ]),
  ...menu(rid(2), [
    ['Steamed Chicken Momos (8)', 90, false, ['momos']],
    ['Steamed Veg Momos (8)', 70, true, ['momos']],
    ['Fried Momos (8)', 100, false, ['momos']],
    ['Tandoori Momos (8)', 130, false, ['momos']],
    ['Ghost Pepper Momos (6)', 150, false, ['momos']],
    ['Thukpa', 110, false, []],
    ['Cold Coffee', 60, true, ['juice']],
  ]),
  ...menu(rid(3), [
    ['Kulhad Chai', 30, true, ['chai']],
    ['Masala Chai', 25, true, ['chai']],
    ['Bun Maska', 40, true, []],
    ['Cheese Maggi', 70, true, []],
    ['Peri Peri Fries', 90, true, []],
    ['Nutella Toast', 80, true, ['sweets']],
    ['Cold Chocolate', 90, true, ['juice']],
  ]),
  ...menu(rid(4), [
    ['Ghee Podi Dosa', 90, true, ['dosa']],
    ['Masala Dosa', 80, true, ['dosa']],
    ['Idli (2)', 40, true, []],
    ['Mysore Bonda (4)', 50, true, []],
    ['Upma', 45, true, []],
    ['Filter Coffee', 30, true, ['chai']],
    ['Kesari Bath', 50, true, ['sweets']],
  ]),
  ...menu(rid(5), [
    ['Death by Chocolate Sundae', 180, true, ['icecream', 'sweets']],
    ['Brownie Sizzler', 200, true, ['icecream', 'sweets']],
    ['Tender Coconut Scoop', 90, true, ['icecream']],
    ['Fresh Fruit Falooda', 140, true, ['icecream', 'juice']],
    ['Classic Vanilla Scoop', 60, true, ['icecream']],
    ['Watermelon Cooler', 80, true, ['juice']],
  ]),
  ...menu(rid(6), [
    ['Chicken Shawarma Roll', 140, false, ['shawarma']],
    ['Peri Peri Chicken (Half)', 280, false, []],
    ['Paneer Tikka Platter', 240, true, []],
    ['Grilled Chicken Burger', 180, false, ['burger']],
    ['Wood-fired Margherita', 260, true, ['pizza']],
    ['BBQ Chicken Pizza', 320, false, ['pizza']],
    ['Fresh Lime Soda', 60, true, ['juice']],
  ]),
];

let ofCounter = 0;
const ofid = () =>
  `00000000-0000-4000-8003-${String(++ofCounter).padStart(12, '0')}`;

export const seedOffers: SeedOffer[] = [
  {
    id: ofid(),
    restaurant_id: rid(1),
    title: 'Student Thali at ₹99',
    description: 'Show your NITW ID at the counter. Weekdays only, 12–3pm.',
    discount_text: '₹21 off',
    starts_at: daysAgo(1),
    expires_at: hoursFromNow(0.75),
    is_active: true,
    flagged_count: 0,
    created_at: daysAgo(1),
  },
  {
    id: ofid(),
    restaurant_id: rid(1),
    title: 'Free Chicken 65 on handi biryani',
    description: 'One plate of Chicken 65 free with every family handi.',
    discount_text: 'Free side',
    starts_at: daysAgo(0.2),
    expires_at: endOfToday(),
    is_active: true,
    flagged_count: 0,
    created_at: daysAgo(0.2),
  },
  {
    id: ofid(),
    restaurant_id: rid(2),
    title: 'Buy 2 get 1 steamed plates',
    description: 'Any steamed momos. Bring the squad.',
    discount_text: 'B2G1',
    starts_at: daysAgo(0.5),
    expires_at: endOfToday(),
    is_active: true,
    flagged_count: 0,
    created_at: daysAgo(0.5),
  },
  {
    id: ofid(),
    restaurant_id: rid(3),
    title: 'Midnight maggi + chai combo ₹79',
    description: 'Valid 11pm–2am. The exam-week special.',
    discount_text: '₹21 off',
    starts_at: daysAgo(2),
    expires_at: hoursFromNow(26),
    is_active: true,
    flagged_count: 0,
    created_at: daysAgo(2),
  },
  {
    id: ofid(),
    restaurant_id: rid(4),
    title: 'Filter coffee free with any dosa',
    description: 'Morning shift only, till 11:30am.',
    discount_text: 'Free coffee',
    starts_at: daysAgo(0.3),
    expires_at: hoursFromNow(3),
    is_active: true,
    flagged_count: 0,
    created_at: daysAgo(0.3),
  },
  {
    id: ofid(),
    restaurant_id: rid(5),
    title: '20% off sundaes for groups of 4+',
    description: 'Dine-in only. One bill per table.',
    discount_text: '20% off',
    starts_at: daysAgo(1),
    expires_at: hoursFromNow(30),
    is_active: true,
    flagged_count: 0,
    created_at: daysAgo(1),
  },
  {
    id: ofid(),
    restaurant_id: rid(6),
    title: 'Shawarma happy hour 5–7pm',
    description: 'All shawarma rolls at ₹99.',
    discount_text: '₹41 off',
    starts_at: daysAgo(0.1),
    expires_at: hoursFromNow(1.5),
    is_active: true,
    flagged_count: 0,
    created_at: daysAgo(0.1),
  },
  {
    id: ofid(),
    restaurant_id: rid(6),
    title: 'NITW ID = 10% off the bill',
    description: 'Every day, on dine-in bills over ₹500.',
    discount_text: '10% off',
    starts_at: daysAgo(5),
    expires_at: hoursFromNow(72),
    is_active: true,
    flagged_count: 0,
    created_at: daysAgo(5),
  },
];

let phCounter = 0;
const phid = () =>
  `00000000-0000-4000-8004-${String(++phCounter).padStart(12, '0')}`;

/**
 * Gallery folders are owner-authored free text, so the seed derives them from
 * the asset names to demo the feature with real groups rather than dumping
 * everything into one folder. Menu photos are not foldered — they render as the
 * menu card strip, not the gallery.
 */
function galleryFolder(url: string, kind: 'gallery' | 'menu_photo') {
  if (kind !== 'gallery') return null;
  if (url.includes('gallery-food')) return 'Food & Drinks';
  if (url.includes('gallery-interior')) return 'Interior';
  return 'Ambience';
}

const photos = (
  restaurantId: string,
  urls: string[],
  kind: 'gallery' | 'menu_photo' = 'gallery',
): SeedPhoto[] =>
  urls.map((url, i) => ({
    id: phid(),
    restaurant_id: restaurantId,
    url,
    kind,
    gallery_category: galleryFolder(url, kind),
    sort_order: i,
    created_at: daysAgo(20),
  }));

export const seedPhotos: SeedPhoto[] = [
  ...photos(rid(1), [
    '/seed/biryani-adda.svg',
    '/seed/gallery-food-1.svg',
    '/seed/gallery-interior-1.svg',
  ]),
  ...photos(rid(1), ['/seed/menu-card-1.svg'], 'menu_photo'),
  ...photos(rid(2), ['/seed/momo-nation.svg', '/seed/gallery-food-2.svg']),
  ...photos(rid(3), ['/seed/chai-theory.svg', '/seed/gallery-interior-2.svg']),
  ...photos(rid(4), ['/seed/southern-spice.svg', '/seed/gallery-food-3.svg']),
  ...photos(rid(4), ['/seed/menu-card-2.svg'], 'menu_photo'),
  ...photos(rid(5), [
    '/seed/scoops-stories.svg',
    '/seed/gallery-interior-3.svg',
  ]),
  ...photos(rid(6), [
    '/seed/hunter-grill.svg',
    '/seed/gallery-food-4.svg',
    '/seed/gallery-interior-4.svg',
  ]),
];

let evCounter = 0;
const evid = () =>
  `00000000-0000-4000-8005-${String(++evCounter).padStart(12, '0')}`;

export const seedEvents: SeedEvent[] = [
  {
    id: evid(),
    restaurant_id: rid(6),
    title: 'Open Mic Friday',
    description:
      'Rooftop open mic — comedy, poetry, acoustic sets. Sign up at the counter by 7pm.',
    entry_fee: 0,
    location_details: 'Rooftop',
    ticket_url: null,
    event_type: 'open_mic',
    starts_at: daysFromNow(1, 20),
    ends_at: daysFromNow(1, 23),
    cover_image_url: '/seed/event-openmic.svg',
    is_cancelled: false,
    created_at: daysAgo(3),
  },
  {
    id: evid(),
    restaurant_id: rid(3),
    title: 'Exam Week All-Nighter',
    description:
      'Extended hours, bottomless chai refills after midnight, and the good playlists off.',
    entry_fee: 0,
    location_details: null,
    ticket_url: null,
    event_type: 'other',
    starts_at: daysFromNow(2, 22),
    ends_at: null,
    cover_image_url: null,
    is_cancelled: false,
    created_at: daysAgo(1),
  },
  {
    id: evid(),
    restaurant_id: rid(6),
    title: 'Premier League Screening',
    description: 'Big screen on the rooftop. Come early for a table.',
    entry_fee: 149,
    location_details: 'Rooftop screening area',
    ticket_url: null,
    event_type: 'screening',
    starts_at: daysFromNow(3, 21),
    ends_at: daysFromNow(3, 23),
    cover_image_url: '/seed/event-screening.svg',
    is_cancelled: false,
    created_at: daysAgo(2),
  },
  {
    id: evid(),
    restaurant_id: rid(5),
    title: 'Board Game Night',
    description: 'Bring a team of 4. Winner table eats sundaes free.',
    entry_fee: 99,
    location_details: 'First floor lounge',
    ticket_url: null,
    event_type: 'quiz',
    starts_at: daysFromNow(4, 19),
    ends_at: daysFromNow(4, 22),
    cover_image_url: null,
    is_cancelled: false,
    created_at: daysAgo(4),
  },
  {
    id: evid(),
    restaurant_id: rid(1),
    title: 'Handi Fest Weekend',
    description:
      'Limited-run regional biryanis all weekend — Ambur, Donne, Thalassery.',
    entry_fee: 0,
    location_details: null,
    ticket_url: null,
    event_type: 'food_festival',
    starts_at: daysFromNow(5, 12),
    ends_at: daysFromNow(7, 23),
    cover_image_url: '/seed/event-handifest.svg',
    is_cancelled: false,
    created_at: daysAgo(5),
  },
  {
    id: evid(),
    restaurant_id: rid(6),
    title: 'Acoustic Night — The Corridor Band',
    description: 'NITW’s own. No cover charge.',
    entry_fee: 0,
    location_details: 'The courtyard stage',
    ticket_url: null,
    event_type: 'live_music',
    starts_at: daysFromNow(6, 20),
    ends_at: daysFromNow(6, 23),
    cover_image_url: '/seed/event-music.svg',
    is_cancelled: false,
    created_at: daysAgo(2),
  },
];

// A handful of reviews so sorts and aggregates render. booking_id values
// reference bookings that exist only in seed.sql, not in fallback mode — the
// public UI never joins reviews→bookings, so this is safe.
let rvCounter = 0;
const rvid = () =>
  `00000000-0000-4000-8006-${String(++rvCounter).padStart(12, '0')}`;
const bkid = (n: number) =>
  `00000000-0000-4000-8007-${String(n).padStart(12, '0')}`;
const sid = (n: number) => `00000000-0000-4000-8008-00000000000${n}`;
export const SEED_STUDENT_IDS = [1, 2, 3].map(sid);

export const seedReviews: SeedReview[] = [
  {
    id: rvid(),
    booking_id: bkid(1),
    student_id: sid(1),
    restaurant_id: rid(1),
    rating: 5,
    comment: 'The mutton dum is unreal. Worth every rupee of the mess-skip.',
    created_at: daysAgo(10),
  },
  {
    id: rvid(),
    booking_id: bkid(2),
    student_id: sid(2),
    restaurant_id: rid(1),
    rating: 4,
    comment: 'Great biryani, service slows down badly on weekends.',
    created_at: daysAgo(6),
  },
  {
    id: rvid(),
    booking_id: bkid(3),
    student_id: sid(3),
    restaurant_id: rid(2),
    rating: 4,
    comment: 'Ghost pepper momos are a rite of passage. Carry water.',
    created_at: daysAgo(8),
  },
  {
    id: rvid(),
    booking_id: bkid(4),
    student_id: sid(1),
    restaurant_id: rid(3),
    rating: 5,
    comment: 'Carried our entire end-sem prep. The 2am chai hits different.',
    created_at: daysAgo(15),
  },
  {
    id: rvid(),
    booking_id: bkid(5),
    student_id: sid(2),
    restaurant_id: rid(4),
    rating: 5,
    comment: 'Podi dosa as good as home. Go before 9am or queue.',
    created_at: daysAgo(4),
  },
  {
    id: rvid(),
    booking_id: bkid(6),
    student_id: sid(3),
    restaurant_id: rid(5),
    rating: 4,
    comment: 'Cute spot, brownie sizzler is the move. Slightly pricey.',
    created_at: daysAgo(3),
  },
  {
    id: rvid(),
    booking_id: bkid(7),
    student_id: sid(1),
    restaurant_id: rid(6),
    rating: 5,
    comment: 'Rooftop + shawarma + open mic. End-sem sorted.',
    created_at: daysAgo(2),
  },
];
