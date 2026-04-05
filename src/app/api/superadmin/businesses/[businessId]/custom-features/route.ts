import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { HO_MUTEX_ERR_ENABLE_AI } from '@/lib/holaora-ai-mutex-messages'
import { aiHolaMutexEnforced } from '@/lib/storefront-ai-hola-geo-split'
import { filterToCatalogCountryCodes } from '@/lib/catalog-country-options'

// GET - Fetch custom features settings for a business
export async function GET(
  request: Request,
  { params }: { params: Promise<{ businessId: string }> }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if user is superadmin
    const user = await prisma.user.findUnique({
      where: { email: session.user.email }
    })

    if (!user || user.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Forbidden - SuperAdmin access required' }, { status: 403 })
    }

    const { businessId } = await params

    // Fetch business with custom features settings
    const business = await prisma.business.findUnique({
      where: { id: businessId },
      select: {
        id: true,
        name: true,
        brandsFeatureEnabled: true,
        collectionsFeatureEnabled: true,
        groupsFeatureEnabled: true,
        customMenuEnabled: true,
        customFilteringEnabled: true,
        aiAssistantEnabled: true,
        aiChatModel: true,
        metaCatalogExportEnabled: true,
        metaPixelEnabled: true,
        storefrontAvailabilityDotEnabled: true,
        holaoraStorefrontEmbedEnabled: true,
        storefrontAiGeoSplitEnabled: true,
        aiAssistantVisitorCountryCodes: true,
      }
    })

    if (!business) {
      return NextResponse.json({ error: 'Business not found' }, { status: 404 })
    }

    return NextResponse.json({
      success: true,
      business: {
        id: business.id,
        name: business.name
      },
      features: {
        brandsFeatureEnabled: business.brandsFeatureEnabled,
        collectionsFeatureEnabled: business.collectionsFeatureEnabled,
        groupsFeatureEnabled: business.groupsFeatureEnabled,
        customMenuEnabled: business.customMenuEnabled,
        customFilteringEnabled: business.customFilteringEnabled,
        aiAssistantEnabled: business.aiAssistantEnabled,
        aiChatModel: business.aiChatModel,
        metaCatalogExportEnabled: business.metaCatalogExportEnabled,
        metaPixelEnabled: business.metaPixelEnabled,
        storefrontAvailabilityDotEnabled: business.storefrontAvailabilityDotEnabled,
        storefrontAiGeoSplitEnabled: business.storefrontAiGeoSplitEnabled ?? false,
        aiAssistantVisitorCountryCodes: Array.isArray(business.aiAssistantVisitorCountryCodes)
          ? business.aiAssistantVisitorCountryCodes
          : [],
        holaoraStorefrontEmbedEnabled: business.holaoraStorefrontEmbedEnabled ?? false,
      }
    })
  } catch (error) {
    console.error('Error fetching custom features:', error)
    return NextResponse.json(
      { error: 'Failed to fetch custom features' },
      { status: 500 }
    )
  }
}

// PATCH - Update custom features settings for a business
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ businessId: string }> }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if user is superadmin
    const user = await prisma.user.findUnique({
      where: { email: session.user.email }
    })

    if (!user || user.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Forbidden - SuperAdmin access required' }, { status: 403 })
    }

    const { businessId } = await params
    const body = await request.json()

    const {
      brandsFeatureEnabled,
      collectionsFeatureEnabled,
      groupsFeatureEnabled,
      customMenuEnabled,
      customFilteringEnabled,
      aiAssistantEnabled,
      aiChatModel,
      metaCatalogExportEnabled,
      metaPixelEnabled,
      storefrontAvailabilityDotEnabled,
      storefrontAiGeoSplitEnabled,
      aiAssistantVisitorCountryCodes,
    } = body

    // Validate business exists
    const business = await prisma.business.findUnique({
      where: { id: businessId },
      select: {
        id: true,
        holaoraStorefrontEmbedEnabled: true,
        storefrontAiGeoSplitEnabled: true,
        aiAssistantVisitorCountryCodes: true,
        brandsFeatureEnabled: true,
        collectionsFeatureEnabled: true,
        groupsFeatureEnabled: true,
        customMenuEnabled: true,
        customFilteringEnabled: true,
        aiAssistantEnabled: true,
        aiChatModel: true,
        metaCatalogExportEnabled: true,
        metaPixelEnabled: true,
        storefrontAvailabilityDotEnabled: true,
      },
    })

    if (!business) {
      return NextResponse.json({ error: 'Business not found' }, { status: 404 })
    }

    // Prepare update data (only include fields that are provided)
    const updateData: Record<string, unknown> = {}
    if (brandsFeatureEnabled !== undefined) updateData.brandsFeatureEnabled = brandsFeatureEnabled
    if (collectionsFeatureEnabled !== undefined) updateData.collectionsFeatureEnabled = collectionsFeatureEnabled
    if (groupsFeatureEnabled !== undefined) updateData.groupsFeatureEnabled = groupsFeatureEnabled
    if (customMenuEnabled !== undefined) updateData.customMenuEnabled = customMenuEnabled
    if (customFilteringEnabled !== undefined) updateData.customFilteringEnabled = customFilteringEnabled
    if (aiAssistantEnabled !== undefined) updateData.aiAssistantEnabled = aiAssistantEnabled
    if (aiChatModel !== undefined) updateData.aiChatModel = aiChatModel || null
    if (metaCatalogExportEnabled !== undefined) updateData.metaCatalogExportEnabled = metaCatalogExportEnabled
    if (metaPixelEnabled !== undefined) updateData.metaPixelEnabled = metaPixelEnabled
    if (storefrontAvailabilityDotEnabled !== undefined)
      updateData.storefrontAvailabilityDotEnabled = storefrontAvailabilityDotEnabled
    if (storefrontAiGeoSplitEnabled !== undefined)
      updateData.storefrontAiGeoSplitEnabled = storefrontAiGeoSplitEnabled
    if (aiAssistantVisitorCountryCodes !== undefined)
      updateData.aiAssistantVisitorCountryCodes = filterToCatalogCountryCodes(aiAssistantVisitorCountryCodes)

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json({ error: 'No valid fields to update' }, { status: 400 })
    }

    const nextGeo =
      storefrontAiGeoSplitEnabled !== undefined
        ? storefrontAiGeoSplitEnabled
        : business.storefrontAiGeoSplitEnabled
    const nextCodes =
      aiAssistantVisitorCountryCodes !== undefined
        ? filterToCatalogCountryCodes(aiAssistantVisitorCountryCodes)
        : filterToCatalogCountryCodes(business.aiAssistantVisitorCountryCodes)

    if (nextGeo === true && nextCodes.length === 0) {
      return NextResponse.json(
        {
          error:
            'Geo split requires at least one country (where WaveOrder AI shows), or turn geo split off.',
        },
        { status: 400 }
      )
    }

    const nextAi =
      aiAssistantEnabled !== undefined ? aiAssistantEnabled : business.aiAssistantEnabled

    if (
      nextAi === true &&
      business.holaoraStorefrontEmbedEnabled &&
      aiHolaMutexEnforced(nextGeo, nextCodes)
    ) {
      return NextResponse.json({ error: HO_MUTEX_ERR_ENABLE_AI }, { status: 400 })
    }

    // Update business
    const updatedBusiness = await prisma.business.update({
      where: { id: businessId },
      data: updateData,
      select: {
        id: true,
        name: true,
        brandsFeatureEnabled: true,
        collectionsFeatureEnabled: true,
        groupsFeatureEnabled: true,
        customMenuEnabled: true,
        customFilteringEnabled: true,
        aiAssistantEnabled: true,
        aiChatModel: true,
        metaCatalogExportEnabled: true,
        metaPixelEnabled: true,
        storefrontAvailabilityDotEnabled: true,
        storefrontAiGeoSplitEnabled: true,
        aiAssistantVisitorCountryCodes: true,
        holaoraStorefrontEmbedEnabled: true,
      },
    })

    return NextResponse.json({
      success: true,
      message: 'Custom features updated successfully',
      features: {
        brandsFeatureEnabled: updatedBusiness.brandsFeatureEnabled,
        collectionsFeatureEnabled: updatedBusiness.collectionsFeatureEnabled,
        groupsFeatureEnabled: updatedBusiness.groupsFeatureEnabled,
        customMenuEnabled: updatedBusiness.customMenuEnabled,
        customFilteringEnabled: updatedBusiness.customFilteringEnabled,
        aiAssistantEnabled: updatedBusiness.aiAssistantEnabled,
        aiChatModel: updatedBusiness.aiChatModel,
        metaCatalogExportEnabled: updatedBusiness.metaCatalogExportEnabled,
        metaPixelEnabled: updatedBusiness.metaPixelEnabled,
        storefrontAvailabilityDotEnabled: updatedBusiness.storefrontAvailabilityDotEnabled,
        storefrontAiGeoSplitEnabled: updatedBusiness.storefrontAiGeoSplitEnabled ?? false,
        aiAssistantVisitorCountryCodes: Array.isArray(updatedBusiness.aiAssistantVisitorCountryCodes)
          ? updatedBusiness.aiAssistantVisitorCountryCodes
          : [],
        holaoraStorefrontEmbedEnabled: updatedBusiness.holaoraStorefrontEmbedEnabled ?? false,
      },
    })
  } catch (error) {
    console.error('Error updating custom features:', error)
    return NextResponse.json(
      { error: 'Failed to update custom features' },
      { status: 500 }
    )
  }
}
