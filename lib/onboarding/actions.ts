'use server';

import { revalidatePath } from 'next/cache';
import { createClient, isSupabaseConfigured } from '@/lib/supabase/server';
import { createWorkflowAdminClient } from '@/lib/supabase/admin';
import {
  profileMissingFields,
  validateRestaurantApplication,
  type ApplicationErrors,
  type RestaurantApplicationInput,
} from './domain';
import {
  createApplicationToken,
  createPublicApplicationId,
  hashApplicationToken,
} from './tokens';

export type ApplicationActionResult =
  | {
      ok: true;
      applicationId: string;
      token: string;
    }
  | { ok: false; message: string; errors?: ApplicationErrors };

export async function submitRestaurantApplication(
  input: RestaurantApplicationInput,
): Promise<ApplicationActionResult> {
  if (!isSupabaseConfigured()) {
    return {
      ok: false,
      message: 'Restaurant applications are not configured.',
    };
  }
  const validation = validateRestaurantApplication(input);
  if (!validation.ok) {
    return {
      ok: false,
      message: 'Check the highlighted fields and try again.',
      errors: validation.errors,
    };
  }

  const token = createApplicationToken();
  const applicationId = createPublicApplicationId();
  const value = validation.value;
  const admin = createWorkflowAdminClient();
  const { error } = await admin.from('restaurant_applications').insert({
    application_id: applicationId,
    restaurant_name: value.restaurantName,
    owner_name: value.ownerName,
    phone: value.phone,
    email: value.email,
    restaurant_address: value.restaurantAddress,
    access_token_hash: hashApplicationToken(token),
    status: 'pending',
  });

  if (error?.code === '23505') {
    return {
      ok: false,
      message:
        'An open application already exists for this email or restaurant. Use its status link or contact Destiny support.',
    };
  }
  if (error) {
    console.error('[restaurant-application]', error.message);
    return {
      ok: false,
      message: 'Could not submit the application. Try again.',
    };
  }

  return { ok: true, applicationId, token };
}

export async function provideMoreInformation(input: {
  applicationId: string;
  token: string;
  response: string;
}): Promise<{ ok: boolean; message?: string }> {
  const response = input.response.trim();
  if (response.length < 3 || response.length > 2000) {
    return {
      ok: false,
      message: 'Enter the requested information in 2,000 characters or less.',
    };
  }
  const application = await getApplicationByAccess(
    input.applicationId,
    input.token,
  );
  if (!application || application.status !== 'more_info_required') {
    return { ok: false, message: 'This application cannot be updated.' };
  }

  const admin = createWorkflowAdminClient();
  const { error } = await admin
    .from('restaurant_applications')
    .update({
      applicant_response: response,
      status: 'pending',
      updated_at: new Date().toISOString(),
    })
    .eq('id', application.id)
    .eq('status', 'more_info_required');
  if (error) return { ok: false, message: 'Could not send the information.' };
  revalidatePath(`/owner/application/${input.applicationId}`);
  return { ok: true };
}

export async function createApprovedOwnerAccount(input: {
  applicationId: string;
  token: string;
  password: string;
  confirmPassword: string;
}): Promise<{ ok: boolean; message?: string }> {
  if (input.password.length < 8) {
    return { ok: false, message: 'Password must be at least 8 characters.' };
  }
  if (input.password !== input.confirmPassword) {
    return { ok: false, message: 'Passwords do not match.' };
  }

  const application = await getApplicationByAccess(
    input.applicationId,
    input.token,
  );
  if (!application || application.status !== 'approved') {
    return { ok: false, message: 'A valid approval is required.' };
  }
  if (application.claimed_at) {
    return { ok: false, message: 'This application already has an account.' };
  }

  const admin = createWorkflowAdminClient();
  const { data, error } = await admin.auth.admin.createUser({
    email: application.email,
    password: input.password,
    email_confirm: true,
    user_metadata: {
      role: 'owner',
      full_name: application.owner_name,
      application_id: application.application_id,
    },
  });
  if (error || !data.user) {
    const duplicate = error?.message.toLowerCase().includes('already');
    return {
      ok: false,
      message: duplicate
        ? 'An account already exists for this email. Log in instead.'
        : 'Could not create the account. Try again or contact Destiny support.',
    };
  }

  const { error: claimError } = await admin.rpc(
    'claim_approved_restaurant_application',
    {
      target_application_id: application.id,
      target_owner_id: data.user.id,
    },
  );
  if (claimError) {
    await admin.auth.admin.deleteUser(data.user.id);
    console.error('[restaurant-application-claim]', claimError.message);
    return { ok: false, message: 'Could not claim the approved application.' };
  }

  const supabase = await createClient();
  const { error: loginError } = await supabase.auth.signInWithPassword({
    email: application.email,
    password: input.password,
  });
  if (loginError) {
    return {
      ok: true,
      message: 'Account created. Log in with your new password to continue.',
    };
  }
  revalidatePath('/', 'layout');
  return { ok: true };
}

export async function submitOwnerProfileForReview(): Promise<{
  ok: boolean;
  message?: string;
  missing?: string[];
}> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, message: 'Log in to continue.' };

  const { data: restaurant } = await supabase
    .from('restaurants')
    .select('*')
    .eq('owner_id', user.id)
    .maybeSingle();
  if (!restaurant || String(restaurant.status) !== 'profile_incomplete') {
    return { ok: false, message: 'This profile cannot be submitted.' };
  }

  const [menu, photos] = await Promise.all([
    supabase
      .from('menu_items')
      .select('id', { count: 'exact', head: true })
      .eq('restaurant_id', restaurant.id),
    supabase
      .from('restaurant_photos')
      .select('id', { count: 'exact', head: true })
      .eq('restaurant_id', restaurant.id),
  ]);
  const missing = profileMissingFields({
    ...restaurant,
    lat: restaurant.lat == null ? null : Number(restaurant.lat),
    lng: restaurant.lng == null ? null : Number(restaurant.lng),
    menuCount: menu.count ?? 0,
    photoCount: photos.count ?? 0,
  });
  if (missing.length) {
    return {
      ok: false,
      message: `Complete: ${missing.join(', ')}.`,
      missing,
    };
  }

  const admin = createWorkflowAdminClient();
  const { error } = await admin
    .from('restaurants')
    .update({
      status: 'profile_review',
      profile_submitted_at: new Date().toISOString(),
    })
    .eq('id', restaurant.id)
    .eq('owner_id', user.id)
    .eq('status', 'profile_incomplete');
  if (error) return { ok: false, message: 'Could not submit the profile.' };
  revalidatePath('/owner', 'layout');
  return { ok: true };
}

export type AccessibleApplication = {
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
  claimed_at: string | null;
  created_at: string;
};

export async function getApplicationByAccess(
  applicationId: string,
  token: string,
): Promise<AccessibleApplication | null> {
  if (!isSupabaseConfigured() || !applicationId || !token) return null;
  const admin = createWorkflowAdminClient();
  const { data } = await admin
    .from('restaurant_applications')
    .select('*')
    .eq('application_id', applicationId)
    .maybeSingle();
  if (!data) return null;

  const hash = hashApplicationToken(token);
  const permanentAccess = data.access_token_hash === hash;
  const actionAccess =
    data.action_token_hash === hash &&
    data.action_token_expires_at &&
    new Date(data.action_token_expires_at).getTime() > Date.now();
  if (!permanentAccess && !actionAccess) return null;
  return data as AccessibleApplication;
}
