'use server';

// P4-1..P4-4: auth server actions. The domain check runs here (first layer)
// and again in Postgres via is_nitw_student_email (second layer).

import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { isStudentEmail } from '@/config/auth';
import { normalizeStudentPatch } from '@/lib/domain/student-preferences';
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
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) return { ok: false, message: friendlyAuthError(error) };
  revalidatePath('/', 'layout');
  return { ok: true };
}

export async function ownerSignup(
  email: string,
  password: string,
  fullName: string,
): Promise<AuthResult> {
  if (!isSupabaseConfigured()) return NOT_CONFIGURED;
  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { role: 'owner', full_name: fullName } },
  });
  if (error) return { ok: false, message: friendlyAuthError(error) };
  if (!data.session) {
    return {
      ok: true,
      message: 'Check your email to confirm the account, then log in.',
    };
  }
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
