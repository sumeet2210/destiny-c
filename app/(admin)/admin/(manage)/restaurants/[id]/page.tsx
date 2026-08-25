import { notFound } from 'next/navigation';
import { ActivateRestaurantButton } from '@/components/features/admin/ActivateRestaurantButton';
import { getAdminRestaurantProfile } from '@/lib/queries/admin';
import styles from '../../../admin.module.css';

export default async function AdminRestaurantProfilePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const bundle = await getAdminRestaurantProfile(id);
  if (!bundle) notFound();
  const { restaurant, menu, photos } = bundle;
  const fields = [
    ['Owner', restaurant.owner_name],
    ['Category', restaurant.restaurant_category],
    ['Cuisine', restaurant.cuisines?.join(', ')],
    ['Phone', restaurant.phone],
    ['Area', restaurant.area],
    ['Address', restaurant.address],
    ['Description', restaurant.description],
    ['Opening hours', JSON.stringify(restaurant.opening_hours)],
    [
      'Map location',
      restaurant.lat != null && restaurant.lng != null
        ? `${restaurant.lat}, ${restaurant.lng}`
        : null,
    ],
  ];
  return (
    <>
      <section className={styles.adminTitle}>
        <span>Profile review</span>
        <h1>{restaurant.name}</h1>
      </section>
      <section className={styles.detailGrid}>
        {fields.map(([label, value]) => (
          <div key={label}>
            <small>{label}</small>
            <p>{value || 'Not provided'}</p>
          </div>
        ))}
        <div>
          <small>Menu items</small>
          <p>{menu.length}</p>
        </div>
        <div>
          <small>Photos</small>
          <p>{photos.length}</p>
        </div>
      </section>
      <section className={styles.actionPanel}>
        <h2>Activation</h2>
        <p>
          Activating makes this restaurant visible in public listings and
          search.
        </p>
        <ActivateRestaurantButton id={restaurant.id} />
      </section>
    </>
  );
}
