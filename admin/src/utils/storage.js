// utils/storage.js
export const Store = {
  async get(key, fallback) {
    try {
      if (window.storage) {
        const r = await window.storage.get(key, false);
        return r ? JSON.parse(r.value) : fallback;
      }
      const local = localStorage.getItem(key);
      return local ? JSON.parse(local) : fallback;
    } catch (e) { return fallback; }
  },
  async set(key, value) {
    try { 
      if (window.storage) {
        await window.storage.set(key, JSON.stringify(value), false);
      } else {
        localStorage.setItem(key, JSON.stringify(value));
      }
    } catch (e) { 
      console.error('storage set failed', e); 
    }
  }
};

export function uid() { 
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8); 
}

export function fmtDate(d) { 
  const dt = new Date(d); 
  return dt.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }); 
}

export function todayISO() { 
  return new Date().toISOString().slice(0, 10); 
}

export function addDays(n) { 
  const d = new Date(); 
  d.setDate(d.getDate() + n); 
  return d.toISOString().slice(0, 10); 
}

export function escapeHtml(s) { 
  return (s || '').replace(/[&<>"']/g, c => ({ 
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' 
  }[c])); 
}

export function seededRandom(seed) {
  let s = seed;
  return function () { 
    s = (s * 9301 + 49297) % 233280; 
    return s / 233280; 
  };
}

export function genSeries(days, base, seed) {
  const rnd = seededRandom(seed);
  const arr = [];
  for (let i = 0; i < days; i++) {
    const wobble = Math.sin(i / 3) * 0.3 + rnd() * 0.6;
    arr.push(Math.max(0, Math.round(base + base * wobble * 0.6)));
  }
  return arr;
}

export const DEFAULT_PROFILE = {
  name: 'The Spice Route Café',
  cuisine: 'Café & Bakery',
  phone: '+91 98765 43210',
  address: '102 MG Road, Indiranagar, Bengaluru',
  about: 'Artisanal coffee, freshly baked sourdough pastries, and cozy rooftop vibes for foodies and remote workers.',
  email: 'owner@spiceroute.com',
  seats: '48',
  environment: 'AC',
  diet: 'Both (Veg & Non-Veg)',
  parking: 'Valet Parking',
  wifi: 'Free High-Speed Wi-Fi',
  costForTwo: '₹500 - ₹1000 (Moderate)',
  alcohol: 'Beer & Wine Only',
  outdoor: 'Yes - Rooftop & Garden',
  ambiance: ['Cozy & Warm', 'Work Friendly', 'Rooftop Views', 'Instagrammable', 'Live Music'],
  subscriptionPlan: 'Growth Partner',
  subscriptionStatus: 'Active',
  surveyCompleted: true,
  hours: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(d => ({ day: d, open: '11:00', close: '23:00', closed: false }))
};

export const Demo = {
  async seed(uidx, updateAppState) {
    const offers = [
      { id: uid(), title: 'Flat 20% off — Weekday Lunch', description: 'Enjoy 20% off your total bill, Monday to Friday, 12pm–3pm. Not valid with other offers.', discount: '20% OFF', category: 'Discount', from: todayISO(), to: addDays(20), image: '', active: true, views: 142 },
      { id: uid(), title: 'Buy 1 Get 1 — Craft Mocktails', description: 'Order any craft mocktail and get one free, every evening after 6pm.', discount: 'BOGO', category: 'Happy hour', from: addDays(-10), to: addDays(-1), image: '', active: false, views: 88 }
    ];
    const events = [
      { id: uid(), title: 'Live Acoustic Night', description: 'An evening of live acoustic music with a local artist duo. Limited tables.', date: addDays(5), time: '19:30', category: 'Live music', price: '₹299', seats: 40, booked: 28, image: '', active: true, views: 320 },
      { id: uid(), title: 'Weekend Brunch Buffet', description: 'Unlimited brunch spread with live counters — pasta, waffles and more.', date: addDays(2), time: '11:00', category: 'Themed night', price: '₹699', seats: 60, booked: 44, image: '', active: true, views: 215 }
    ];
    const names = ['Aarav Mehta', 'Sneha Kulkarni', 'Rohan Deshmukh', 'Ishita Sharma', 'Kabir Nair', 'Priya Iyer', 'Vivaan Joshi', 'Ananya Gupta'];
    const bookings = [];
    const statuses = ['pending', 'confirmed', 'confirmed', 'completed', 'cancelled'];
    for (let i = 0; i < 8; i++) {
      const linkToEvent = i % 2 === 0;
      const ref = linkToEvent ? events[i % events.length] : offers[i % offers.length];
      bookings.push({
        id: uid(), guest: names[i], phone: '+91 9' + Math.floor(100000000 + Math.random() * 899999999),
        linkedType: linkToEvent ? 'event' : 'offer', linkedTitle: ref.title,
        date: addDays(Math.floor(Math.random() * 10) - 3), guests: 2 + Math.floor(Math.random() * 5),
        status: statuses[i % statuses.length], bookedOn: Date.now() - i * 86400000
      });
    }
    await Store.set('offers:' + uidx, offers);
    await Store.set('events:' + uidx, events);
    await Store.set('bookings:' + uidx, bookings);
    let profile = await Store.get('profile:' + uidx, null);
    if (!profile) {
      profile = { ...DEFAULT_PROFILE, email: 'user@destiny.com' };
      await Store.set('profile:' + uidx, profile);
    }
    updateAppState({ offers, events, bookings, profile });
  }
};