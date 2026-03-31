import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { checkBusinessAccess } from '@/lib/api-helpers'
import { prisma } from '@/lib/prisma'
import { applyAiHolaMutex } from '@/lib/holaora-mutex'

const patchSchema = z.object({
  holaoraStorefrontEmbedEnabled: z.boolean().optional(),
})

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ businessId: string }> }
) {
  try {
    const { businessId } = await params
    const access = await checkBusinessAccess(businessId)
    if (!access.authorized) {
      return NextResponse.json({ error: access.error }, { status: access.status })
    }

    const business = await prisma.business.findUnique({
      where: { id: businessId },
      select: {
        holaoraEntitled: true,
        holaoraStorefrontEmbedEnabled: true,
        holaoraAccountId: true,
        holaoraSetupUrl: true,
        holaoraProvisioningStatus: true,
        holaoraProvisioningError: true,
        holaoraSuperAdminForceOff: true,
        aiAssistantEnabled: true,
      },
    })

    if (!business) {
      return NextResponse.json({ error: 'Business not found' }, { status: 404 })
    }

    return NextResponse.json({
      holaoraEntitled: business.holaoraEntitled,
      holaoraStorefrontEmbedEnabled: business.holaoraStorefrontEmbedEnabled,
      holaoraAccountId: business.holaoraAccountId,
      holaoraSetupUrl: business.holaoraSetupUrl,
      holaoraProvisioningStatus: business.holaoraProvisioningStatus,
      holaoraProvisioningError: business.holaoraProvisioningError,
      holaoraSuperAdminForceOff: business.holaoraSuperAdminForceOff,
      aiAssistantEnabled: business.aiAssistantEnabled,
    })
  } catch (e) {
    console.error('holaora-settings GET', e)
    return NextResponse.json({ error: 'Failed to load HolaOra settings' }, { status: 500 })
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ businessId: string }> }
) {
  try {
    const { businessId } = await params
    const access = await checkBusinessAccess(businessId)
    if (!access.authorized) {
      return NextResponse.json({ error: access.error }, { status: access.status })
    }

    if (!access.isImpersonating) {
      const businessUser = await prisma.businessUser.findFirst({
        where: {
          userId: access.session!.user.id,
          businessId,
          role: { in: ['OWNER', 'MANAGER'] },
        },
      })
      if (!businessUser) {
        return NextResponse.json(
          { error: 'Insufficient permissions - requires OWNER or MANAGER role' },
          { status: 403 }
        )
      }
    }

    const body = await request.json()
    const parsed = patchSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.flatten().fieldErrors },
        { status: 400 }
      )
    }

    if (parsed.data.holaoraStorefrontEmbedEnabled === undefined) {
      return NextResponse.json(
        { error: 'holaoraStorefrontEmbedEnabled is required' },
        { status: 400 }
      )
    }

    const current = await prisma.business.findUnique({
      where: { id: businessId },
      select: { holaoraEntitled: true },
    })
    if (!current) {
      return NextResponse.json({ error: 'Business not found' }, { status: 404 })
    }

    if (parsed.data.holaoraStorefrontEmbedEnabled === true && !current.holaoraEntitled) {
      return NextResponse.json(
        { error: 'HolaOra embed requires an active HolaOra entitlement on your subscription.' },
        { status: 403 }
      )
    }

    const mutex = applyAiHolaMutex(
      parsed.data.holaoraStorefrontEmbedEnabled === undefined
        ? {}
        : { holaoraStorefrontEmbedEnabled: parsed.data.holaoraStorefrontEmbedEnabled }
    )

    const updated = await prisma.business.update({
      where: { id: businessId },
      data: {
        ...(mutex.holaoraStorefrontEmbedEnabled !== undefined
          ? { holaoraStorefrontEmbedEnabled: mutex.holaoraStorefrontEmbedEnabled }
          : {}),
        ...(mutex.aiAssistantEnabled !== undefined
          ? { aiAssistantEnabled: mutex.aiAssistantEnabled }
          : {}),
        updatedAt: new Date(),
      },
      select: {
        holaoraStorefrontEmbedEnabled: true,
        aiAssistantEnabled: true,
      },
    })

    return NextResponse.json({
      success: true,
      holaoraStorefrontEmbedEnabled: updated.holaoraStorefrontEmbedEnabled,
      aiAssistantEnabled: updated.aiAssistantEnabled,
    })
  } catch (e) {
    console.error('holaora-settings PATCH', e)
    return NextResponse.json({ error: 'Failed to update HolaOra settings' }, { status: 500 })
  }
}
