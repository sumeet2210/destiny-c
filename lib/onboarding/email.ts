import 'server-only';

export async function sendOnboardingEmail(input: {
  to: string;
  subject: string;
  text: string;
}): Promise<boolean> {
  if (!process.env.RESEND_API_KEY) return false;
  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'Destiny <noreply@destiny.local>',
        ...input,
      }),
    });
    return response.ok;
  } catch {
    return false;
  }
}

export const siteUrl = () =>
  (process.env.SITE_URL ?? 'http://localhost:3000').replace(/\/$/, '');
