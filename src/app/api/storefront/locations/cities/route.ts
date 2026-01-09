import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// GET - Get cities by country (public endpoint for storefront)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const countryCode = searchParams.get('countryCode')
    const search = searchParams.get('search') || ''

    if (!countryCode) {
      return NextResponse.json(
        { message: 'Country code is required' },
        { status: 400 }
      )
    }

    // Build where conditions
    const whereConditions: any = {
      state: {
        country: {
          code: countryCode
        }
      }
    }

    if (search) {
      whereConditions.name = { contains: search, mode: 'insensitive' }
    }

    // Get cities
    const cities = await prisma.city.findMany({
      where: whereConditions,
      select: {
        id: true,
        name: true,
        state: {
          select: {
            name: true,
            country: {
              select: {
                name: true,
                code: true
              }
            }
          }
        }
      },
      orderBy: { name: 'asc' },
      take: 1000 // Limit to prevent huge responses
    })

    return NextResponse.json({ data: cities })
  } catch (error) {
    console.error('Error fetching cities:', error)
    return NextResponse.json(
      { message: 'Failed to fetch cities' },
      { status: 500 }
    )
  }
}
