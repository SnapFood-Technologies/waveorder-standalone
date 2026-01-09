import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { PrismaClient } from '@prisma/client'
import { authOptions } from '@/lib/auth'

const prisma = new PrismaClient()

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || session.user.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search') || ''
    const countryId = searchParams.get('countryId') || ''
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = (page - 1) * limit

    // Build where conditions
    const whereConditions: any = {}

    if (countryId) {
      whereConditions.countryId = countryId
    }

    if (search) {
      whereConditions.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { code: { contains: search, mode: 'insensitive' } }
      ]
    }

    // Get states with pagination
    const [states, totalCount] = await Promise.all([
      prisma.state.findMany({
        where: whereConditions,
        include: {
          country: {
            select: {
              id: true,
              name: true,
              code: true
            }
          },
          _count: {
            select: { cities: true }
          }
        },
        orderBy: { name: 'asc' },
        skip: offset,
        take: limit
      }),
      prisma.state.count({ where: whereConditions })
    ])

    return NextResponse.json({
      data: states,
      pagination: {
        page,
        limit,
        total: totalCount,
        pages: Math.ceil(totalCount / limit)
      }
    })
  } catch (error) {
    console.error('Error fetching states:', error)
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    )
  }
}
