// src/app/api/integrations/[slug]/available/route.ts
/**
 * External API endpoint for integrations to list businesses NOT yet connected.
 * Returns active WaveOrder businesses that don't have this integration's slug
 * in their externalIds JSON.
 *
 * Authentication: Integration API key (wo_int_xxx)
 * Query: ?page=1&limit=50&search=xxx&businessType=restaurant
 */
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import {
  authenticateIntegrationRequest,
  logIntegrationCall,
} from '@/lib/integration-auth'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const startTime = Date.now()
  const { slug } = await params
  const endpoint = `/api/integrations/${slug}/available`
  let integrationId = ''

  try {
    // Authenticate the integration
    const authResult = await authenticateIntegrationRequest(request)
    if (authResult instanceof NextResponse) return authResult
    const { integration } = authResult
    integrationId = integration.integrationId

    // Verify slug matches
    if (integration.integrationSlug !== slug) {
      return NextResponse.json(
        { error: 'API key does not belong to this integration' },
        { status: 403 }
      )
    }

    // Parse query params
    const { searchParams } = new URL(request.url)
    const page = Math.max(1, parseInt(searchParams.get('page') || '1'))
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '50')))
    const search = searchParams.get('search') || ''
    const businessType = searchParams.get('businessType') || ''

    // Fetch all active, non-test businesses
    const allBusinesses = await prisma.business.findMany({
      where: {
        isActive: true,
        testMode: false,
        onboardingCompleted: true,
      },
      select: {
        id: true,
        name: true,
        slug: true,
        businessType: true,
        isActive: true,
        externalIds: true,
        currency: true,
        country: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
    })

    // Filter out businesses that already have this integration's slug in externalIds
    let availableBusinesses = allBusinesses.filter((biz) => {
      if (!biz.externalIds || typeof biz.externalIds !== 'object') return true
      const ids = biz.externalIds as Record<string, string>
      return ids[slug] === undefined
    })

    // Apply search filter if provided
    if (search) {
      const searchLower = search.toLowerCase()
      availableBusinesses = availableBusinesses.filter(
        (biz) =>
          biz.name.toLowerCase().includes(searchLower) ||
          biz.slug.toLowerCase().includes(searchLower)
      )
    }

    // Apply business type filter if provided
    if (businessType) {
      const typeLower = businessType.toLowerCase()
      availableBusinesses = availableBusinesses.filter(
        (biz) => biz.businessType.toLowerCase() === typeLower
      )
    }

    // Map to clean response (exclude externalIds from output)
    const mapped = availableBusinesses.map((biz) => ({
      businessId: biz.id,
      businessName: biz.name,
      businessSlug: biz.slug,
      businessType: biz.businessType,
      currency: biz.currency,
      country: biz.country,
      createdAt: biz.createdAt,
    }))

    // Manual pagination
    const total = mapped.length
    const paginated = mapped.slice((page - 1) * limit, page * limit)

    const responseBody = {
      businesses: paginated,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
      integrationSlug: slug,
    }

    await logIntegrationCall({
      integrationId,
      endpoint,
      method: 'GET',
      statusCode: 200,
      responseBody: { total, page, limit },
      ipAddress: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip'),
      duration: Date.now() - startTime,
    })

    return NextResponse.json(responseBody)
  } catch (error) {
    console.error('Integration available businesses error:', error)
    const errorMsg = error instanceof Error ? error.message : 'Internal server error'
    await logIntegrationCall({
      integrationId,
      endpoint,
      method: 'GET',
      statusCode: 500,
      error: errorMsg,
      ipAddress: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip'),
      duration: Date.now() - startTime,
    }).catch(() => {})
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
