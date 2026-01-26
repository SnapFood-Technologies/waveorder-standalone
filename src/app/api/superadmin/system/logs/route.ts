// app/api/superadmin/system/logs/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || session.user.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '50')
    const skip = (page - 1) * limit
    
    // Filters
    const logType = searchParams.get('logType')
    const severity = searchParams.get('severity')
    const slug = searchParams.get('slug')
    const businessId = searchParams.get('businessId')
    const statusCode = searchParams.get('statusCode') ? parseInt(searchParams.get('statusCode')!) : null
    
    // Date range
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')

    // Build where clause
    const where: any = {}
    
    if (logType) {
      where.logType = logType
    }
    
    if (severity) {
      where.severity = severity
    }
    
    if (slug) {
      where.slug = slug
    }
    
    if (businessId) {
      where.businessId = businessId
    }
    
    if (statusCode !== null) {
      where.statusCode = statusCode
    }
    
    if (startDate || endDate) {
      where.createdAt = {}
      if (startDate) {
        where.createdAt.gte = new Date(startDate)
      }
      if (endDate) {
        where.createdAt.lte = new Date(endDate)
      }
    }

    // Fetch logs with pagination
    const [logs, total] = await Promise.all([
      prisma.systemLog.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
        include: {
          business: {
            select: {
              id: true,
              name: true,
              slug: true
            }
          }
        }
      }),
      prisma.systemLog.count({ where })
    ])

    // Get summary statistics
    const [totalLogs, errorLogs, warningLogs, infoLogs, storefront404s] = await Promise.all([
      prisma.systemLog.count({}),
      prisma.systemLog.count({ where: { severity: 'error' } }),
      prisma.systemLog.count({ where: { severity: 'warning' } }),
      prisma.systemLog.count({ where: { severity: 'info' } }),
      prisma.systemLog.count({ where: { logType: 'storefront_404' } })
    ])

    return NextResponse.json({
      logs: logs.map(log => ({
        ...log,
        createdAt: log.createdAt.toISOString()
      })),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      },
      stats: {
        total: totalLogs,
        errors: errorLogs,
        warnings: warningLogs,
        info: infoLogs,
        storefront404s
      }
    })
  } catch (error) {
    console.error('Error fetching system logs:', error)
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    )
  }
}
