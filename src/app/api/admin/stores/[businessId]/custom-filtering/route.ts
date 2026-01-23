import { NextRequest, NextResponse } from 'next/server'
import { checkBusinessAccess } from '@/lib/api-helpers'
import { checkFeatureAccess } from '@/lib/feature-access'
import { prisma } from '@/lib/prisma'

// GET - Get custom filtering settings
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ businessId: string }> }
) {
  try {
    const { businessId } = await params

    const access = await checkBusinessAccess(businessId)
    
    if (!access.authorized) {
      return NextResponse.json({ message: access.error }, { status: access.status })
    }

    // Check if custom filtering feature is enabled
    const featureAccess = await checkFeatureAccess(businessId, 'customFiltering')
    if (!featureAccess.authorized) {
      return NextResponse.json({ message: featureAccess.error }, { status: featureAccess.status })
    }

    // Get business with custom filter settings
    const business = await prisma.business.findUnique({
      where: { id: businessId },
      select: {
        customFilterSettings: true
      }
    })

    // Default settings
    const defaultSettings = {
      categoriesEnabled: true,
      collectionsEnabled: false,
      groupsEnabled: false,
      brandsEnabled: false,
      priceRangeEnabled: true
    }

    const settings = business?.customFilterSettings 
      ? { ...defaultSettings, ...(business.customFilterSettings as any) }
      : defaultSettings

    return NextResponse.json({ settings })

  } catch (error) {
    console.error('Error fetching custom filtering settings:', error)
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 })
  }
}

// PATCH - Update custom filtering settings
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ businessId: string }> }
) {
  try {
    const { businessId } = await params

    const access = await checkBusinessAccess(businessId)
    
    if (!access.authorized) {
      return NextResponse.json({ message: access.error }, { status: access.status })
    }

    // Check if custom filtering feature is enabled
    const featureAccess = await checkFeatureAccess(businessId, 'customFiltering')
    if (!featureAccess.authorized) {
      return NextResponse.json({ message: featureAccess.error }, { status: featureAccess.status })
    }

    const body = await request.json()
    const { collectionsEnabled, groupsEnabled, brandsEnabled } = body

    // Get current settings
    const business = await prisma.business.findUnique({
      where: { id: businessId },
      select: { customFilterSettings: true }
    })

    const currentSettings = business?.customFilterSettings || {}

    // Update settings (categories and priceRange are always enabled)
    const updatedSettings = {
      categoriesEnabled: true,  // Always true
      priceRangeEnabled: true,  // Always true
      collectionsEnabled: collectionsEnabled !== undefined ? collectionsEnabled : (currentSettings as any).collectionsEnabled || false,
      groupsEnabled: groupsEnabled !== undefined ? groupsEnabled : (currentSettings as any).groupsEnabled || false,
      brandsEnabled: brandsEnabled !== undefined ? brandsEnabled : (currentSettings as any).brandsEnabled || false
    }

    // Save updated settings
    await prisma.business.update({
      where: { id: businessId },
      data: {
        customFilterSettings: updatedSettings
      }
    })

    return NextResponse.json({ settings: updatedSettings })

  } catch (error) {
    console.error('Error updating custom filtering settings:', error)
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 })
  }
}
