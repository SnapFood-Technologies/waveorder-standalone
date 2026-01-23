import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

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

    if (!user || user.role !== 'SUPERADMIN') {
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
        customMenuEnabled: true,
        customFilteringEnabled: true
      }
    })

    if (!business) {
      return NextResponse.json({ error: 'Business not found' }, { status: 404 })
    }

    return NextResponse.json({
      success: true,
      features: {
        brandsFeatureEnabled: business.brandsFeatureEnabled,
        collectionsFeatureEnabled: business.collectionsFeatureEnabled,
        customMenuEnabled: business.customMenuEnabled,
        customFilteringEnabled: business.customFilteringEnabled
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

    if (!user || user.role !== 'SUPERADMIN') {
      return NextResponse.json({ error: 'Forbidden - SuperAdmin access required' }, { status: 403 })
    }

    const { businessId } = await params
    const body = await request.json()

    const {
      brandsFeatureEnabled,
      collectionsFeatureEnabled,
      customMenuEnabled,
      customFilteringEnabled
    } = body

    // Validate business exists
    const business = await prisma.business.findUnique({
      where: { id: businessId }
    })

    if (!business) {
      return NextResponse.json({ error: 'Business not found' }, { status: 404 })
    }

    // Prepare update data (only include fields that are provided)
    const updateData: any = {}
    if (brandsFeatureEnabled !== undefined) updateData.brandsFeatureEnabled = brandsFeatureEnabled
    if (collectionsFeatureEnabled !== undefined) updateData.collectionsFeatureEnabled = collectionsFeatureEnabled
    if (customMenuEnabled !== undefined) updateData.customMenuEnabled = customMenuEnabled
    if (customFilteringEnabled !== undefined) updateData.customFilteringEnabled = customFilteringEnabled

    // Update business
    const updatedBusiness = await prisma.business.update({
      where: { id: businessId },
      data: updateData,
      select: {
        id: true,
        name: true,
        brandsFeatureEnabled: true,
        collectionsFeatureEnabled: true,
        customMenuEnabled: true,
        customFilteringEnabled: true
      }
    })

    return NextResponse.json({
      success: true,
      message: 'Custom features updated successfully',
      features: {
        brandsFeatureEnabled: updatedBusiness.brandsFeatureEnabled,
        collectionsFeatureEnabled: updatedBusiness.collectionsFeatureEnabled,
        customMenuEnabled: updatedBusiness.customMenuEnabled,
        customFilteringEnabled: updatedBusiness.customFilteringEnabled
      }
    })
  } catch (error) {
    console.error('Error updating custom features:', error)
    return NextResponse.json(
      { error: 'Failed to update custom features' },
      { status: 500 }
    )
  }
}
