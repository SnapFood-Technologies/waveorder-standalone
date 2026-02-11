// src/app/api/integrations/[slug]/status/route.ts
/**
 * External API endpoint to check connection status between an integration and a business.
 *
 * Authentication: Integration API key (wo_int_xxx)
 * Query: ?businessId=xxx
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
  const endpoint = `/api/integrations/${slug}/status`
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

    // Get businessId from query params
    const { searchParams } = new URL(request.url)
    const businessId = searchParams.get('businessId')

    if (!businessId) {
      return NextResponse.json(
        { error: 'businessId query parameter is required' },
        { status: 400 }
      )
    }

    // Fetch the business
    const business = await prisma.business.findUnique({
      where: { id: businessId },
      select: {
        id: true,
        name: true,
        slug: true,
        businessType: true,
        isActive: true,
        externalIds: true,
      },
    })

    if (!business) {
      const responseBody = { connected: false, error: 'Business not found' }
      await logIntegrationCall({
        integrationId,
        businessId,
        endpoint,
        method: 'GET',
        statusCode: 404,
        responseBody,
        ipAddress: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip'),
        duration: Date.now() - startTime,
      })
      return NextResponse.json(responseBody, { status: 404 })
    }

    const externalIds = (business.externalIds as Record<string, string>) || {}
    const isConnected = externalIds[slug] !== undefined

    const responseBody = {
      connected: isConnected,
      businessId: business.id,
      businessName: business.name,
      businessSlug: business.slug,
      businessType: business.businessType,
      isActive: business.isActive,
      externalUserId: isConnected ? externalIds[slug] : null,
      integrationSlug: slug,
    }

    await logIntegrationCall({
      integrationId,
      businessId,
      endpoint,
      method: 'GET',
      statusCode: 200,
      responseBody,
      ipAddress: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip'),
      duration: Date.now() - startTime,
    })

    return NextResponse.json(responseBody)
  } catch (error) {
    console.error('Integration status error:', error)
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
