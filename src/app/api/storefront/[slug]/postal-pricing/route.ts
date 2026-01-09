// src/app/api/storefront/[slug]/postal-pricing/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// GET - Get postal pricing for a city (public endpoint)
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params

    // Validate slug
    if (!slug || slug.length < 1 || slug.length > 100) {
      return NextResponse.json(
        { message: 'Invalid store slug' },
        { status: 400 }
      )
    }

    // Get business by slug
    const business = await prisma.business.findUnique({
      where: { slug },
      select: {
        id: true,
        businessType: true,
        currency: true
      }
    })

    if (!business) {
      return NextResponse.json(
        { message: 'Store not found' },
        { status: 404 }
      )
    }

    // Only allow for RETAIL businesses
    if (business.businessType !== 'RETAIL') {
      return NextResponse.json(
        { message: 'Postal pricing is only available for retail businesses' },
        { status: 400 }
      )
    }

    const { searchParams } = new URL(request.url)
    const cityName = searchParams.get('cityName')

    if (!cityName || !cityName.trim()) {
      return NextResponse.json(
        { message: 'City name is required' },
        { status: 400 }
      )
    }

    const trimmedCityName = cityName.trim()
    console.log(`🔍 Looking for postal pricing - Business: ${business.id}, City: "${trimmedCityName}"`)

    // Debug: Check what city names exist in the database for this business
    const sampleRecords = await prisma.postalPricing.findMany({
      where: { businessId: business.id },
      select: { cityName: true },
      take: 5,
      distinct: ['cityName']
    })
    console.log(`📋 Sample city names in database:`, sampleRecords.map(r => r.cityName))

    // Get postal pricing for this city
    // Fetch all records and filter in memory to handle MongoDB null/undefined issues
    const allPricing = await prisma.postalPricing.findMany({
      where: {
        businessId: business.id,
        cityName: trimmedCityName
      },
      include: {
        postal: {
          select: {
            id: true,
            name: true,
            nameAl: true,
            type: true,
            description: true,
            descriptionAl: true,
            deliveryTime: true,
            deliveryTimeAl: true,
            logo: true,
            isActive: true
          }
        }
      },
      orderBy: [
        { price: 'asc' }
      ]
    })

    console.log(`Postal pricing query for city "${cityName.trim()}" - Found ${allPricing.length} total records`)

    // Filter out deleted records (deletedAt is null or undefined) and inactive postals
    // A record is considered deleted only if deletedAt is explicitly set to a Date
    const activePricing = allPricing.filter(p => {
      // Not deleted (deletedAt is null, undefined, or falsy)
      const notDeleted = !p.deletedAt || p.deletedAt === null
      // Postal service is active
      const postalActive = p.postal.isActive
      return notDeleted && postalActive
    })

    console.log(`Active postal pricing records: ${activePricing.length} (out of ${allPricing.length} total)`)

    // Format response
    const data = activePricing.map(p => {
      const postal = p.postal
      const storefrontLanguage = 'sq' // Default to Albanian, can be made dynamic later
      
      return {
        id: p.id,
        price: p.price,
        priceWithoutTax: p.priceWithoutTax,
        type: p.type,
        postal_name: storefrontLanguage === 'sq' && postal.nameAl ? postal.nameAl : postal.name,
        postal_name_en: postal.name,
        postal_name_al: postal.nameAl,
        logo: postal.logo,
        delivery_time: p.deliveryTime || postal.deliveryTime || undefined,
        delivery_time_al: p.deliveryTimeAl || postal.deliveryTimeAl || undefined,
        description: storefrontLanguage === 'sq' && postal.descriptionAl ? postal.descriptionAl : postal.description || undefined,
        min_order_value: p.minOrderValue !== undefined && p.minOrderValue !== null ? p.minOrderValue : undefined,
        max_order_value: p.maxOrderValue !== undefined && p.maxOrderValue !== null ? p.maxOrderValue : undefined
      }
    })

    return NextResponse.json({ data })
  } catch (error) {
    console.error('Error fetching postal pricing:', error)
    return NextResponse.json(
      { message: 'Failed to fetch postal pricing' },
      { status: 500 }
    )
  }
}
