/**
 * Cron / external trigger for external product sync (same logic as SuperAdmin POST).
 * Sync history is unchanged — use SuperAdmin External Syncs UI to inspect runs.
 *
 * Method: POST only (no GET).
 *
 * Auth (same pattern as other cron/integration triggers):
 * - Authorization: Bearer wo_int_… (integration API key), or
 * - Authorization: Bearer {CRON_SECRET}, or
 * - ?secret={CRON_SECRET} on the URL
 *
 * Query params (optional, same as SuperAdmin):
 * - per_page, current_page, sync_all_pages=true|false
 *
 * Example:
 *   POST https://your-domain/api/cron/external-sync/BUSINESS_ID/SYNC_ID?sync_all_pages=false&current_page=1&per_page=100
 *   Header: Authorization: Bearer <CRON_SECRET>
 */
import { NextRequest, NextResponse } from 'next/server'
import { authorizeFinancialRemindersRequest } from '@/lib/financial-superadmin-reminders-auth'
import { runExternalSyncOperation } from '@/lib/external-sync-operation'

export const maxDuration = 300

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ businessId: string; syncId: string }> }
) {
  const auth = await authorizeFinancialRemindersRequest(request)
  if (auth instanceof NextResponse) return auth
  try {
    const { businessId, syncId } = await params
    return await runExternalSyncOperation(request, businessId, syncId)
  } catch (e: any) {
    console.error('cron external-sync:', e)
    return NextResponse.json({ message: 'Sync failed', error: e?.message }, { status: 500 })
  }
}
