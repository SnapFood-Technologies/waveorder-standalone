import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import {
  getPlatformFinancialNotificationSettings,
  normalizeFinancialNotificationEmails,
} from '@/lib/financial-superadmin-notifications'

const SETTINGS_KEY = 'default'

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session || session.user.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
    }

    const s = await getPlatformFinancialNotificationSettings()
    return NextResponse.json({
      financialNotificationEmails: s.financialNotificationEmails,
      notifyNewPaidSignup: s.notifyNewPaidSignup,
      notifyPlanUpgrade: s.notifyPlanUpgrade,
      notifyPlanDowngrade: s.notifyPlanDowngrade,
      notifySubscriptionCanceled: s.notifySubscriptionCanceled,
      notifyPaymentFailed: s.notifyPaymentFailed,
      notifyTrialEnding: s.notifyTrialEnding,
      notifyRenewalApproaching: s.notifyRenewalApproaching,
      trialDaysBefore: s.trialDaysBefore,
      renewalDaysBefore: s.renewalDaysBefore,
    })
  } catch (e) {
    console.error('GET financial-notifications:', e)
    return NextResponse.json({ message: 'Failed to load settings' }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || session.user.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const emails = normalizeFinancialNotificationEmails(
      Array.isArray(body.financialNotificationEmails) ? body.financialNotificationEmails : []
    )

    const trialDaysBefore = Math.min(30, Math.max(1, parseInt(String(body.trialDaysBefore ?? 3), 10) || 3))
    const renewalDaysBefore = Math.min(30, Math.max(1, parseInt(String(body.renewalDaysBefore ?? 3), 10) || 3))

    const bool = (v: unknown, fallback: boolean) =>
      typeof v === 'boolean' ? v : fallback

    await prisma.platformFinancialNotificationSettings.upsert({
      where: { key: SETTINGS_KEY },
      create: {
        key: SETTINGS_KEY,
        financialNotificationEmails: emails,
        notifyNewPaidSignup: bool(body.notifyNewPaidSignup, true),
        notifyPlanUpgrade: bool(body.notifyPlanUpgrade, true),
        notifyPlanDowngrade: bool(body.notifyPlanDowngrade, true),
        notifySubscriptionCanceled: bool(body.notifySubscriptionCanceled, true),
        notifyPaymentFailed: bool(body.notifyPaymentFailed, true),
        notifyTrialEnding: bool(body.notifyTrialEnding, true),
        notifyRenewalApproaching: bool(body.notifyRenewalApproaching, true),
        trialDaysBefore,
        renewalDaysBefore,
      },
      update: {
        financialNotificationEmails: emails,
        notifyNewPaidSignup: bool(body.notifyNewPaidSignup, true),
        notifyPlanUpgrade: bool(body.notifyPlanUpgrade, true),
        notifyPlanDowngrade: bool(body.notifyPlanDowngrade, true),
        notifySubscriptionCanceled: bool(body.notifySubscriptionCanceled, true),
        notifyPaymentFailed: bool(body.notifyPaymentFailed, true),
        notifyTrialEnding: bool(body.notifyTrialEnding, true),
        notifyRenewalApproaching: bool(body.notifyRenewalApproaching, true),
        trialDaysBefore,
        renewalDaysBefore,
      },
    })

    const s = await getPlatformFinancialNotificationSettings()
    return NextResponse.json({
      financialNotificationEmails: s.financialNotificationEmails,
      notifyNewPaidSignup: s.notifyNewPaidSignup,
      notifyPlanUpgrade: s.notifyPlanUpgrade,
      notifyPlanDowngrade: s.notifyPlanDowngrade,
      notifySubscriptionCanceled: s.notifySubscriptionCanceled,
      notifyPaymentFailed: s.notifyPaymentFailed,
      notifyTrialEnding: s.notifyTrialEnding,
      notifyRenewalApproaching: s.notifyRenewalApproaching,
      trialDaysBefore: s.trialDaysBefore,
      renewalDaysBefore: s.renewalDaysBefore,
    })
  } catch (e) {
    console.error('PATCH financial-notifications:', e)
    return NextResponse.json({ message: 'Failed to save settings' }, { status: 500 })
  }
}
