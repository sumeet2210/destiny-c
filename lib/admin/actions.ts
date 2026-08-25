'use server';

import { revalidatePath } from 'next/cache';
import { getSessionUser } from '@/lib/auth/session';
import { createWorkflowAdminClient } from '@/lib/supabase/admin';
import { sendOnboardingEmail, siteUrl } from '@/lib/onboarding/email';
import {
  createApplicationToken,
  hashApplicationToken,
} from '@/lib/onboarding/tokens';

type AdminResult = { ok: boolean; message?: string; secureUrl?: string };

async function authorizedAdmin() {
  const user = await getSessionUser();
  return user?.role === 'admin' ? user : null;
}

export async function reviewRestaurantApplication(input: {
  id: string;
  decision: 'approved' | 'rejected' | 'more_info_required';
  reason?: string;
}): Promise<AdminResult> {
  const reviewer = await authorizedAdmin();
  if (!reviewer) return { ok: false, message: 'Admin access required.' };
  const reason = input.reason?.trim() ?? '';
  if (input.decision !== 'approved' && reason.length < 3) {
    return { ok: false, message: 'Add a reason or information request.' };
  }

  const admin = createWorkflowAdminClient();
  const { data: application } = await admin
    .from('restaurant_applications')
    .select('*')
    .eq('id', input.id)
    .maybeSingle();
  if (!application || application.status !== 'pending') {
    return { ok: false, message: 'Only pending applications can be reviewed.' };
  }

  const token = input.decision === 'rejected' ? null : createApplicationToken();
  const secureUrl = token
    ? `${siteUrl()}/owner/application/${application.application_id}?token=${encodeURIComponent(token)}`
    : undefined;
  const now = new Date().toISOString();
  const { error } = await admin
    .from('restaurant_applications')
    .update({
      status: input.decision,
      rejection_reason: input.decision === 'rejected' ? reason : null,
      more_info_request:
        input.decision === 'more_info_required' ? reason : null,
      reviewed_by: reviewer.id,
      reviewed_at: now,
      updated_at: now,
      action_token_hash: token ? hashApplicationToken(token) : null,
      action_token_expires_at: token
        ? new Date(Date.now() + 7 * 86_400_000).toISOString()
        : null,
    })
    .eq('id', input.id)
    .eq('status', 'pending');
  if (error) return { ok: false, message: 'Could not update the application.' };

  await admin.from('restaurant_application_audit').insert({
    application_id: input.id,
    admin_user_id: reviewer.id,
    action:
      input.decision === 'more_info_required'
        ? 'more_info_requested'
        : input.decision,
    from_status: 'pending',
    to_status: input.decision,
    notes: reason || null,
  });

  const copy =
    input.decision === 'approved'
      ? {
          subject: 'Your Destiny restaurant application is approved',
          text: `Your application ${application.application_id} has been approved. Create your restaurant account using this secure link (valid for 7 days): ${secureUrl}`,
        }
      : input.decision === 'more_info_required'
        ? {
            subject: 'More information needed for your Destiny application',
            text: `We need more information for application ${application.application_id}: ${reason}\n\nReply securely here: ${secureUrl}`,
          }
        : {
            subject: 'Update on your Destiny restaurant application',
            text: `Application ${application.application_id} was not approved. Reason: ${reason}`,
          };
  const emailed = await sendOnboardingEmail({ to: application.email, ...copy });
  revalidatePath('/admin', 'layout');
  return {
    ok: true,
    message: emailed
      ? 'Status updated and email sent.'
      : 'Status updated. Copy the secure link if needed.',
    secureUrl,
  };
}

export async function activateRestaurantProfile(
  id: string,
): Promise<AdminResult> {
  const reviewer = await authorizedAdmin();
  if (!reviewer) return { ok: false, message: 'Admin access required.' };
  const admin = createWorkflowAdminClient();
  const { data: restaurant } = await admin
    .from('restaurants')
    .select('id, name, application_id, status')
    .eq('id', id)
    .maybeSingle();
  if (!restaurant || restaurant.status !== 'profile_review') {
    return { ok: false, message: 'This profile is not awaiting review.' };
  }
  const now = new Date().toISOString();
  const { error } = await admin
    .from('restaurants')
    .update({ status: 'live', profile_reviewed_at: now, activated_at: now })
    .eq('id', id)
    .eq('status', 'profile_review');
  if (error)
    return { ok: false, message: 'Could not activate the restaurant.' };
  await admin.from('restaurant_application_audit').insert({
    application_id: restaurant.application_id,
    restaurant_id: id,
    admin_user_id: reviewer.id,
    action: 'profile_activated',
    from_status: 'profile_review',
    to_status: 'live',
  });
  if (restaurant.application_id) {
    const { data: application } = await admin
      .from('restaurant_applications')
      .select('email')
      .eq('id', restaurant.application_id)
      .maybeSingle();
    if (application?.email) {
      await sendOnboardingEmail({
        to: application.email,
        subject: `${restaurant.name} is live on Destiny`,
        text: `Your restaurant profile has been approved and is now live on Destiny. Open your dashboard: ${siteUrl()}/owner/login`,
      });
    }
  }
  revalidatePath('/admin', 'layout');
  revalidatePath('/');
  return {
    ok: true,
    message: 'Restaurant activated and now publicly visible.',
  };
}
