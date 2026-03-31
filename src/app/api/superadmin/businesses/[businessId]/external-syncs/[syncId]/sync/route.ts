import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { runExternalSyncOperation } from '@/lib/external-sync-operation'

// Increase timeout for long-running sync operations (5 minutes)
export const maxDuration = 300

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ businessId: string; syncId: string }> }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || session.user.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
    }

    const { businessId, syncId } = await params
    return await runExternalSyncOperation(request, businessId, syncId)
  } catch (error: any) {
    console.error('External sync route:', error)
    return NextResponse.json(
      { message: 'Internal server error', error: error?.message },
      { status: 500 }
    )
  }
}
