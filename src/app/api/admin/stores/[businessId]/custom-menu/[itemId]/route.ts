import { NextRequest, NextResponse } from 'next/server'
import { checkBusinessAccess } from '@/lib/api-helpers'
import { checkFeatureAccess } from '@/lib/feature-access'
import { prisma } from '@/lib/prisma'

// PUT - Update a menu item
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ businessId: string; itemId: string }> }
) {
  try {
    const { businessId, itemId } = await params

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
    const { name, nameAl, url, isActive, sortOrder } = body

    // Get current menu items
    const business = await prisma.business.findUnique({
      where: { id: businessId },
      select: { customMenuItems: true }
    })

    const menuItems = (business?.customMenuItems as any[]) || []
    const itemIndex = menuItems.findIndex((item: any) => item.id === itemId)

    if (itemIndex === -1) {
      return NextResponse.json(
        { message: 'Menu item not found' },
        { status: 404 }
      )
    }

    // Update menu item
    const updatedItem = {
      ...menuItems[itemIndex],
      ...(name !== undefined && { name }),
      ...(nameAl !== undefined && { nameAl }),
      ...(url !== undefined && { url }),
      ...(isActive !== undefined && { isActive }),
      ...(sortOrder !== undefined && { sortOrder })
    }

    menuItems[itemIndex] = updatedItem

    // Save updated menu items
    await prisma.business.update({
      where: { id: businessId },
      data: {
        customMenuItems: menuItems
      }
    })

    return NextResponse.json({ menuItem: updatedItem })

  } catch (error) {
    console.error('Error updating menu item:', error)
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 })
  }
}

// DELETE - Delete a menu item
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ businessId: string; itemId: string }> }
) {
  try {
    const { businessId, itemId } = await params

    const access = await checkBusinessAccess(businessId)
    
    if (!access.authorized) {
      return NextResponse.json({ message: access.error }, { status: access.status })
    }

    // Check if custom menu feature is enabled
    const featureAccess = await checkFeatureAccess(businessId, 'customMenu')
    if (!featureAccess.authorized) {
      return NextResponse.json({ message: featureAccess.error }, { status: featureAccess.status })
    }

    // Get current menu items
    const business = await prisma.business.findUnique({
      where: { id: businessId },
      select: { customMenuItems: true }
    })

    const menuItems = (business?.customMenuItems as any[]) || []
    const filteredItems = menuItems.filter((item: any) => item.id !== itemId)

    if (filteredItems.length === menuItems.length) {
      return NextResponse.json(
        { message: 'Menu item not found' },
        { status: 404 }
      )
    }

    // Save filtered menu items
    await prisma.business.update({
      where: { id: businessId },
      data: {
        customMenuItems: filteredItems
      }
    })

    return NextResponse.json({ success: true })

  } catch (error) {
    console.error('Error deleting menu item:', error)
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 })
  }
}
