# Runbook

Operational steps that aren't code. P4-5 and P10-2 fill this out.

## Approving an owner signup (P4-5)

Manual during the testing period — there is no admin UI.

1. Owner signs up at `/owner/signup`; their restaurant row is created with
   `status = 'pending_approval'` and is invisible to students.
2. Verify the restaurant is real (call the number, or visit — campus is small).
3. In the Supabase dashboard → Table editor → `restaurants`, set `status`
   to `active`.
4. The owner's dashboard unlocks automatically on their next page load; tell
   them it's live.

Who approves: PLACEHOLDER — decide before P4-5 ships. One named person, not
"whoever is around".

## Manual DB export (P10-2)

Free tier has no automated backups. Weekly, and before every prod migration:

```
npx supabase db dump --linked -f backup-$(date +%Y%m%d).sql
```

Store the dump somewhere that is not the laptop that runs it.

## Cron jobs

All sweeps are Next.js route handlers under `/api/cron/[job]` protected by
`CRON_SECRET` (Bearer token). Schedule them from any scheduler (GitHub Actions,
cron-job.org, or Supabase pg_cron calling out):

| Job                | Cadence | Route                        |
| ------------------ | ------- | ---------------------------- |
| `reminders`        | 5 min   | `/api/cron/reminders`        |
| `resolve-bookings` | 5 min   | `/api/cron/resolve-bookings` |
| `expire-offers`    | 15 min  | `/api/cron/expire-offers`    |
| `expire-events`    | hourly  | `/api/cron/expire-events`    |
| `keep-alive`       | daily   | `/api/cron/keep-alive`       |

Trigger format: `curl -H "Authorization: Bearer $CRON_SECRET" <site>/api/cron/<job>`
