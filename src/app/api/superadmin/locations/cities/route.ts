import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'


export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || session.user.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search') || ''
    const countryId = searchParams.get('countryId') || ''
    const stateId = searchParams.get('stateId') || ''
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = (page - 1) * limit

    // Build where conditions
    const whereConditions: any = {}

    if (stateId) {
      whereConditions.stateId = stateId
    } else if (countryId) {
      // If countryId is provided but not stateId, filter by country through state
      whereConditions.state = {
        countryId: countryId
      }
    }

    if (search) {
      whereConditions.name = { contains: search, mode: 'insensitive' }
    }

    // Get cities with pagination
    const [cities, totalCount] = await Promise.all([
      prisma.city.findMany({
        where: whereConditions,
        include: {
          state: {
            include: {
              country: {
                select: {
                  id: true,
                  name: true,
                  code: true
                }
              }
            }
          }
        },
        orderBy: { name: 'asc' },
        skip: offset,
        take: limit
      }),
      prisma.city.count({ where: whereConditions })
    ])

    return NextResponse.json({
      data: cities,
      pagination: {
        page,
        limit,
        total: totalCount,
        pages: Math.ceil(totalCount / limit)
      }
    })
  } catch (error) {
    console.error('Error fetching cities:', error)
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    )
  }
}
