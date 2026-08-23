// Reminder email via Resend, ported from the Next cron route helper. Best-effort:
// the sweep's reminder_sent_at stamp is the source of truth, so a failed send
// never blocks the state machine. No-op unless RESEND_API_KEY is set.
import { env } from '../config/index.js';

export async function sendReminderEmail(to, bookingId, bookingTime) {
  const site = env.SITE_URL;
  const when = new Date(bookingTime).toLocaleTimeString('en-IN', {
    hour: 'numeric',
    minute: '2-digit',
    timeZone: 'Asia/Kolkata',
  });
  try {
    await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${env.RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'Destiny <noreply@destiny.local>',
        to,
        subject: `Still on for ${when}?`,
        text: `Your accepted reservation is coming up at ${when}. Tap to confirm you're still coming: ${site}/bookings/confirm/${bookingId}\n\nIf plans changed, cancel it from My bookings so the restaurant can release the table.`,
      }),
    });
  } catch {
    // Email is best-effort; the sweep stamp is the source of truth.
  }
}
