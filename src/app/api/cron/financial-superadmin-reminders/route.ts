/**
 * Trial/renewal SuperAdmin reminder emails (DB settings).
 * Preferred: same as low-stock — POST /api/integrations/{slug}/services/financial-superadmin-reminders
 * with Bearer wo_int_…
 *
 * This GET path still works for schedulers: Bearer wo_int_… (integration key) or legacy CRON_SECRET / ?secret=
 */
import { NextRequest, NextResponse } from 'next/server'
import {
  runFinancialTrialRemindersCron,
  runFinancialRenewalRemindersCron,
} from '@/lib/financial-superadmin-notifications'
import { authorizeFinancialRemindersRequest } from '@/lib/financial-superadmin-reminders-auth'

export async function GET(request: NextRequest) {
  const auth = await authorizeFinancialRemindersRequest(request)
  if (auth instanceof NextResponse) return auth
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
