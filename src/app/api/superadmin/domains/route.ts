// app/api/superadmin/domains/route.ts
/**
 * SuperAdmin API: List all custom domains with filtering and search
 * Returns domains with their associated business details and status
 */
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
    const search = searchParams.get('search') || ''
    const status = searchParams.get('status') || 'all' // all | PENDING | ACTIVE | FAILED
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const offset = (page - 1) * limit

    // Build where conditions - only businesses with custom domains set
    const whereConditions: any = {
      customDomain: { not: null },
      domainStatus: { not: 'NONE' }
    }

    // Status filter
    if (status !== 'all') {
      whereConditions.domainStatus = status as any
    }

    // Search by domain name or business name
    if (search) {
      whereConditions.OR = [
        { customDomain: { contains: search, mode: 'insensitive' } },
        { name: { contains: search, mode: 'insensitive' } },
        { slug: { contains: search, mode: 'insensitive' } }
      ]
    }

    // Fetch domains with associated business info
    const [businesses, totalCount] = await Promise.all([
      prisma.business.findMany({
        where: whereConditions,
        select: {
          id: true,
          name: true,
          slug: true,
          customDomain: true,
          domainStatus: true,
          domainVerificationToken: true,
          domainVerificationExpiry: true,
          domainProvisionedAt: true,
          domainLastChecked: true,
          domainError: true,
          subscriptionPlan: true,
          subscriptionStatus: true,
          isActive: true,
          createdAt: true,
          users: {
            where: { role: 'OWNER' },
            include: {
              user: {
                select: {
                  id: true,
                  name: true,
                  email: true
                }
              }
            },
            take: 1
          }
        },
        orderBy: [
          // Order by status: PENDING first (needs attention), then FAILED, then ACTIVE
          { domainProvisionedAt: 'desc' }
        ],
        skip: offset,
        take: limit
      }),
      prisma.business.count({ where: whereConditions })
    ])

    // Get status counts for filter badges
    const statusCounts = await prisma.business.groupBy({
      by: ['domainStatus'],
      where: {
        customDomain: { not: null },
        domainStatus: { not: 'NONE' }
      },
      _count: true
    })

    // Format response
    const domains = businesses.map(business => {
      const owner = business.users[0]?.user || null
      
      // Calculate if verification is expired
      const isVerificationExpired = business.domainVerificationExpiry 
        ? new Date(business.domainVerificationExpiry) < new Date()
        : false

      return {
        domain: business.customDomain,
        status: business.domainStatus,
        verificationToken: business.domainVerificationToken,
        verificationExpiry: business.domainVerificationExpiry,
        isVerificationExpired,
        provisionedAt: business.domainProvisionedAt,
        lastChecked: business.domainLastChecked,
        error: business.domainError,
        business: {
          id: business.id,
          name: business.name,
          slug: business.slug,
          plan: business.subscriptionPlan,
          subscriptionStatus: business.subscriptionStatus,
          isActive: business.isActive,
          createdAt: business.createdAt
        },
        owner: owner ? {
          id: owner.id,
          name: owner.name,
          email: owner.email
        } : null
      }
    })

    // Format status counts
    const counts: Record<string, number> = {
      all: 0,
      PENDING: 0,
      ACTIVE: 0,
      FAILED: 0
    }
    
    statusCounts.forEach(item => {
      counts[item.domainStatus] = item._count
      counts.all += item._count
    })

    return NextResponse.json({
      domains,
      pagination: {
        page,
        limit,
        total: totalCount,
        pages: Math.ceil(totalCount / limit)
      },
      counts
    })

  } catch (error) {
    console.error('Error fetching domains:', error)
    return NextResponse.json(
      { message: 'Failed to fetch domains' },
      { status: 500 }
    )
  }
}
