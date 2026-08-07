'use server';

// P4-1..P4-4: auth server actions. The domain check runs here (first layer)
// and again in Postgres via is_nitw_student_email (second layer).

import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { isStudentEmail } from '@/config/auth';
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
 * ones a student can actually hit; log the rest and stay vague rather than
 * leaking internals.
 */
function friendlyAuthError(error: { message: string; code?: string }): string {
  const code = error.code ?? '';
  const raw = error.message.toLowerCase();

  if (code === 'over_email_send_rate_limit' || raw.includes('rate limit')) {
    return "We can't send codes right now — give it a few minutes and try again.";
  }
  if (raw.includes('token has expired') || raw.includes('expired')) {
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
  if (error) return { ok: false, message: error.message };
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
  if (error) return { ok: false, message: error.message };
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

export async function signOut(): Promise<void> {
  if (isSupabaseConfigured()) {
    const supabase = await createClient();
    await supabase.auth.signOut();
  }
  revalidatePath('/', 'layout');
  redirect('/');
}
