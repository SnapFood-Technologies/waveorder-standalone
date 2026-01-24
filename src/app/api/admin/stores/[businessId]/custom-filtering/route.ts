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

    // Default settings with enhanced structure
    const defaultSettings = {
      categoriesEnabled: true,
      categoriesMode: 'all' as const,
      selectedCategories: [],
      collectionsEnabled: false,
      collectionsMode: 'all' as const,
      selectedCollections: [],
      groupsEnabled: false,
      groupsMode: 'all' as const,
      selectedGroups: [],
      brandsEnabled: false,
      brandsMode: 'all' as const,
      selectedBrands: [],
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
    const {
      categoriesEnabled,
      categoriesMode,
      selectedCategories,
      collectionsEnabled,
      collectionsMode,
      selectedCollections,
      groupsEnabled,
      groupsMode,
      selectedGroups,
      brandsEnabled,
      brandsMode,
      selectedBrands,
      priceRangeEnabled
    } = body

    // Get current settings
    const business = await prisma.business.findUnique({
      where: { id: businessId },
      select: { customFilterSettings: true }
    })

    const currentSettings = (business?.customFilterSettings as any) || {}

    // Build updated settings with enhanced structure
    const updatedSettings = {
      // Categories (now configurable)
      categoriesEnabled: categoriesEnabled !== undefined ? categoriesEnabled : (currentSettings.categoriesEnabled !== undefined ? currentSettings.categoriesEnabled : true),
      categoriesMode: categoriesMode || currentSettings.categoriesMode || 'all',
      selectedCategories: selectedCategories || currentSettings.selectedCategories || [],
      
      // Collections
      collectionsEnabled: collectionsEnabled !== undefined ? collectionsEnabled : (currentSettings.collectionsEnabled || false),
      collectionsMode: collectionsMode || currentSettings.collectionsMode || 'all',
      selectedCollections: selectedCollections || currentSettings.selectedCollections || [],
      
      // Groups
      groupsEnabled: groupsEnabled !== undefined ? groupsEnabled : (currentSettings.groupsEnabled || false),
      groupsMode: groupsMode || currentSettings.groupsMode || 'all',
      selectedGroups: selectedGroups || currentSettings.selectedGroups || [],
      
      // Brands
      brandsEnabled: brandsEnabled !== undefined ? brandsEnabled : (currentSettings.brandsEnabled || false),
      brandsMode: brandsMode || currentSettings.brandsMode || 'all',
      selectedBrands: selectedBrands || currentSettings.selectedBrands || [],
      
      // Price Range (always enabled)
      priceRangeEnabled: true
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
