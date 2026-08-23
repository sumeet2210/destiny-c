// Scheduled sweeps (architecture.md §5). One job per POST /cron/:job, all guarded
// by CRON_SECRET (requireCronSecret middleware). This is the ONLY place that uses
// the admin/service client and bypasses RLS. Exact port of app/api/cron/[job].
//
//   reminders         every 5 min   booking_time - window crossed → send + stamp
//   resolve-bookings  every 5 min   unconfirmed / completed transitions
//   expire-offers     every 15 min  is_active = false past expires_at
//   expire-events     hourly        (query-side hiding; sweep validates ends)
//   keep-alive        daily         trivial query so the free tier doesn't pause
import { BOOKING } from '../config/booking.js';
import { isReminderDue, resolve } from '../lib/domain/booking.js';
import { adminClient } from '../lib/supabase.js';
import { isSupabaseConfigured, env } from '../config/index.js';
import { sendReminderEmail } from '../lib/email.js';

export async function runJob(req, res) {
  const { job } = req.params;
  if (!isSupabaseConfigured()) {
    return res.status(503).json({ ok: false, error: 'not configured' });
  }

  const admin = adminClient();
  const now = new Date();
  const ok = (data) => res.json({ ok: true, ...data });
  const fail = (message) => res.status(500).json({ ok: false, error: message });

  switch (job) {
    case 'expire-offers': {
      const { data, error } = await admin
        .from('offers')
        .update({ is_active: false })
        .eq('is_active', true)
        .lt('expires_at', now.toISOString())
        .select('id');
      if (error) return fail(error.message);
      return ok({ expired: data?.length ?? 0 });
    }

    case 'expire-events': {
      // Events auto-hide by query (starts_at + 4h when ends_at is null);
      // nothing to write. Kept as a job so the cadence table stays honest.
      return ok({ note: 'events hide query-side' });
    }

    case 'reminders': {
      // P6-7: find confirmed bookings crossing booking_time - window.
      const horizon = new Date(
        now.getTime() + BOOKING.reminderWindowMinutes * 60_000,
      );
      const { data: due, error } = await admin
        .from('bookings')
        .select(
          'id, status, booking_time, reminder_sent_at, confirmed_at, student_id',
        )
        .eq('status', 'confirmed')
        .is('reminder_sent_at', null)
        .gt('booking_time', now.toISOString())
        .lte('booking_time', horizon.toISOString());
      if (error) return fail(error.message);

      let sent = 0;
      for (const b of due ?? []) {
        const { data: student } = await admin
          .from('users')
          .select('no_show_count, email')
          .eq('id', b.student_id)
          .single();
        if (!isReminderDue(b, student?.no_show_count ?? 0, now)) {
          continue; // inside the tightened window for repeat no-showers
        }
        // Email via Resend when configured; the stamp is what matters to the
        // state machine either way.
        if (env.RESEND_API_KEY && student?.email) {
          await sendReminderEmail(student.email, b.id, b.booking_time);
        }
        await admin
          .from('bookings')
          .update({ reminder_sent_at: now.toISOString() })
          .eq('id', b.id);
        sent++;
      }
      return ok({ sent });
    }

    case 'resolve-bookings': {
      // P6-9: past booking_time with no confirm → unconfirmed (never
      // cancelled) → completed after the grace, incrementing no_show_count.
      const { data: open, error } = await admin
        .from('bookings')
        .select(
          'id, status, booking_time, reminder_sent_at, confirmed_at, student_id',
        )
        .in('status', ['confirmed', 'unconfirmed'])
        .lt('booking_time', now.toISOString());
      if (error) return fail(error.message);

      let unconfirmed = 0;
      let completed = 0;
      for (const b of open ?? []) {
        const action = resolve(b, now);
        if (action.action === 'mark_unconfirmed') {
          await admin
            .from('bookings')
            .update({ status: 'unconfirmed' })
            .eq('id', b.id);
          const { data: u } = await admin
            .from('users')
            .select('no_show_count')
            .eq('id', b.student_id)
            .single();
          await admin
            .from('users')
            .update({ no_show_count: (u?.no_show_count ?? 0) + 1 })
            .eq('id', b.student_id);
          unconfirmed++;
        } else if (action.action === 'mark_completed') {
          await admin
            .from('bookings')
            .update({ status: 'completed' })
            .eq('id', b.id);
          completed++;
        }
      }
      return ok({ unconfirmed, completed });
    }

    case 'keep-alive': {
      const { error } = await admin.from('restaurants').select('id').limit(1);
      if (error) return fail(error.message);
      return ok({ alive: true });
    }

    default:
      return res.status(404).json({ ok: false, error: 'unknown job' });
  }
}
