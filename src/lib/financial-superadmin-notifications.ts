/**
 * SuperAdmin financial / subscription email alerts (platform-wide).
 * Recipients and toggles live in PlatformFinancialNotificationSettings (DB).
 * Excludes Stripe free-price (SuperAdmin comp) subscriptions.
 * Skips users whose only businesses are test / deactivated / inactive (aligned with financial APIs).
 */
import { Resend } from 'resend'
import { prisma } from '@/lib/prisma'
import { getBillingTypeFromPriceId } from '@/lib/stripe'
import {
  addUtcDays,
  normalizeFinancialNotificationEmails,
  planTier,
  userQualifiesForFinancialSuperadminAlertsFromBusinesses,
  utcDayRange,
} from '@/lib/financial-superadmin-notification-utils'

const resend = new Resend(process.env.RESEND_API_KEY)

const SETTINGS_KEY = 'default'
const BASE_URL = process.env.NEXTAUTH_URL || 'https://waveorder.app'

/** True if this Stripe price is a $0 comp / SuperAdmin free plan. */
export function isFreeStripePriceId(priceId: string | null | undefined): boolean {
  if (!priceId) return true
  return getBillingTypeFromPriceId(priceId) === 'free'
}

/**
 * Load the user's businesses and apply the same eligibility rules as financial subscription alerts.
 */
export async function userQualifiesForFinancialSuperadminAlerts(userId: string): Promise<boolean> {
  const links = await prisma.businessUser.findMany({
    where: { userId },
    select: {
      business: {
        select: { testMode: true, isActive: true, deactivatedAt: true },
      },
    },
  })
  return userQualifiesForFinancialSuperadminAlertsFromBusinesses(
    links.map((l) => l.business)
  )
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

function wrapFinancialEmail(title: string, bodyHtml: string): string {
  return `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>${escapeHtml(title)}</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 0; padding: 0; background-color: #f8fafc;">
  <div style="max-width: 600px; margin: 0 auto; background-color: white; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
    <div style="background: linear-gradient(135deg, #0d9488 0%, #14b8a6 100%); padding: 32px 20px; text-align: center;">
      <p style="color: white; margin: 0; font-size: 18px; font-weight: 700;">WaveOrder — Financial alert</p>
      <p style="color: rgba(255,255,255,0.9); margin: 8px 0 0; font-size: 14px;">${escapeHtml(title)}</p>
    </div>
    <div style="padding: 24px; color: #374151; font-size: 15px; line-height: 1.6;">
      ${bodyHtml}
    </div>
    <div style="background-color: #f9fafb; padding: 20px; text-align: center; border-top: 1px solid #e5e7eb;">
      <p style="color: #9ca3af; margin: 0; font-size: 12px;">© ${new Date().getFullYear()} VenueBoost Inc. — SuperAdmin notifications</p>
    </div>
  </div>
</body>
</html>`
}

export async function getPlatformFinancialNotificationSettings() {
  let row = await prisma.platformFinancialNotificationSettings.findUnique({
    where: { key: SETTINGS_KEY },
  })
  if (!row) {
    row = await prisma.platformFinancialNotificationSettings.create({
      data: { key: SETTINGS_KEY },
    })
  }
  return row
}

export {
  addUtcDays,
  normalizeFinancialNotificationEmails,
  planTier,
  userQualifiesForFinancialSuperadminAlertsFromBusinesses,
  type BusinessFinancialAlertEligibility,
  utcDayRange,
} from '@/lib/financial-superadmin-notification-utils'

async function sendToRecipients(subject: string, html: string, recipients: string[]) {
  if (!recipients.length || !process.env.RESEND_API_KEY) return
  const from = process.env.RESEND_FROM_FINANCIAL || 'WaveOrder <contact@waveorder.app>'
  for (const to of recipients) {
    try {
      await resend.emails.send({ from, to, subject, html })
    } catch (e) {
      console.error('[financial-superadmin-notifications] send failed', to, e)
    }
  }
}

export async function notifyFinancialNewPaidSignup(params: {
  customerEmail: string
  customerName: string | null
  plan: string
  status: string
}) {
  const s = await getPlatformFinancialNotificationSettings()
  if (!s.notifyNewPaidSignup || !s.financialNotificationEmails.length) return
  const html = wrapFinancialEmail(
    'New paid signup',
    `<p><strong>${escapeHtml(params.customerName || params.customerEmail)}</strong> (${escapeHtml(params.customerEmail)})</p>
     <p>Plan: <strong>${escapeHtml(params.plan)}</strong> · Status: <strong>${escapeHtml(params.status)}</strong></p>
     <p><a href="${BASE_URL}/superadmin/financial/subscriptions" style="color:#0d9488;">Open Subscriptions</a></p>`
  )
  await sendToRecipients(`WaveOrder: New paid signup — ${params.plan}`, html, s.financialNotificationEmails)
}

export async function notifyFinancialPlanChange(params: {
  customerEmail: string
  customerName: string | null
  direction: 'upgrade' | 'downgrade'
  oldPlan: string
  newPlan: string
}) {
  const s = await getPlatformFinancialNotificationSettings()
  const on = params.direction === 'upgrade' ? s.notifyPlanUpgrade : s.notifyPlanDowngrade
  if (!on || !s.financialNotificationEmails.length) return
  const title = params.direction === 'upgrade' ? 'Plan upgrade' : 'Plan downgrade'
  const html = wrapFinancialEmail(
    title,
    `<p><strong>${escapeHtml(params.customerName || params.customerEmail)}</strong> (${escapeHtml(params.customerEmail)})</p>
     <p>${escapeHtml(params.oldPlan)} → <strong>${escapeHtml(params.newPlan)}</strong></p>
     <p><a href="${BASE_URL}/superadmin/financial/subscriptions" style="color:#0d9488;">Open Subscriptions</a></p>`
  )
  await sendToRecipients(
    `WaveOrder: ${title} — ${params.oldPlan} → ${params.newPlan}`,
    html,
    s.financialNotificationEmails
  )
}

export async function notifyFinancialSubscriptionCanceled(params: {
  customerEmail: string
  customerName: string | null
  previousPlan: string
}) {
  const s = await getPlatformFinancialNotificationSettings()
  if (!s.notifySubscriptionCanceled || !s.financialNotificationEmails.length) return
  const html = wrapFinancialEmail(
    'Subscription canceled',
    `<p><strong>${escapeHtml(params.customerName || params.customerEmail)}</strong> (${escapeHtml(params.customerEmail)})</p>
     <p>Previous plan: <strong>${escapeHtml(params.previousPlan)}</strong></p>
     <p><a href="${BASE_URL}/superadmin/financial/subscriptions" style="color:#0d9488;">Open Subscriptions</a></p>`
  )
  await sendToRecipients(
    `WaveOrder: Subscription canceled — ${params.previousPlan}`,
    html,
    s.financialNotificationEmails
  )
}

export async function notifyFinancialPaymentFailed(params: {
  customerEmail: string
  customerName: string | null
  amount: number
  currency: string
}) {
  const s = await getPlatformFinancialNotificationSettings()
  if (!s.notifyPaymentFailed || !s.financialNotificationEmails.length) return
  const html = wrapFinancialEmail(
    'Payment failed',
    `<p><strong>${escapeHtml(params.customerName || params.customerEmail)}</strong> (${escapeHtml(params.customerEmail)})</p>
     <p>Amount due: <strong>${params.amount.toFixed(2)} ${params.currency.toUpperCase()}</strong></p>
     <p><a href="${BASE_URL}/superadmin/financial/subscriptions" style="color:#0d9488;">Open Subscriptions</a></p>`
  )
  await sendToRecipients(`WaveOrder: Payment failed — ${params.customerEmail}`, html, s.financialNotificationEmails)
}

export async function notifyFinancialTrialEnding(params: {
  customerEmail: string
  customerName: string | null
  trialEndsAt: Date
}) {
  const s = await getPlatformFinancialNotificationSettings()
  if (!s.notifyTrialEnding || !s.financialNotificationEmails.length) return
  const html = wrapFinancialEmail(
    'Trial ending soon',
    `<p><strong>${escapeHtml(params.customerName || params.customerEmail)}</strong> (${escapeHtml(params.customerEmail)})</p>
     <p>Trial ends: <strong>${params.trialEndsAt.toISOString().split('T')[0]}</strong></p>
     <p><a href="${BASE_URL}/superadmin/financial/subscriptions" style="color:#0d9488;">Open Subscriptions</a></p>`
  )
  await sendToRecipients(`WaveOrder: Trial ending — ${params.customerEmail}`, html, s.financialNotificationEmails)
}

export async function notifyFinancialRenewalApproaching(params: {
  customerEmail: string
  customerName: string | null
  plan: string
  currentPeriodEnd: Date
}) {
  const s = await getPlatformFinancialNotificationSettings()
  if (!s.notifyRenewalApproaching || !s.financialNotificationEmails.length) return
  const html = wrapFinancialEmail(
    'Renewal approaching',
    `<p><strong>${escapeHtml(params.customerName || params.customerEmail)}</strong> (${escapeHtml(params.customerEmail)})</p>
     <p>Plan: <strong>${escapeHtml(params.plan)}</strong></p>
     <p>Current period ends: <strong>${params.currentPeriodEnd.toISOString().split('T')[0]}</strong></p>
     <p><a href="${BASE_URL}/superadmin/financial/subscriptions" style="color:#0d9488;">Open Subscriptions</a></p>`
  )
  await sendToRecipients(`WaveOrder: Renewal approaching — ${params.customerEmail}`, html, s.financialNotificationEmails)
}

/**
 * Cron: trial ending in N days — one email per subscription per trial end timestamp.
 */
export async function runFinancialTrialRemindersCron(): Promise<{ sent: number }> {
  const s = await getPlatformFinancialNotificationSettings()
  if (!s.notifyTrialEnding || !s.financialNotificationEmails.length) {
    return { sent: 0 }
  }
  const n = Math.max(1, Math.min(30, s.trialDaysBefore))
  const target = addUtcDays(new Date(), n)
  const { start, end } = utcDayRange(target)

  const subs = await prisma.subscription.findMany({
    where: {
      status: 'trialing',
    },
    include: {
      users: { take: 1, select: { id: true, email: true, name: true, trialEndsAt: true } },
    },
  })

  let sent = 0
  for (const sub of subs) {
    if (isFreeStripePriceId(sub.priceId)) continue
    const user = sub.users[0]
    if (!user?.email || !user.trialEndsAt) continue
    if (!(await userQualifiesForFinancialSuperadminAlerts(user.id))) continue
    const te = new Date(user.trialEndsAt)
    if (te < start || te >= end) continue
    if (
      sub.financialTrialNoticeForTrialEnd &&
      sub.financialTrialNoticeForTrialEnd.getTime() === te.getTime()
    ) {
      continue
    }
    await notifyFinancialTrialEnding({
      customerEmail: user.email,
      customerName: user.name,
      trialEndsAt: te,
    })
    await prisma.subscription.update({
      where: { id: sub.id },
      data: { financialTrialNoticeForTrialEnd: te },
    })
    sent++
  }
  return { sent }
}

/**
 * Cron: renewal in N days — one email per subscription per billing period end.
 */
export async function runFinancialRenewalRemindersCron(): Promise<{ sent: number }> {
  const s = await getPlatformFinancialNotificationSettings()
  if (!s.notifyRenewalApproaching || !s.financialNotificationEmails.length) {
    return { sent: 0 }
  }
  const n = Math.max(1, Math.min(30, s.renewalDaysBefore))
  const target = addUtcDays(new Date(), n)
  const { start, end } = utcDayRange(target)

  const subs = await prisma.subscription.findMany({
    where: {
      status: { in: ['active', 'trialing'] },
    },
    include: {
      users: { take: 1, select: { id: true, email: true, name: true } },
    },
  })

  let sent = 0
  for (const sub of subs) {
    if (isFreeStripePriceId(sub.priceId)) continue
    // Skip trialing for renewal (period end is not a "renewal" in same sense)
    if (sub.status === 'trialing') continue
    const pe = new Date(sub.currentPeriodEnd)
    if (pe < start || pe >= end) continue
    if (
      sub.financialRenewalNoticeForPeriodEnd &&
      sub.financialRenewalNoticeForPeriodEnd.getTime() === pe.getTime()
    ) {
      continue
    }
    const user = sub.users[0]
    if (!user?.email) continue
    if (!(await userQualifiesForFinancialSuperadminAlerts(user.id))) continue
    await notifyFinancialRenewalApproaching({
      customerEmail: user.email,
      customerName: user.name,
      plan: sub.plan,
      currentPeriodEnd: pe,
    })
    await prisma.subscription.update({
      where: { id: sub.id },
      data: { financialRenewalNoticeForPeriodEnd: pe },
    })
    sent++
  }
  return { sent }
}
