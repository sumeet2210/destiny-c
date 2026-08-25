'use server';

// P4-1..P4-4: auth server actions. The domain check runs here (first layer)
// and again in Postgres via is_nitw_student_email (second layer).

import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { isStudentEmail } from '@/config/auth';
import {
  isFavoriteCuisine,
  isFoodType,
  isSpicePreference,
  type FavoriteCuisine,
  type FoodType,
  type SpicePreference,
} from '@/config/food-preferences';
import { createClient, isSupabaseConfigured } from '@/lib/supabase/server';

export type AuthResult = { ok: boolean; message?: string };

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

function studentProfileDetails(fullName: string, phone: string) {
  const normalizedName = fullName.trim();
  const compactPhone = phone.replace(/[\s()-]/g, '');
  const digits = compactPhone.startsWith('+91')
    ? compactPhone.slice(3)
    : compactPhone;

  if (normalizedName.length < 2 || normalizedName.length > 120) {
    return { ok: false as const, message: 'Enter your full name.' };
  }
  if (!/^\d{10}$/.test(digits)) {
    return {
      ok: false as const,
      message: 'Enter a valid 10-digit Indian phone number.',
    };
  }

  return {
    ok: true as const,
    fullName: normalizedName,
    phone: `+91${digits}`,
  };
}

export async function requestStudentOtp(
  email: string,
  fullName: string,
  phone: string,
): Promise<AuthResult> {
  if (!isSupabaseConfigured()) return NOT_CONFIGURED;
  const profile = studentProfileDetails(fullName, phone);
  if (!profile.ok) return profile;
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
    options: {
      shouldCreateUser: true,
      data: {
        role: 'student',
        full_name: profile.fullName,
        phone: profile.phone,
      },
    },
  });
  if (error) return { ok: false, message: friendlyAuthError(error) };
  return { ok: true };
}

export async function verifyStudentOtp(
  email: string,
  token: string,
  fullName: string,
  phone: string,
): Promise<AuthResult> {
  if (!isSupabaseConfigured()) return NOT_CONFIGURED;
  const profile = studentProfileDetails(fullName, phone);
  if (!profile.ok) return profile;
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
    const { error: profileError } = await supabase
      .from('users')
      .update({
        nitw_verified: true,
        full_name: profile.fullName,
        phone: profile.phone,
      })
      .eq('id', user.id);
    if (profileError) {
      console.error('[auth] student profile update', profileError.message);
      return {
        ok: false,
        message: 'Your email is verified, but we could not save your profile.',
      };
    }
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
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) return { ok: false, message: friendlyAuthError(error) };
  revalidatePath('/', 'layout');
  return { ok: true };
}

export async function ownerSignup(): Promise<AuthResult> {
  return {
    ok: false,
    message:
      'Restaurant accounts can only be created from an approved application.',
  };
}

/**
 * P9-3: activity sharing is opt-in and OFF by default (config/social.ts).
 * Also lets the student set their hostel, shown to friends only.
 */
export async function updateStudentProfile(input: {
  hostel?: string | null;
  share_activity?: boolean;
}): Promise<AuthResult> {
  if (!isSupabaseConfigured()) return NOT_CONFIGURED;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, message: 'Not logged in.' };
  const { error } = await supabase
    .from('users')
    .update(input)
    .eq('id', user.id);
  if (error) return { ok: false, message: error.message };
  revalidatePath('/account');
  return { ok: true };
}

export async function updateStudentFoodPreferences(input: {
  foodType: FoodType | null;
  favoriteCuisines: FavoriteCuisine[];
  spicePreference: SpicePreference | null;
}): Promise<AuthResult> {
  if (!isSupabaseConfigured()) return NOT_CONFIGURED;
  if (!input.foodType || !isFoodType(input.foodType)) {
    return { ok: false, message: 'Choose your food type.' };
  }
  if (!input.spicePreference || !isSpicePreference(input.spicePreference)) {
    return { ok: false, message: 'Choose your spice preference.' };
  }

  const favoriteCuisines = [...new Set(input.favoriteCuisines)];
  if (
    favoriteCuisines.length === 0 ||
    favoriteCuisines.some((cuisine) => !isFavoriteCuisine(cuisine))
  ) {
    return { ok: false, message: 'Choose at least one favorite cuisine.' };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, message: 'Not logged in.' };

  const { error } = await supabase
    .from('users')
    .update({
      food_type: input.foodType,
      favorite_cuisines: favoriteCuisines,
      spice_preference: input.spicePreference,
    })
    .eq('id', user.id);
  if (error) {
    console.error('[profile] food preferences', error.message);
    return { ok: false, message: 'Could not save your food preferences.' };
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
