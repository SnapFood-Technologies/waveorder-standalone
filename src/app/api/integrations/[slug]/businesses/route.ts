// src/app/api/integrations/[slug]/businesses/route.ts
/**
 * External API endpoint for integrations to list all connected businesses.
 *
 * Authentication: Integration API key (wo_int_xxx)
 * Query: ?page=1&limit=50
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
  const endpoint = `/api/integrations/${slug}/businesses`
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

    // Parse pagination params
    const { searchParams } = new URL(request.url)
    const page = Math.max(1, parseInt(searchParams.get('page') || '1'))
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '50')))

    // Fetch all businesses that have externalIds containing this integration's slug
    // MongoDB JSON queries: filter businesses where externalIds has the slug key
    const allBusinesses = await prisma.business.findMany({
      where: {
        externalIds: { not: null },
      },
      select: {
        id: true,
        name: true,
        slug: true,
        businessType: true,
        isActive: true,
        externalIds: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
    })

    // Filter in application layer (MongoDB JSON field filtering)
    const connectedBusinesses = allBusinesses
      .filter((biz) => {
        if (!biz.externalIds || typeof biz.externalIds !== 'object') return false
        const ids = biz.externalIds as Record<string, string>
        return ids[slug] !== undefined
      })
      .map((biz) => {
        const ids = biz.externalIds as Record<string, string>
        return {
          businessId: biz.id,
          businessName: biz.name,
          businessSlug: biz.slug,
          businessType: biz.businessType,
          isActive: biz.isActive,
          externalUserId: ids[slug],
          createdAt: biz.createdAt,
        }
      })

    // Manual pagination
    const total = connectedBusinesses.length
    const paginatedBusinesses = connectedBusinesses.slice((page - 1) * limit, page * limit)

    const responseBody = {
      businesses: paginatedBusinesses,
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
    console.error('Integration businesses list error:', error)
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
