// src/app/api/v1/me/route.ts
/**
 * Public API v1: Get authenticated business info
 * GET - Returns business info and API key details
 */
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { authenticateApiRequest, addRateLimitHeaders } from '@/lib/api-auth'

// ===========================================
// GET - Get Business Info
// ===========================================
export async function GET(request: NextRequest) {
  // Authenticate request (no specific scope required)
  const authResult = await authenticateApiRequest(request)
  if (authResult instanceof NextResponse) {
    return authResult
  }
  const { auth } = authResult

  try {
    // Fetch business info
    const business = await prisma.business.findUnique({
      where: { id: auth.businessId },
      select: {
        id: true,
        name: true,
        slug: true,
        businessType: true,
        currency: true,
        timezone: true,
        subscriptionPlan: true,
        _count: {
          select: {
            products: true,
            categories: true,
            orders: true
          }
        }
      }
    })

    if (!business) {
      return NextResponse.json({ error: 'Business not found' }, { status: 404 })
    }

    const response = NextResponse.json({
      business: {
        id: business.id,
        name: business.name,
        slug: business.slug,
        businessType: business.businessType,
        currency: business.currency,
        timezone: business.timezone,
        plan: business.subscriptionPlan
      },
      stats: {
        products: business._count.products,
        categories: business._count.categories,
        orders: business._count.orders
      },
      apiKey: {
        id: auth.id,
        name: auth.name,
        scopes: auth.scopes
      }
    })

    return addRateLimitHeaders(response, auth.id)

  } catch (error) {
    console.error('API v1 Me GET error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch business info' },
      { status: 500 }
    )
  }
}
