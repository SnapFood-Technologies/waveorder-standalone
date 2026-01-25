// src/app/api/superadmin/businesses/[businessId]/external-syncs/logs/[logId]/status/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ businessId: string; logId: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || session.user.role !== 'SUPER_ADMIN') {
      return NextResponse.json(
        { message: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { businessId, logId } = await params
    const body = await request.json()
    const { status } = body

    if (!status || !['failed', 'success'].includes(status)) {
      return NextResponse.json(
        { message: 'Invalid status. Must be "failed" or "success"' },
        { status: 400 }
      )
    }

    // Get the log to verify it exists and belongs to this business
    const log = await (prisma as any).externalSyncLog.findFirst({
      where: {
        id: logId,
        businessId
      }
    })

    if (!log) {
      return NextResponse.json(
        { message: 'Log not found' },
        { status: 404 }
      )
    }

    // Only allow updating "running" logs
    if (log.status !== 'running') {
      return NextResponse.json(
        { message: 'Can only update logs with "running" status' },
        { status: 400 }
      )
    }

    // Calculate duration if not already set
    const now = new Date()
    const startedAt = new Date(log.startedAt)
    const duration = log.duration || (now.getTime() - startedAt.getTime())

    // Update the log
    const updatedLog = await (prisma as any).externalSyncLog.update({
      where: { id: logId },
      data: {
        status: status === 'success' ? 'success' : 'failed',
        completedAt: now,
        duration,
        error: status === 'failed' ? (log.error || 'Manually marked as failed') : null
      }
    })

    // If marking as failed, also clear the sync's running flag
    if (status === 'failed') {
      await (prisma as any).externalSync.update({
        where: { id: log.syncId },
        data: {
          isRunning: false,
          syncStartedAt: null,
          lastSyncStatus: 'failed',
          lastSyncError: 'Manually marked as failed',
          lastSyncAt: now
        }
      })
    }

    return NextResponse.json({ log: updatedLog })

  } catch (error: any) {
    console.error('Error updating log status:', error)
    return NextResponse.json(
      { message: 'Internal server error', error: error.message },
      { status: 500 }
    )
  }
}
