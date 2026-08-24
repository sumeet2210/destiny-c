import { ReviewControls } from '@/components/features/admin/AdminControls';
import { Empty, NotConfigured } from '@/components/features/admin/AdminUi';
import { Card } from '@/components/ui/Card';
import { isSupabaseConfigured } from '@/lib/supabase/server';
import { listAdminReviews } from '@/lib/queries/admin';

export const metadata = { title: 'Reviews · Admin' };

const str = (v: string | string[] | undefined) =>
  typeof v === 'string' && v !== '' ? v : undefined;

export default async function AdminReviewsPage(
  props: PageProps<'/admin/reviews'>,
) {
  const searchParams = await props.searchParams;
  const restaurantId = str(searchParams.restaurant);

  if (!isSupabaseConfigured()) {
    return (
      <>
        <Heading />
        <NotConfigured />
      </>
    );
  }

  const reviews = await listAdminReviews(restaurantId);

  return (
    <>
      <Heading />
      {reviews.length === 0 ? (
        <Empty>No reviews yet.</Empty>
      ) : (
        <ul className="flex flex-col gap-3">
          {reviews.map((r) => (
            <li key={r.id}>
              <Card>
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="text-paper font-semibold">{r.rating}/5</h2>
                      <span className="text-text-muted text-sm">
                        {r.restaurantName ?? 'Unknown restaurant'}
                      </span>
                    </div>
                    {r.comment ? (
                      <p className="text-paper text-sm">{r.comment}</p>
                    ) : (
                      <p className="text-text-muted text-sm italic">
                        No comment
                      </p>
                    )}
                    <p className="text-text-muted text-xs">
                      {r.student?.full_name ?? 'Unknown student'}
                      {r.student?.email ? ` (${r.student.email})` : ''} ·{' '}
                      {new Date(r.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  <ReviewControls id={r.id} />
                </div>
              </Card>
            </li>
          ))}
        </ul>
      )}

      {reviews.length === 100 ? (
        <p className="text-text-muted mt-3 text-xs">
          Showing the 100 most recent reviews.
        </p>
      ) : null}
    </>
  );
}

function Heading() {
  return (
    <h1 className="font-display text-paper mb-4 text-xl font-extrabold">
      Reviews
    </h1>
  );
}
