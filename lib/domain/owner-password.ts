export const OWNER_PASSWORD_MIN_LENGTH = 8;
export const OWNER_PASSWORD_OTP_MAX_AGE_SECONDS = 15 * 60;

type PasswordResult =
  { ok: true; password: string } | { ok: false; message: string };

export function normalizeOwnerPasswordCode(
  value: unknown,
): { ok: true; code: string } | { ok: false; message: string } {
  const code = typeof value === 'string' ? value.replace(/\s/g, '') : '';
  // The hosted project currently issues eight digits, while a default local
  // Supabase project issues six. Accept both without weakening the check to
  // arbitrary text.
  if (!/^\d{6,8}$/.test(code)) {
    return {
      ok: false,
      message: 'Enter the 6–8 digit code from your email.',
    };
  }
  return { ok: true, code };
}

export function validateNewOwnerPassword(input: {
  password: unknown;
  confirmPassword: unknown;
}): PasswordResult {
  const password = typeof input.password === 'string' ? input.password : '';
  const confirmation =
    typeof input.confirmPassword === 'string' ? input.confirmPassword : '';

  if (password.length < OWNER_PASSWORD_MIN_LENGTH) {
    return {
      ok: false,
      message: `Use at least ${OWNER_PASSWORD_MIN_LENGTH} characters for your new password.`,
    };
  }
  if (password.length > 128) {
    return { ok: false, message: 'Use no more than 128 characters.' };
  }
  if (password !== confirmation) {
    return { ok: false, message: 'The two passwords do not match.' };
  }
  return { ok: true, password };
}

type AuthenticationMethod = string | { method: string; timestamp: number };

/**
 * A password change is unlocked only by a freshly verified email OTP session.
 * Object AMR entries carry their own timestamp; string-only AMR entries use
 * the signed token's issued-at time as a conservative fallback.
 */
export function hasRecentOwnerEmailOtp(
  methods: AuthenticationMethod[] | undefined,
  issuedAt: number,
  now = Math.floor(Date.now() / 1000),
): boolean {
  if (!methods?.length) return false;
  const isEmailOtp = (method: string) => method === 'otp' || method === 'email';

  return methods.some((entry) => {
    const method = typeof entry === 'string' ? entry : entry.method;
    const timestamp = typeof entry === 'string' ? issuedAt : entry.timestamp;
    const age = now - timestamp;
    return (
      isEmailOtp(method) &&
      Number.isFinite(timestamp) &&
      age >= 0 &&
      age <= OWNER_PASSWORD_OTP_MAX_AGE_SECONDS
    );
  });
}

export function maskAccountEmail(email: string): string {
  const [local, domain] = email.trim().split('@');
  if (!local || !domain) return 'your account email';
  const visible = local.slice(0, Math.min(2, local.length));
  return `${visible}${'*'.repeat(Math.max(3, local.length - visible.length))}@${domain}`;
}
