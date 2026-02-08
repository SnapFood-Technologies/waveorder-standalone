// src/app/api/superadmin/api-keys/route.ts
/**
 * SuperAdmin API: Manage all API keys across businesses
 * GET - List all API keys with filtering and pagination
 */
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// ===========================================
// GET - List All API Keys
// ===========================================
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || session.user.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search') || ''
    const status = searchParams.get('status') || 'all' // all, active, revoked
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const offset = (page - 1) * limit

    // Build where clause
    const where: any = {}

    if (status === 'active') {
      where.isActive = true
    } else if (status === 'revoked') {
      where.isActive = false
    }

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { keyPreview: { contains: search, mode: 'insensitive' } },
        { business: { name: { contains: search, mode: 'insensitive' } } }
      ]
    }

    // Fetch API keys
    const [apiKeys, totalCount] = await Promise.all([
      prisma.apiKey.findMany({
        where,
        select: {
          id: true,
          name: true,
          keyPreview: true,
          scopes: true,
          lastUsedAt: true,
          requestCount: true,
          expiresAt: true,
          isActive: true,
          createdAt: true,
          business: {
            select: {
              id: true,
              name: true,
              slug: true,
              subscriptionPlan: true
            }
          }
        },
        skip: offset,
        take: limit,
        orderBy: { createdAt: 'desc' }
      }),
      prisma.apiKey.count({ where })
    ])

    // Get status counts
    const [activeCount, revokedCount] = await Promise.all([
      prisma.apiKey.count({ where: { isActive: true } }),
      prisma.apiKey.count({ where: { isActive: false } })
    ])

    // Get aggregate statistics
    const stats = await prisma.apiKey.aggregate({
      _sum: { requestCount: true },
      _count: { id: true }
    })

    return NextResponse.json({
      apiKeys,
      pagination: {
        page,
        limit,
        total: totalCount,
        pages: Math.ceil(totalCount / limit)
      },
      counts: {
        all: activeCount + revokedCount,
        active: activeCount,
        revoked: revokedCount
      },
      stats: {
        totalKeys: stats._count.id,
        totalRequests: stats._sum.requestCount || 0
      }
    })

  } catch (error) {
    console.error('Error fetching API keys:', error)
    return NextResponse.json(
      { error: 'Failed to fetch API keys' },
      { status: 500 }
    )
  }
}
