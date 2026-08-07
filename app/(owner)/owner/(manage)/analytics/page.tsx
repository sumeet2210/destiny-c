import { AnalyticsView } from '@/components/features/owner/AnalyticsView';
import { getOwnerAnalytics } from '@/lib/queries/owner';

export const metadata = { title: 'Analytics' };

export default async function OwnerAnalyticsPage() {
  const analytics = await getOwnerAnalytics();

  return (
    <div className="max-w-2xl space-y-5">
      <div>
        <h1 className="font-display text-paper text-2xl font-extrabold">
          Analytics
        </h1>
        {/* P7-5: profile views, never footfall. The UI must say so. */}
        <p className="text-text-muted mt-1 text-[13px]">
          These are views of your Destiny profile page — how many students
          looked, and what brought them. It is not a count of people walking in.
        </p>
      </div>

      {!analytics ? (
        <p className="text-text-muted text-sm">
          Analytics need a live Supabase project.
        </p>
      ) : (
        <AnalyticsView data={analytics} />
      )}
    </div>
  );
}
