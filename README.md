# Destiny

Destiny is a mobile-first campus food discovery platform for students around
NIT Warangal. It is designed to help students find nearby restaurants, dishes,
live offers, and events while giving restaurant owners a lightweight way to
keep their information current.

The product is intentionally focused on discovery and booking notices. It is
not an ordering, payment, delivery, or guaranteed table-reservation system.

## Project status

All build-plan phases (0–9) are implemented: the public browsing surface
(homepage ticker, craving card stack, search with dish-level results, events,
quiz), auth (student OTP + owner accounts with manual approval), owner tools
(profile, hours, menu, offers, events, photos, bookings, analytics), the
booking flow with reminder/resolution sweeps, reviews gated to verified
visits, and the consent-gated social layer (saved, friends, RSVPs).

**The app runs without Supabase.** When the env vars are absent, the read
layer serves typed seed data (`lib/data/seed.ts`) so the whole public surface
is browsable; auth and writes need a live project. To go live, create the
Supabase projects per [docs/SETUP.md](docs/SETUP.md), push
`supabase/migrations/`, seed with `supabase/seed.sql` (regenerate via
`npm run gen:seed`), and run `scripts/rls-test.sql` before enabling the social
layer. Regenerate `types/db.ts` after linking (see docs/decisions.md).

Remaining before soft launch: Phase 10 ops (Netlify setup, Sentry, keep-alive
scheduling, storage audit) and a real-device QA pass.

## Technology

- Next.js 16 with the App Router
- React 19 and TypeScript
- Tailwind CSS 4
- Supabase for Postgres, authentication, storage, and scheduled backend work
- Vitest for unit tests
- ESLint and Prettier for code quality
- Netlify as the planned deployment platform

## Requirements

- Node.js 22
- npm
- A Supabase development project when working on database-backed features

The repository includes an `.nvmrc`. With a compatible Node version manager,
run:

```bash
nvm use
```

Confirm that `node --version` reports Node 22 before installing dependencies.

## Local setup

1. Install dependencies:

   ```bash
   npm install
   ```

2. Copy the environment template:

   ```bash
   cp .env.example .env.local
   ```

   On PowerShell:

   ```powershell
   Copy-Item .env.example .env.local
   ```

3. Populate the required values in `.env.local`:

   | Variable                               | Purpose                                         |
   | -------------------------------------- | ----------------------------------------------- |
   | `NEXT_PUBLIC_SUPABASE_URL`             | Supabase project URL                            |
   | `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Browser-safe Supabase key                       |
   | `SUPABASE_SECRET_KEY`                  | Server-only key that bypasses RLS               |
   | `RESEND_API_KEY`                       | Email delivery for authentication and reminders |
   | `CRON_SECRET`                          | Authentication for scheduled-job endpoints      |

   Never expose `SUPABASE_SECRET_KEY` or `CRON_SECRET` in client components or
   commit `.env.local`.

4. Start the development server:

   ```bash
   npm run dev
   ```

5. Open <http://localhost:3000>.

## Commands

| Command                | Purpose                                 |
| ---------------------- | --------------------------------------- |
| `npm run dev`          | Start the development server            |
| `npm run build`        | Create a production build               |
| `npm run start`        | Serve the production build              |
| `npm run lint`         | Run ESLint                              |
| `npm run test`         | Run the Vitest suite once               |
| `npm run typecheck`    | Check TypeScript without emitting files |
| `npm run format`       | Format the repository with Prettier     |
| `npm run format:check` | Check formatting without changing files |

## Intended structure

```text
app/                    Routes, layouts, and route handlers
components/ui/          Reusable design-system primitives
components/features/    Product-specific components
config/                 Product values and filter definitions
lib/supabase/           Browser and server Supabase clients
lib/queries/            Typed data-access functions
lib/domain/             Pure, unit-tested business rules
supabase/migrations/    Database schema, constraints, and RLS policies
types/db.ts             Generated Supabase database types
docs/                   Product, architecture, design, and delivery documents
```

## Architecture rules

- Components do not import Supabase directly.
- Database access is isolated in `lib/queries`.
- Business rules remain pure and independent of React and network calls.
- Server Components are the default; Client Components should be small,
  interactive leaves.
- RLS policies, constraints, indexes, and tests ship with their corresponding
  database migrations.
- Browsing remains public; authentication is required only for actions such as
  booking, saving, reviewing, and social features.

The active ESLint configuration enforces the component-to-Supabase import
boundary.

## Documentation

- [Product requirements](docs/prd.md)
- [Architecture](docs/architecture.md)
- [Build plan](docs/build-plan.md)
- [Design system](docs/design.md)
- [Detailed setup guide](docs/SETUP.md)

Read the relevant documents before implementing a feature. Product or
architecture decisions that change these documents should be recorded rather
than left only in code or pull-request discussion.
