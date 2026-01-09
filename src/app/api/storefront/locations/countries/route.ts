import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// GET - Get all countries (public endpoint for storefront)
export async function GET(request: NextRequest) {
  try {
    const countries = await prisma.country.findMany({
      select: {
        id: true,
        name: true,
        code: true
      },
      orderBy: { name: 'asc' }
    })

    return NextResponse.json({ data: countries })
  } catch (error) {
    console.error('Error fetching countries:', error)
    return NextResponse.json(
      { message: 'Failed to fetch countries' },
      { status: 500 }
    )
  }
}
