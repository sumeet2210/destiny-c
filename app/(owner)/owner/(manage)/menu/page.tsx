import { redirect } from 'next/navigation';
import { MenuManager } from '@/components/features/owner/MenuManager';
import { getOwnerBundle } from '@/lib/queries/owner';

export const metadata = { title: 'Menu' };

export default async function OwnerMenuPage() {
  const bundle = await getOwnerBundle();
  if (!bundle) redirect('/owner/dashboard');

  return (
    <div className="w-full space-y-6">
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
