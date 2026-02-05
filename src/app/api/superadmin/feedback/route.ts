// app/api/superadmin/feedback/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

// GET - Fetch all feedback across all businesses
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || session.user.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type') // Filter by feedback type
    const source = searchParams.get('source') // Filter by source
    const rating = searchParams.get('rating') // Filter by rating
    const search = searchParams.get('search') // Search by business name
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const sortBy = searchParams.get('sortBy') || 'createdAt'
    const sortOrder = searchParams.get('sortOrder') || 'desc'

    // Build where clause
    const where: any = {}
    
    if (type) {
      where.type = type
    }
    
    if (source) {
      where.source = source
    }
    
    if (rating) {
      where.rating = parseInt(rating)
    }

    if (search) {
      where.business = {
        name: {
          contains: search,
          mode: 'insensitive'
        }
      }
    }

    // Get total count
    const total = await prisma.businessFeedback.count({ where })

    // Get feedbacks with pagination
    const feedbacks = await prisma.businessFeedback.findMany({
      where,
      include: {
        business: {
          select: {
            id: true,
            name: true,
            slug: true,
            logo: true,
            businessType: true,
            subscriptionPlan: true
          }
        }
      },
      orderBy: {
        [sortBy]: sortOrder
      },
      skip: (page - 1) * limit,
      take: limit
    })

    // Get statistics
    const stats = await prisma.businessFeedback.groupBy({
      by: ['rating'],
      _count: {
        rating: true
      }
    })

    const ratingDistribution = stats.reduce((acc, item) => {
      acc[item.rating] = item._count.rating
      return acc
    }, {} as Record<number, number>)

    // Calculate average rating
    const allRatings = await prisma.businessFeedback.aggregate({
      _avg: {
        rating: true
      },
      _count: {
        id: true
      }
    })

    // Get source distribution
    const sourceStats = await prisma.businessFeedback.groupBy({
      by: ['source'],
      _count: {
        source: true
      }
    })

    const sourceDistribution = sourceStats.reduce((acc, item) => {
      acc[item.source] = item._count.source
      return acc
    }, {} as Record<string, number>)

    // Get type distribution
    const typeStats = await prisma.businessFeedback.groupBy({
      by: ['type'],
      _count: {
        type: true
      }
    })

    const typeDistribution = typeStats.reduce((acc, item) => {
      acc[item.type] = item._count.type
      return acc
    }, {} as Record<string, number>)

    return NextResponse.json({
      feedbacks,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      },
      stats: {
        totalFeedbacks: allRatings._count.id,
        averageRating: allRatings._avg.rating ? parseFloat(allRatings._avg.rating.toFixed(2)) : 0,
        ratingDistribution,
        sourceDistribution,
        typeDistribution
      }
    })

  } catch (error) {
    console.error('Error fetching feedback:', error)
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    )
  }
}
