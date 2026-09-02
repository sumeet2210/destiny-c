import { redirect } from 'next/navigation';
import { MenuManager } from '@/components/features/owner/MenuManager';
import { PhotoManager } from '@/components/features/owner/PhotoManager';
import { getOwnerBundle, getOwnerMenuSections } from '@/lib/queries/owner';

export const metadata = { title: 'Menu' };

export default async function OwnerMenuPage() {
  const [bundle, sections] = await Promise.all([
    getOwnerBundle(),
    getOwnerMenuSections(),
  ]);
  if (!bundle) redirect('/owner/dashboard');
  const menuPhotos = bundle.photos
    .filter((photo) => photo.kind === 'menu_photo')
    .map((photo) => ({ id: photo.id, url: photo.url }));

  return (
    <div className="w-full space-y-6">
      <MenuManager
        sections={sections.map((section) => section.name)}
        items={bundle.menu.map((m) => ({
          id: m.id,
          name: m.name,
          price: m.price,
          is_veg: m.is_veg,
          craving_tags: m.craving_tags,
          is_available: m.is_available,
          section_name: m.section_name ?? 'Menu',
        }))}
      />
      <PhotoManager
        key={
          menuPhotos.map((photo) => `${photo.id}:${photo.url}`).join('|') ||
          'empty-menu-photos'
        }
        photos={menuPhotos}
      />
    </div>
  );
}
