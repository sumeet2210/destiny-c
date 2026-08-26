'use server';

// P4-1..P4-4: auth server actions. The domain check runs here (first layer)
// and again in Postgres via is_nitw_student_email (second layer).

import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { isStudentEmail } from '@/config/auth';
import {
  normalizeOwnerSignupRestaurant,
  type OwnerSignupRestaurant,
  type OwnerSignupRestaurantInput,
} from '@/lib/domain/owner-profile';
import { normalizeStudentPatch } from '@/lib/domain/student-preferences';
import { createClient, isSupabaseConfigured } from '@/lib/supabase/server';
import type { User } from '@supabase/supabase-js';

export type AuthResult = { ok: boolean; message?: string };

export type OwnerSignupInput = OwnerSignupRestaurantInput & {
  email: string;
  password: string;
};

const NOT_CONFIGURED: AuthResult = {
  ok: false,
  message:
    'Auth needs a Supabase project. Add the env vars from .env.example to log in.',
};

/**
 * Supabase's raw auth errors are written for developers — "email rate limit
 * exceeded" reads to a student like they did something wrong. Translate the
 * ones a student or owner can actually hit; log the rest and stay vague rather
 * than leaking internals.
 *
 * Every branch below is reachable from the UI, so keep the copy audience-
 * neutral: students hit this on the OTP form, owners on login and signup.
 */
function friendlyAuthError(error: { message: string; code?: string }): string {
  const code = error.code ?? '';
  const raw = error.message.toLowerCase();

  if (code === 'over_email_send_rate_limit' || raw.includes('rate limit')) {
    return 'Too many emails have gone out just now — give it a few minutes and try again.';
  }
  if (
    code === 'invalid_credentials' ||
    raw.includes('invalid login credentials')
  ) {
    return 'That email and password do not match.';
  }
  if (code === 'email_not_confirmed' || raw.includes('email not confirmed')) {
    return 'Confirm your email from the link we sent, then log in.';
  }
  if (code === 'user_already_exists' || raw.includes('already registered')) {
    return 'An account with that email already exists — log in instead.';
  }
  // GoTrue collapses a stale code and a mistyped one into a single
  // "Token has expired or is invalid", so we genuinely cannot tell them
  // apart — name both rather than blaming the wrong one.
  if (raw.includes('expired') && raw.includes('invalid')) {
    return "That code didn't match, or it has expired. Request a new one.";
  }
  if (raw.includes('expired')) {
    return 'That code has expired. Request a new one.';
  }
  if (raw.includes('invalid') && raw.includes('token')) {
    return "That code didn't match. Check it and try again.";
  }
  if (raw.includes('email address') && raw.includes('invalid')) {
    return 'That email address looks wrong.';
  }

  console.error('[auth]', error.code ?? '', error.message);
  return 'Something went wrong on our side. Try again in a moment.';
}

function restaurantFromMetadata(user: User): OwnerSignupRestaurant | null {
  const metadata = user.user_metadata;
  const normalized = normalizeOwnerSignupRestaurant({
    restaurantName: String(metadata.restaurant_name ?? ''),
    ownerName: String(metadata.owner_name ?? ''),
    phone: String(metadata.restaurant_phone ?? ''),
    address: String(metadata.restaurant_address ?? ''),
    area: String(metadata.restaurant_area ?? ''),
  });
  return normalized.ok ? normalized.restaurant : null;
}

/**
 * Email confirmation can leave owner signup without a session, so the
 * normalized listing draft is also stored in auth metadata. The first
 * confirmed login uses it to create the pending restaurant exactly once.
 */
async function ensureOwnerRestaurant(
  supabase: Awaited<ReturnType<typeof createClient>>,
  user: User,
  supplied?: OwnerSignupRestaurant,
): Promise<AuthResult | null> {
  if (user.user_metadata.role !== 'owner') return null;
  const restaurant = supplied ?? restaurantFromMetadata(user);
  if (!restaurant) return null;

  const { data: existing, error: lookupError } = await supabase
    .from('restaurants')
    .select('id')
    .eq('owner_id', user.id)
    .limit(1)
    .maybeSingle();
  if (lookupError) {
    console.error('[owner-onboarding]', lookupError.message);
    return {
      ok: false,
      message: 'Could not prepare your restaurant listing. Try again.',
    };
  }
  if (existing) return null;

  const { error } = await supabase.from('restaurants').insert({
    ...restaurant,
    owner_id: user.id,
    status: 'pending_approval',
  });
  if (error) {
    console.error('[owner-onboarding]', error.message);
    return {
      ok: false,
      message: 'Could not prepare your restaurant listing. Try again.',
    };
  }
  return null;
}

export async function requestStudentOtp(email: string): Promise<AuthResult> {
  if (!isSupabaseConfigured()) return NOT_CONFIGURED;
  if (!isStudentEmail(email)) {
    return {
      ok: false,
      message:
        'Use your NITW student email — that’s what keeps this campus-only.',
    };
  }
  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: { shouldCreateUser: true, data: { role: 'student' } },
  });
  if (error) return { ok: false, message: friendlyAuthError(error) };
  return { ok: true };
}

export async function verifyStudentOtp(
  email: string,
  token: string,
): Promise<AuthResult> {
  if (!isSupabaseConfigured()) return NOT_CONFIGURED;
  const supabase = await createClient();
  const { error } = await supabase.auth.verifyOtp({
    email,
    token,
    type: 'email',
  });
  if (error) return { ok: false, message: friendlyAuthError(error) };
  // OTP over the institute domain is the verification (architecture.md §3).
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (user) {
    await supabase
      .from('users')
      .update({ nitw_verified: true })
      .eq('id', user.id);
  }
  revalidatePath('/', 'layout');
  return { ok: true };
}

export async function ownerLogin(
  email: string,
  password: string,
): Promise<AuthResult> {
  if (!isSupabaseConfigured()) return NOT_CONFIGURED;
  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });
  if (error) return { ok: false, message: friendlyAuthError(error) };
  const onboardingError = await ensureOwnerRestaurant(supabase, data.user);
  if (onboardingError) return onboardingError;
  revalidatePath('/', 'layout');
  return { ok: true };
}

export async function ownerSignup(
  input: OwnerSignupInput,
): Promise<AuthResult> {
  if (!isSupabaseConfigured()) return NOT_CONFIGURED;
  const normalized = normalizeOwnerSignupRestaurant(input);
  if (!normalized.ok) return { ok: false, message: normalized.message };

  const { restaurant } = normalized;
  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({
    email: input.email.trim(),
    password: input.password,
    options: {
      data: {
        role: 'owner',
        full_name: restaurant.owner_name,
        restaurant_name: restaurant.name,
        owner_name: restaurant.owner_name,
        restaurant_phone: restaurant.phone,
        restaurant_address: restaurant.address,
        restaurant_area: restaurant.area,
      },
    },
  });
  if (error) return { ok: false, message: friendlyAuthError(error) };
  if (!data.session) {
    return {
      ok: true,
      message: 'Check your email to confirm the account, then log in.',
    };
  }
  if (!data.user) {
    return {
      ok: false,
      message: 'Your account was created, but the listing could not start.',
    };
  }
  const onboardingError = await ensureOwnerRestaurant(
    supabase,
    data.user,
    restaurant,
  );
  if (onboardingError) return onboardingError;
  revalidatePath('/', 'layout');
  return { ok: true };
}

/**
 * P9-3: activity sharing is opt-in and OFF by default (config/social.ts).
 * Also carries the student's hostel (friends only) and taste preferences.
 *
 * The patch is rebuilt from an allowlist rather than forwarded, because these
 * arguments arrive over the network: the parameter type below is a compile-time
 * convenience, and the "users update own profile" RLS policy only checks that
 * the row belongs to the caller — not which columns are written. Without
 * normalizeStudentPatch, `{ role: 'owner' }` would be a valid escalation.
 */
export async function updateStudentProfile(input: {
  full_name?: string | null;
  phone?: string | null;
  hostel?: string | null;
  share_activity?: boolean;
  food_type?: string | null;
  favorite_cuisines?: string[];
  spice_preference?: string | null;
}): Promise<AuthResult> {
  if (!isSupabaseConfigured()) return NOT_CONFIGURED;
  const normalized = normalizeStudentPatch(input as Record<string, unknown>);
  if (!normalized.ok) return { ok: false, message: normalized.message };
  // Nothing recognisable to write. Reported as success because the student's
  // intent — "leave my profile as it is" — has been honoured.
  if (Object.keys(normalized.patch).length === 0) return { ok: true };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, message: 'Not logged in.' };
  const { error } = await supabase
    .from('users')
    .update(normalized.patch)
    .eq('id', user.id);
  if (error) {
    // Same rule as friendlyAuthError: the student cannot act on a Postgres
    // message, and constraint names are not theirs to read.
    console.error('[profile]', error.message);
    return { ok: false, message: 'Could not save that. Try again.' };
  }
  revalidatePath('/account');
  return { ok: true };
}

export async function signOut(): Promise<void> {
  if (isSupabaseConfigured()) {
    const supabase = await createClient();
    await supabase.auth.signOut();
  }
  revalidatePath('/', 'layout');
  redirect('/');
}
