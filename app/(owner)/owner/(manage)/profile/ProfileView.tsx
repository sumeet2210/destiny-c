'use client';

import { HoursEditor } from '@/components/features/owner/HoursEditor';
import { OwnerBundleGate } from '@/components/features/owner/OwnerBundleGate';
import { ProfileForm } from '@/components/features/owner/ProfileForm';
import type { OpeningHours } from '@/lib/domain/hours';

export function ProfileView() {
  return (
    <div className="max-w-2xl space-y-8">
      <h1 className="font-display text-paper text-2xl font-extrabold">
        Profile &amp; hours
      </h1>
      <OwnerBundleGate>
        {(bundle) => {
          const r = bundle.restaurant;
          return (
            <>
              <ProfileForm
                initial={{
                  name: r.name,
                  description: r.description,
                  area: r.area,
                  address: r.address,
                  phone: r.phone,
                  lat: r.lat,
                  lng: r.lng,
                  is_veg_only: r.is_veg_only,
                  has_ac: r.has_ac,
                  dine_in: r.dine_in,
                  takeaway: r.takeaway,
                  student_discount: r.student_discount,
                  price_per_head: r.price_per_head,
                  vibe_tags: r.vibe_tags,
                }}
              />
              <HoursEditor
                initial={(r.opening_hours as OpeningHours | null) ?? {}}
              />
            </>
          );
        }}
      </OwnerBundleGate>
    </div>
  );
}
