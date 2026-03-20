/**
 * Daily cron: trial-ending and renewal-approaching emails to SuperAdmin (DB settings).
 * Secure with Authorization: Bearer CRON_SECRET or ?secret=
 */
import { NextRequest, NextResponse } from 'next/server'
import {
  runFinancialTrialRemindersCron,
  runFinancialRenewalRemindersCron,
} from '@/lib/financial-superadmin-notifications'

function authorize(request: NextRequest): boolean {
  const secret = process.env.CRON_SECRET
  if (!secret) return false
  const auth = request.headers.get('authorization')
  if (auth === `Bearer ${secret}`) return true
  const q = request.nextUrl.searchParams.get('secret')
  return q === secret
}

export async function GET(request: NextRequest) {
  if (!authorize(request)) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
  }
  try {
    const trial = await runFinancialTrialRemindersCron()
    const renewal = await runFinancialRenewalRemindersCron()
    return NextResponse.json({
      ok: true,
      trialRemindersSent: trial.sent,
      renewalRemindersSent: renewal.sent,
    })
  } catch (e) {
    console.error('financial-superadmin-reminders cron:', e)
    return NextResponse.json({ message: 'Cron failed' }, { status: 500 })
  }
}
