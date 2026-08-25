import 'server-only';
import { createWorkflowAdminClient } from '@/lib/supabase/admin';

export type AdminApplication = {
  id: string;
  application_id: string;
  restaurant_name: string;
  owner_name: string;
  phone: string;
  email: string;
  restaurant_address: string;
  status: 'pending' | 'approved' | 'rejected' | 'more_info_required';
  rejection_reason: string | null;
  more_info_request: string | null;
  applicant_response: string | null;
  reviewed_at: string | null;
  claimed_at: string | null;
  created_at: string;
};

export async function listAdminApplications(): Promise<AdminApplication[]> {
  const admin = createWorkflowAdminClient();
  const { data } = await admin
    .from('restaurant_applications')
    .select('*')
    .order('created_at', { ascending: false });
  return (data ?? []) as AdminApplication[];
}

export async function getAdminApplication(id: string) {
  const admin = createWorkflowAdminClient();
  const [{ data }, { data: audit }] = await Promise.all([
    admin
      .from('restaurant_applications')
      .select('*')
      .eq('id', id)
      .maybeSingle(),
    admin
      .from('restaurant_application_audit')
      .select('*')
      .eq('application_id', id)
      .order('created_at', { ascending: false }),
  ]);
  return data
    ? { application: data as AdminApplication, audit: audit ?? [] }
    : null;
}

export type ReviewRestaurant = {
  id: string;
  application_id: string | null;
  name: string;
  owner_name: string | null;
  area: string;
  status: string;
  profile_submitted_at: string | null;
};

export async function listRestaurantsForProfileReview(): Promise<
  ReviewRestaurant[]
> {
  const admin = createWorkflowAdminClient();
  const { data } = await admin
    .from('restaurants')
    .select(
      'id, application_id, name, owner_name, area, status, profile_submitted_at',
    )
    .eq('status', 'profile_review')
    .order('profile_submitted_at');
  return (data ?? []) as ReviewRestaurant[];
}

export async function getAdminRestaurantProfile(id: string) {
  const admin = createWorkflowAdminClient();
  const [restaurant, menu, photos] = await Promise.all([
    admin.from('restaurants').select('*').eq('id', id).maybeSingle(),
    admin.from('menu_items').select('*').eq('restaurant_id', id).order('name'),
    admin
      .from('restaurant_photos')
      .select('*')
      .eq('restaurant_id', id)
      .order('sort_order'),
  ]);
  if (!restaurant.data) return null;
  return {
    restaurant: restaurant.data,
    menu: menu.data ?? [],
    photos: photos.data ?? [],
  };
}
