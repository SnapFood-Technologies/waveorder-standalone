import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import type { Prisma } from '@prisma/client'
import { checkBusinessAccess } from '@/lib/api-helpers'
import { prisma } from '@/lib/prisma'
import { HO_MUTEX_ERR_ENABLE_HOLA_EMBED } from '@/lib/holaora-ai-mutex-messages'
import { aiHolaMutexEnforced } from '@/lib/storefront-ai-hola-geo-split'
import { filterToCatalogCountryCodes } from '@/lib/catalog-country-options'

const uuidLike = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

const patchSchema = z
  .object({
    holaoraStorefrontEmbedEnabled: z.boolean().optional(),
    holaoraEmbedKind: z.enum(['SCRIPT', 'IFRAME']).optional(),
    holaoraAccountId: z.union([z.string().min(1).max(128), z.null()]).optional(),
    holaoraChatPrimaryColor: z.union([z.string().max(64), z.null()]).optional(),
    holaoraChatPosition: z.union([z.string().max(64), z.null()]).optional(),
    holaoraChatTitle: z.union([z.string().max(200), z.null()]).optional(),
    holaoraChatGreeting: z.union([z.string().max(500), z.null()]).optional(),
    holaoraChatSuggestionsEnabled: z.boolean().optional(),
    holaoraChatSuggestions: z.union([z.array(z.string().max(200)).max(30), z.null()]).optional(),
    holaoraIframeWidth: z.union([z.number().int().min(200).max(1200), z.null()]).optional(),
    holaoraIframeHeight: z.union([z.number().int().min(200).max(1200), z.null()]).optional(),
    storefrontAiGeoSplitEnabled: z.boolean().optional(),
    aiAssistantVisitorCountryCodes: z.array(z.string().max(8)).max(50).optional(),
  })
  .strict()

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
        holaoraEmbedKind: true,
        holaoraAccountId: true,
        holaoraChatPrimaryColor: true,
        holaoraChatPosition: true,
        holaoraChatTitle: true,
        holaoraChatGreeting: true,
        holaoraChatSuggestionsEnabled: true,
        holaoraChatSuggestions: true,
        holaoraIframeWidth: true,
        holaoraIframeHeight: true,
        holaoraSetupUrl: true,
        holaoraProvisioningStatus: true,
        holaoraProvisioningError: true,
        aiAssistantEnabled: true,
        storefrontAiGeoSplitEnabled: true,
        aiAssistantVisitorCountryCodes: true,
      },
    })

    if (!business) {
      return NextResponse.json({ error: 'Business not found' }, { status: 404 })
    }

    return NextResponse.json({
      holaoraEntitled: business.holaoraEntitled,
      holaoraStorefrontEmbedEnabled: business.holaoraStorefrontEmbedEnabled,
      holaoraEmbedKind: business.holaoraEmbedKind === 'IFRAME' ? 'IFRAME' : 'SCRIPT',
      holaoraAccountId: business.holaoraAccountId,
      holaoraChatPrimaryColor: business.holaoraChatPrimaryColor,
      holaoraChatPosition: business.holaoraChatPosition,
      holaoraChatTitle: business.holaoraChatTitle,
      holaoraChatGreeting: business.holaoraChatGreeting,
      holaoraChatSuggestionsEnabled: business.holaoraChatSuggestionsEnabled ?? false,
      holaoraChatSuggestions: Array.isArray(business.holaoraChatSuggestions)
        ? (business.holaoraChatSuggestions as string[])
        : null,
      holaoraIframeWidth: business.holaoraIframeWidth,
      holaoraIframeHeight: business.holaoraIframeHeight,
      holaoraSetupUrl: business.holaoraSetupUrl,
      holaoraProvisioningStatus: business.holaoraProvisioningStatus,
      holaoraProvisioningError: business.holaoraProvisioningError,
      aiAssistantEnabled: business.aiAssistantEnabled,
      storefrontAiGeoSplitEnabled: business.storefrontAiGeoSplitEnabled ?? false,
      aiAssistantVisitorCountryCodes: Array.isArray(business.aiAssistantVisitorCountryCodes)
        ? business.aiAssistantVisitorCountryCodes
        : [],
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

    const p = parsed.data
    const touched = Object.keys(p).filter((k) => p[k as keyof typeof p] !== undefined)
    if (touched.length === 0) {
      return NextResponse.json({ error: 'No fields to update' }, { status: 400 })
    }

    if (p.holaoraAccountId !== undefined && p.holaoraAccountId !== null && !uuidLike.test(p.holaoraAccountId)) {
      return NextResponse.json(
        { error: 'Workspace ID must be a UUID (copy it from the HolaOra dashboard embed code).' },
        { status: 400 }
      )
    }

    const current = await prisma.business.findUnique({
      where: { id: businessId },
      select: {
        holaoraEntitled: true,
        aiAssistantEnabled: true,
        holaoraStorefrontEmbedEnabled: true,
        storefrontAiGeoSplitEnabled: true,
        aiAssistantVisitorCountryCodes: true,
      },
    })
    if (!current) {
      return NextResponse.json({ error: 'Business not found' }, { status: 404 })
    }

    if (p.holaoraStorefrontEmbedEnabled === true && !current.holaoraEntitled) {
      return NextResponse.json(
        { error: 'HolaOra embed requires an active HolaOra entitlement on your subscription.' },
        { status: 403 }
      )
    }

    const nextGeo =
      p.storefrontAiGeoSplitEnabled !== undefined
        ? p.storefrontAiGeoSplitEnabled
        : current.storefrontAiGeoSplitEnabled
    const nextCodes =
      p.aiAssistantVisitorCountryCodes !== undefined
        ? filterToCatalogCountryCodes(p.aiAssistantVisitorCountryCodes)
        : filterToCatalogCountryCodes(current.aiAssistantVisitorCountryCodes)

    if (nextGeo === true && nextCodes.length === 0) {
      return NextResponse.json(
        {
          error:
            'Geo split requires at least one country (WaveOrder AI regions), or turn geo split off.',
        },
        { status: 400 }
      )
    }

    if (
      p.holaoraStorefrontEmbedEnabled === true &&
      current.aiAssistantEnabled &&
      aiHolaMutexEnforced(nextGeo, nextCodes)
    ) {
      return NextResponse.json({ error: HO_MUTEX_ERR_ENABLE_HOLA_EMBED }, { status: 400 })
    }

    const data: Prisma.BusinessUpdateInput = { updatedAt: new Date() }
    if (p.holaoraStorefrontEmbedEnabled !== undefined) data.holaoraStorefrontEmbedEnabled = p.holaoraStorefrontEmbedEnabled
    if (p.holaoraEmbedKind !== undefined) data.holaoraEmbedKind = p.holaoraEmbedKind
    if (p.holaoraAccountId !== undefined) data.holaoraAccountId = p.holaoraAccountId
    if (p.holaoraChatPrimaryColor !== undefined) data.holaoraChatPrimaryColor = p.holaoraChatPrimaryColor
    if (p.holaoraChatPosition !== undefined) data.holaoraChatPosition = p.holaoraChatPosition
    if (p.holaoraChatTitle !== undefined) data.holaoraChatTitle = p.holaoraChatTitle
    if (p.holaoraChatGreeting !== undefined) data.holaoraChatGreeting = p.holaoraChatGreeting
    if (p.holaoraChatSuggestionsEnabled !== undefined)
      data.holaoraChatSuggestionsEnabled = p.holaoraChatSuggestionsEnabled
    if (p.holaoraChatSuggestions !== undefined)
      data.holaoraChatSuggestions = p.holaoraChatSuggestions as Prisma.InputJsonValue
    if (p.holaoraIframeWidth !== undefined) data.holaoraIframeWidth = p.holaoraIframeWidth
    if (p.holaoraIframeHeight !== undefined) data.holaoraIframeHeight = p.holaoraIframeHeight
    if (p.storefrontAiGeoSplitEnabled !== undefined) data.storefrontAiGeoSplitEnabled = p.storefrontAiGeoSplitEnabled
    if (p.aiAssistantVisitorCountryCodes !== undefined)
      data.aiAssistantVisitorCountryCodes = filterToCatalogCountryCodes(p.aiAssistantVisitorCountryCodes)

    const updated = await prisma.business.update({
      where: { id: businessId },
      data,
      select: {
        holaoraStorefrontEmbedEnabled: true,
        holaoraEmbedKind: true,
        holaoraAccountId: true,
        holaoraChatPrimaryColor: true,
        holaoraChatPosition: true,
        holaoraChatTitle: true,
        holaoraChatGreeting: true,
        holaoraChatSuggestionsEnabled: true,
        holaoraChatSuggestions: true,
        holaoraIframeWidth: true,
        holaoraIframeHeight: true,
        aiAssistantEnabled: true,
        storefrontAiGeoSplitEnabled: true,
        aiAssistantVisitorCountryCodes: true,
      },
    })

    return NextResponse.json({
      success: true,
      holaoraStorefrontEmbedEnabled: updated.holaoraStorefrontEmbedEnabled,
      holaoraEmbedKind: updated.holaoraEmbedKind === 'IFRAME' ? 'IFRAME' : 'SCRIPT',
      holaoraAccountId: updated.holaoraAccountId,
      holaoraChatPrimaryColor: updated.holaoraChatPrimaryColor,
      holaoraChatPosition: updated.holaoraChatPosition,
      holaoraChatTitle: updated.holaoraChatTitle,
      holaoraChatGreeting: updated.holaoraChatGreeting,
      holaoraChatSuggestionsEnabled: updated.holaoraChatSuggestionsEnabled ?? false,
      holaoraChatSuggestions: Array.isArray(updated.holaoraChatSuggestions)
        ? (updated.holaoraChatSuggestions as string[])
        : null,
      holaoraIframeWidth: updated.holaoraIframeWidth,
      holaoraIframeHeight: updated.holaoraIframeHeight,
      aiAssistantEnabled: updated.aiAssistantEnabled,
      storefrontAiGeoSplitEnabled: updated.storefrontAiGeoSplitEnabled ?? false,
      aiAssistantVisitorCountryCodes: Array.isArray(updated.aiAssistantVisitorCountryCodes)
        ? updated.aiAssistantVisitorCountryCodes
        : [],
    })
  } catch (e) {
    console.error('holaora-settings PATCH', e)
    return NextResponse.json({ error: 'Failed to update HolaOra settings' }, { status: 500 })
  }
}
