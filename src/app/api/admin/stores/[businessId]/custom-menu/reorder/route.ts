import { NextRequest, NextResponse } from 'next/server'
import { checkBusinessAccess } from '@/lib/api-helpers'
import { checkFeatureAccess } from '@/lib/feature-access'
import { prisma } from '@/lib/prisma'

// PATCH - Reorder menu items
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

    // Check if custom menu feature is enabled
    const featureAccess = await checkFeatureAccess(businessId, 'customMenu')
    if (!featureAccess.authorized) {
      return NextResponse.json({ message: featureAccess.error }, { status: featureAccess.status })
    }

    const body = await request.json()
    const { itemIds } = body

    if (!Array.isArray(itemIds)) {
      return NextResponse.json(
        { message: 'itemIds must be an array' },
        { status: 400 }
      )
    }

    // Get current menu items
    const business = await prisma.business.findUnique({
      where: { id: businessId },
      select: { customMenuItems: true }
    })

    const menuItems = (business?.customMenuItems as any[]) || []

    // Update sortOrder based on array position
    const reorderedItems = itemIds.map((id, index) => {
      const item = menuItems.find((item: any) => item.id === id)
      if (!item) return null
      return { ...item, sortOrder: index }
    }).filter(Boolean)

    // Save reordered menu items
    await prisma.business.update({
      where: { id: businessId },
      data: {
        customMenuItems: reorderedItems
      }
    })

    return NextResponse.json({ menuItems: reorderedItems })

  } catch (error) {
    console.error('Error reordering menu items:', error)
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 })
  }
}
