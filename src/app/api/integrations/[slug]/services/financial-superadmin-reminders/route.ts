// src/app/api/integrations/[slug]/services/financial-superadmin-reminders/route.ts
/**
 * External trigger for SuperAdmin financial trial/renewal reminder emails (same auth as low-stock).
 * Nest / Omnistack: POST with Authorization: Bearer wo_int_xxx — same pattern as low-stock-alerts.
 */
import { NextRequest, NextResponse } from 'next/server'
import {
  authenticateIntegrationRequest,
  logIntegrationCall,
} from '@/lib/integration-auth'
import {
  runFinancialTrialRemindersCron,
  runFinancialRenewalRemindersCron,
} from '@/lib/financial-superadmin-notifications'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const startTime = Date.now()
  const { slug } = await params
  const endpoint = `/api/integrations/${slug}/services/financial-superadmin-reminders`
  let integrationId = ''

  try {
    const authResult = await authenticateIntegrationRequest(request)
    if (authResult instanceof NextResponse) return authResult
    const { integration } = authResult
    integrationId = integration.integrationId

    if (integration.integrationSlug !== slug) {
      return NextResponse.json(
        { error: 'API key does not belong to this integration' },
        { status: 403 }
      )
    }

    const trial = await runFinancialTrialRemindersCron()
    const renewal = await runFinancialRenewalRemindersCron()

    const responseBody = {
      success: true,
      message: 'Financial superadmin reminders complete',
      trialRemindersSent: trial.sent,
      renewalRemindersSent: renewal.sent,
    }

    await logIntegrationCall({
      integrationId,
      endpoint,
      method: 'POST',
      statusCode: 200,
      responseBody,
      ipAddress: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip'),
      duration: Date.now() - startTime,
    })

    return NextResponse.json(responseBody)
  } catch (error) {
    console.error('Financial superadmin reminders service error:', error)
    const errorMsg = error instanceof Error ? error.message : 'Internal server error'

    await logIntegrationCall({
      integrationId,
      endpoint,
      method: 'POST',
      statusCode: 500,
      error: errorMsg,
      ipAddress: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip'),
      duration: Date.now() - startTime,
    }).catch(() => {})

    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}
