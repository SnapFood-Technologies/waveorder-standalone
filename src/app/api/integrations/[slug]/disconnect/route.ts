// src/app/api/integrations/[slug]/disconnect/route.ts
/**
 * External API endpoint for integrations to disconnect a business.
 * Removes the integration's key from the business's externalIds JSON.
 *
 * Authentication: Integration API key (wo_int_xxx)
 * Body: { businessId: string }
 */
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import {
  authenticateIntegrationRequest,
  logIntegrationCall,
} from '@/lib/integration-auth'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const startTime = Date.now()
  const { slug } = await params
  const endpoint = `/api/integrations/${slug}/disconnect`
  let integrationId = ''

  try {
    // Authenticate the integration
    const authResult = await authenticateIntegrationRequest(request)
    if (authResult instanceof NextResponse) return authResult
    const { integration } = authResult
    integrationId = integration.integrationId

    // Verify slug matches the authenticated integration
    if (integration.integrationSlug !== slug) {
      const errorMsg = 'API key does not belong to this integration'
      await logIntegrationCall({
        integrationId,
        endpoint,
        method: 'POST',
        statusCode: 403,
        error: errorMsg,
        ipAddress: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip'),
        duration: Date.now() - startTime,
      })
      return NextResponse.json({ error: errorMsg }, { status: 403 })
    }

    // Parse and validate request body
    const body = await request.json()
    const { businessId } = body

    if (!businessId) {
      const errorMsg = 'businessId is required'
      await logIntegrationCall({
        integrationId,
        endpoint,
        method: 'POST',
        statusCode: 400,
        requestBody: { businessId },
        error: errorMsg,
        ipAddress: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip'),
        duration: Date.now() - startTime,
      })
      return NextResponse.json({ error: errorMsg }, { status: 400 })
    }

    // Verify the business exists
    const business = await prisma.business.findUnique({
      where: { id: businessId },
      select: { id: true, name: true, externalIds: true },
    })

    if (!business) {
      const errorMsg = `Business with ID "${businessId}" not found`
      await logIntegrationCall({
        integrationId,
        businessId,
        endpoint,
        method: 'POST',
        statusCode: 404,
        requestBody: { businessId },
        error: errorMsg,
        ipAddress: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip'),
        duration: Date.now() - startTime,
      })
      return NextResponse.json({ error: errorMsg }, { status: 404 })
    }

    // Remove integration's key from externalIds
    const currentExternalIds = (business.externalIds as Record<string, string>) || {}

    if (!currentExternalIds[slug]) {
      const errorMsg = `Business is not connected to ${slug}`
      await logIntegrationCall({
        integrationId,
        businessId,
        endpoint,
        method: 'POST',
        statusCode: 409,
        requestBody: { businessId },
        error: errorMsg,
        ipAddress: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip'),
        duration: Date.now() - startTime,
      })
      return NextResponse.json({ error: errorMsg }, { status: 409 })
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { [slug]: _removed, ...remainingIds } = currentExternalIds

    await prisma.business.update({
      where: { id: businessId },
      data: {
        externalIds: Object.keys(remainingIds).length > 0 ? remainingIds : null,
      },
    })

    const responseBody = {
      success: true,
      businessId,
      businessName: business.name,
      integrationSlug: slug,
      message: 'Business disconnected successfully',
    }

    await logIntegrationCall({
      integrationId,
      businessId,
      endpoint,
      method: 'POST',
      statusCode: 200,
      requestBody: { businessId },
      responseBody,
      ipAddress: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip'),
      duration: Date.now() - startTime,
    })

    return NextResponse.json(responseBody)
  } catch (error) {
    console.error('Integration disconnect error:', error)
    const errorMsg = error instanceof Error ? error.message : 'Internal server error'
    await logIntegrationCall({
      integrationId,
      endpoint,
      method: 'POST',
      statusCode: 500,
      error: errorMsg,
      ipAddress: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip'),
      duration: Date.now() - startTime,
    }).catch(() => {})
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
