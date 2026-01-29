import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// GET - Get countries for storefront (filtered by business shipping settings)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const slug = searchParams.get('slug')

    // If no slug provided, return empty (admin panel uses this without slug)
    if (!slug) {
      const countries = await prisma.country.findMany({
        select: { id: true, name: true, code: true },
        orderBy: { name: 'asc' }
      })
      return NextResponse.json({ data: countries })
    }

    // Get business by slug with shippingCountries and country
    const business = await prisma.business.findUnique({
      where: { slug },
      select: { 
        id: true,
        country: true,
        shippingCountries: true
      }
    })

    if (!business) {
      return NextResponse.json({ data: [] })
    }

    // If business has shippingCountries configured, use those
    if (business.shippingCountries && business.shippingCountries.length > 0) {
      const countries = await prisma.country.findMany({
        where: {
          code: { in: business.shippingCountries }
        },
        select: { id: true, name: true, code: true },
        orderBy: { name: 'asc' }
      })
      return NextResponse.json({ data: countries })
    }

    // If no shippingCountries configured, default to business's own country only
    if (business.country) {
      const countries = await prisma.country.findMany({
        where: {
          code: business.country
        },
        select: { id: true, name: true, code: true },
        orderBy: { name: 'asc' }
      })
      return NextResponse.json({ data: countries })
    }

    // Fallback: no country configured, return empty
    return NextResponse.json({ data: [] })
  } catch (error: any) {
    console.error('[Countries API] Error:', error?.message)
    return NextResponse.json({ message: 'Failed to fetch countries' }, { status: 500 })
  }
}
