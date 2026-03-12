// api/admin/stores/[businessId]/marketing/ads/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { checkBusinessAccess } from '@/lib/api-helpers'
import { prisma } from '@/lib/prisma'

// PATCH - Update Meta Pixel ID (admin only, requires metaPixelEnabled)
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ businessId: string }> }
) {
  try {
    const { businessId } = await params

    const access = await checkBusinessAccess(businessId)
    if (!access.authorized) {
      return NextResponse.json(
        { error: access.error },
        { status: access.status }
      )
    }

    const body = await request.json()
    const { metaPixelId } = body

    // Validate: metaPixelId must be string or null
    if (metaPixelId !== null && metaPixelId !== undefined && typeof metaPixelId !== 'string') {
      return NextResponse.json(
        { error: 'metaPixelId must be a string or null' },
        { status: 400 }
      )
    }

    // Check business has metaPixelEnabled (SuperAdmin custom feature)
    const business = await prisma.business.findUnique({
      where: { id: businessId },
      select: { metaPixelEnabled: true }
    })

    if (!business?.metaPixelEnabled) {
      return NextResponse.json(
        { error: 'Meta Pixel feature is not enabled for this business. Contact support.' },
        { status: 403 }
      )
    }

    const trimmed = typeof metaPixelId === 'string' ? metaPixelId.trim() : null

    await prisma.business.update({
      where: { id: businessId },
      data: {
        metaPixelId: trimmed || null,
        updatedAt: new Date()
      }
    })

    return NextResponse.json({
      success: true,
      message: 'Meta Pixel ID updated successfully'
    })
  } catch (error) {
    console.error('Error updating Meta Pixel:', error)
    return NextResponse.json(
      { error: 'Failed to update Meta Pixel' },
      { status: 500 }
    )
  }
}
