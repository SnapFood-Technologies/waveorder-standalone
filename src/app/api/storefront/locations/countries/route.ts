import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// GET - Get countries where business has postal pricing configured
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const slug = searchParams.get('slug')

    if (!slug) {
      return NextResponse.json({ data: [] })
    }

    // Get business by slug
    const business = await prisma.business.findUnique({
      where: { slug },
      select: { id: true }
    })

    if (!business) {
      return NextResponse.json({ data: [] })
    }

    // Get all distinct city names from PostalPricing for this business
    const postalPricings = await prisma.postalPricing.findMany({
      where: {
        businessId: business.id,
        deletedAt: null
      },
      select: { cityName: true },
      distinct: ['cityName']
    })

    if (postalPricings.length === 0) {
      return NextResponse.json({ data: [] })
    }

    const cityNames = postalPricings.map(p => p.cityName)

    // Find cities in the City table matching these names
    const cities = await prisma.city.findMany({
      where: { name: { in: cityNames } },
      select: { stateId: true },
      distinct: ['stateId']
    })

    if (cities.length === 0) {
      return NextResponse.json({ data: [] })
    }

    // Get states to find country IDs
    const states = await prisma.state.findMany({
      where: { id: { in: cities.map(c => c.stateId) } },
      select: { countryId: true },
      distinct: ['countryId']
    })

    if (states.length === 0) {
      return NextResponse.json({ data: [] })
    }

    // Get countries
    const countries = await prisma.country.findMany({
      where: { id: { in: states.map(s => s.countryId) } },
      select: { id: true, name: true, code: true },
      orderBy: { name: 'asc' }
    })
    
    return NextResponse.json({ data: countries })
  } catch (error: any) {
    console.error('[Countries API] Error:', error?.message)
    return NextResponse.json({ message: 'Failed to fetch countries' }, { status: 500 })
  }
}
