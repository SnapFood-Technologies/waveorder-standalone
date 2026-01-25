// src/app/api/superadmin/businesses/[businessId]/external-syncs/logs/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ businessId: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || session.user.role !== 'SUPER_ADMIN') {
      return NextResponse.json(
        { message: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { businessId } = await params
    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '50')
    const syncId = searchParams.get('syncId') // Optional: filter by specific sync

    // Build where clause
    const where: any = {
      businessId
    }
    
    if (syncId) {
      where.syncId = syncId
    }

    // Fetch sync logs
    const logs = await (prisma as any).externalSyncLog.findMany({
      where,
      include: {
        sync: {
          select: {
            id: true,
            name: true,
            externalSystemName: true
          }
        }
      },
      orderBy: {
        startedAt: 'desc'
      },
      take: limit
    })

    return NextResponse.json({ logs })

  } catch (error: any) {
    console.error('Error fetching sync logs:', error)
    return NextResponse.json(
      { message: 'Internal server error', error: error.message },
      { status: 500 }
    )
  }
}
