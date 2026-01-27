import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ businessId: string }> }
) {
  const session = await getServerSession(authOptions)
  
  if (!session || session.user.role !== 'SUPER_ADMIN') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { businessId } = await params

  try {
    // Get all sync configurations for this business
    const syncConfigs = await prisma.externalSync.findMany({
      where: { businessId },
      select: {
        id: true,
        name: true,
        externalSystemName: true,
        isActive: true,
        lastSyncAt: true,
        lastSyncStatus: true,
        lastSyncError: true,
        createdAt: true,
        updatedAt: true
      },
      orderBy: { updatedAt: 'desc' }
    })

    // Get recent sync logs for each config
    const syncsWithLogs = await Promise.all(
      syncConfigs.map(async (sync) => {
        const logs = await prisma.externalSyncLog.findMany({
          where: { syncId: sync.id },
          select: {
            id: true,
            status: true,
            processedCount: true,
            errorCount: true,
            startedAt: true,
            completedAt: true,
            error: true
          },
          orderBy: { startedAt: 'desc' },
          take: 5
        })

        return {
          ...sync,
          recentLogs: logs.map(log => ({
            ...log,
            errorMessage: log.error
          }))
        }
      })
    )

    // Get count of products that came from external sync (have metadata)
    const externalProductsCount = await prisma.product.count({
      where: {
        businessId,
        metadata: { not: null }
      }
    })

    return NextResponse.json({
      syncs: syncsWithLogs,
      stats: {
        totalSyncConfigs: syncConfigs.length,
        activeSyncConfigs: syncConfigs.filter(s => s.isActive).length,
        externalProducts: externalProductsCount
      }
    })
  } catch (error) {
    console.error('Error in sync debug:', error)
    return NextResponse.json({ error: 'Failed to analyze sync status' }, { status: 500 })
  }
}
