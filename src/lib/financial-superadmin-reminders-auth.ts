/**
 * Auth for financial reminder triggers: prefer integration API key (wo_int_…, same as low-stock),
 * optional legacy CRON_SECRET for existing schedulers.
 */
import { NextRequest, NextResponse } from 'next/server'
import {
  authenticateIntegrationRequest,
  type IntegrationAuthData,
} from '@/lib/integration-auth'

export type FinancialRemindersAuthOk =
  | { kind: 'integration'; integration: IntegrationAuthData }
  | { kind: 'legacy_cron' }

/**
 * Returns 401 NextResponse on failure, or auth context on success.
 */
export async function authorizeFinancialRemindersRequest(
  request: NextRequest
): Promise<NextResponse | FinancialRemindersAuthOk> {
  const authHeader = request.headers.get('authorization')
  const bearer = authHeader?.startsWith('Bearer ') ? authHeader.slice(7).trim() : ''

  if (bearer.startsWith('wo_int_')) {
    const authResult = await authenticateIntegrationRequest(request)
    if (authResult instanceof NextResponse) return authResult
    return { kind: 'integration', integration: authResult.integration }
  }

  const secret = process.env.CRON_SECRET
  if (secret && authHeader === `Bearer ${secret}`) {
    return { kind: 'legacy_cron' }
  }
  const q = request.nextUrl.searchParams.get('secret')
  if (secret && q === secret) {
    return { kind: 'legacy_cron' }
  }

  return NextResponse.json(
    {
      message:
        'Unauthorized. Use Authorization: Bearer wo_int_… (same integration key as low-stock), or configure CRON_SECRET for legacy callers.',
    },
    { status: 401 }
  )
}
