// src/app/api/admin/stores/[businessId]/team/audit/route.ts
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
    if (!session?.user?.id) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
    }

    const { businessId } = await params

    // Verify user has access to this business
    const businessUser = await prisma.businessUser.findFirst({
      where: {
        userId: session.user.id,
        businessId
      }
    })

    if (!businessUser) {
      return NextResponse.json({ message: 'Access denied' }, { status: 403 })
    }

    // Only OWNER and MANAGER can view audit logs
    if (businessUser.role !== 'OWNER' && businessUser.role !== 'MANAGER') {
      return NextResponse.json({ message: 'Insufficient permissions' }, { status: 403 })
    }

    // Get query params
    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = parseInt(searchParams.get('offset') || '0')

    // Fetch audit logs
    const logs = await (prisma as any).teamAuditLog.findMany({
      where: { businessId },
      orderBy: { createdAt: 'desc' },
      take: limit,
      skip: offset
    })

    // Get total count
    const total = await (prisma as any).teamAuditLog.count({
      where: { businessId }
    })

    // Parse details JSON
    const formattedLogs = logs.map((log: any) => ({
      ...log,
      details: log.details ? JSON.parse(log.details) : null
    }))

    return NextResponse.json({
      logs: formattedLogs,
      total,
      limit,
      offset
    })
  } catch (error) {
    console.error('Error fetching audit logs:', error)
    return NextResponse.json(
      { message: 'Failed to fetch audit logs' },
      { status: 500 }
    )
  }
}
