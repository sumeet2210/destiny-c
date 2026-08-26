import { redirect } from 'next/navigation';
import { MenuManager } from '@/components/features/owner/MenuManager';
import { getOwnerBundle } from '@/lib/queries/owner';

export const metadata = { title: 'Menu' };

export default async function OwnerMenuPage() {
  const bundle = await getOwnerBundle();
  if (!bundle) redirect('/owner/dashboard');

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h1 className="font-display text-paper text-2xl font-extrabold">
          Menu
        </h1>
        <p className="text-text-muted mt-1 text-[13px]">
          Students search by dish — every item listed is another way to be
          found.
        </p>
      </div>
      <MenuManager
        items={bundle.menu.map((m) => ({
          id: m.id,
          name: m.name,
          price: m.price,
          is_veg: m.is_veg,
          craving_tags: m.craving_tags,
          is_available: m.is_available,
        }))}
      />
    </div>
  );
}
