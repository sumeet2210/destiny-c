import { OfferModerationControls } from '@/components/features/admin/AdminControls';
import { Empty, NotConfigured } from '@/components/features/admin/AdminUi';
import { Card } from '@/components/ui/Card';
import { isSupabaseConfigured } from '@/lib/supabase/server';
import { listFlaggedOffers } from '@/lib/queries/admin';

export const metadata = { title: 'Flagged offers · Admin' };

export default async function AdminFlaggedOffersPage() {
  if (!isSupabaseConfigured()) {
    return (
      <>
        <Heading />
        <NotConfigured />
      </>
    );
  }

  const offers = await listFlaggedOffers();

  return (
    <>
      <Heading />
      {offers.length === 0 ? (
        <Empty>Nothing flagged. Students report offers from the ticker.</Empty>
      ) : (
        <ul className="flex flex-col gap-3">
          {offers.map((o) => (
            <li key={o.id}>
              <Card>
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="text-paper font-semibold">{o.title}</h2>
                      <span className="text-accent-urgent-text text-xs font-semibold">
                        {o.flagged_count} flag{o.flagged_count === 1 ? '' : 's'}
                      </span>
                      {!o.is_active ? (
                        <span className="text-text-muted text-xs">
                          inactive
                        </span>
                      ) : null}
                    </div>
                    <p className="text-text-muted text-sm">
                      {o.restaurantName ?? 'Unknown restaurant'}
                      {o.discount_text ? ` · ${o.discount_text}` : ''}
                    </p>
                    {o.description ? (
                      <p className="text-text-muted text-sm">{o.description}</p>
                    ) : null}
                    <p className="text-text-muted text-xs">
                      {new Date(o.starts_at).toLocaleDateString()} –{' '}
                      {new Date(o.expires_at).toLocaleDateString()}
                    </p>
                  </div>
                  <OfferModerationControls id={o.id} />
                </div>
              </Card>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}

function Heading() {
  return (
    <h1 className="font-display text-paper mb-4 text-xl font-extrabold">
      Flagged offers
    </h1>
  );
}
