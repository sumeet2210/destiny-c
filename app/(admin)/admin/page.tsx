import {
  Section,
  Stat,
  NotConfigured,
} from '@/components/features/admin/AdminUi';
import { getAdminOverview } from '@/lib/queries/admin';

export const metadata = { title: 'Admin' };

export default async function AdminOverviewPage() {
  const overview = await getAdminOverview();
  if (!overview) {
    return (
      <>
        <h1 className="font-display text-paper mb-4 text-xl font-extrabold">
          Overview
        </h1>
        <NotConfigured />
      </>
    );
  }

  return (
    <>
      <h1 className="font-display text-paper mb-6 text-xl font-extrabold">
        Overview
      </h1>

      <Section title="Restaurants" subtitle="Pending sign-ups need a decision.">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <Stat
            label="Pending approval"
            value={overview.restaurants.pending_approval}
            tone="urgent"
            href="/admin/restaurants?status=pending_approval"
          />
          <Stat
            label="Active"
            value={overview.restaurants.active}
            href="/admin/restaurants?status=active"
          />
          <Stat
            label="Suspended"
            value={overview.restaurants.suspended}
            href="/admin/restaurants?status=suspended"
          />
          <Stat label="Total" value={overview.restaurants.total} />
        </div>
      </Section>

      <Section title="Users">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <Stat
            label="Students"
            value={overview.users.student}
            href="/admin/users?role=student"
          />
          <Stat
            label="Owners"
            value={overview.users.owner}
            href="/admin/users?role=owner"
          />
          <Stat
            label="Admins"
            value={overview.users.admin}
            href="/admin/users?role=admin"
          />
          <Stat label="Total" value={overview.users.total} />
        </div>
      </Section>

      <Section title="Bookings">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
          <Stat label="Requested" value={overview.bookings.requested} />
          <Stat label="Confirmed" value={overview.bookings.confirmed} />
          <Stat label="Unconfirmed" value={overview.bookings.unconfirmed} />
          <Stat label="Completed" value={overview.bookings.completed} />
          <Stat label="Cancelled" value={overview.bookings.cancelled} />
        </div>
      </Section>

      <Section
        title="Content"
        subtitle="Flagged offers are reported by students."
      >
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <Stat
            label="Flagged offers"
            value={overview.moderation.offers_flagged}
            tone="urgent"
            href="/admin/offers"
          />
          <Stat label="Live offers" value={overview.moderation.offers_live} />
          <Stat label="Events" value={overview.moderation.events} />
          <Stat
            label="Reviews"
            value={overview.moderation.reviews}
            href="/admin/reviews"
          />
        </div>
      </Section>
    </>
  );
}
