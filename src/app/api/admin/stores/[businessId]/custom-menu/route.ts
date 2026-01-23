import { NextRequest, NextResponse } from 'next/server'
import { checkBusinessAccess } from '@/lib/api-helpers'
import { checkFeatureAccess } from '@/lib/feature-access'
import { prisma } from '@/lib/prisma'
import { v4 as uuidv4 } from 'uuid'

// GET - Get all custom menu items with available entities
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

    // Check if custom menu feature is enabled
    const featureAccess = await checkFeatureAccess(businessId, 'customMenu')
    if (!featureAccess.authorized) {
      return NextResponse.json({ message: featureAccess.error }, { status: featureAccess.status })
    }

    // Get business with custom menu items
    const business = await prisma.business.findUnique({
      where: { id: businessId },
      select: {
        customMenuItems: true
      }
    })

    const menuItems = (business?.customMenuItems as any[]) || []

    // Fetch available entities for dropdowns
    const [groups, collections, categories] = await Promise.all([
      prisma.group.findMany({
        where: { businessId, isActive: true },
        select: { id: true, name: true, nameAl: true },
        orderBy: { sortOrder: 'asc' }
      }),
      prisma.collection.findMany({
        where: { businessId, isActive: true },
        select: { id: true, name: true, nameAl: true },
        orderBy: { sortOrder: 'asc' }
      }),
      prisma.category.findMany({
        where: { businessId, isActive: true },
        select: { id: true, name: true, nameAl: true, parentId: true },
        orderBy: { sortOrder: 'asc' }
      })
    ])

    // Populate target entity details for each menu item
    const menuItemsWithTargets = menuItems.map((item: any) => {
      let target = null
      
      if (item.type === 'group' && item.targetId) {
        target = groups.find(g => g.id === item.targetId)
      } else if (item.type === 'collection' && item.targetId) {
        target = collections.find(c => c.id === item.targetId)
      } else if (item.type === 'category' && item.targetId) {
        target = categories.find(c => c.id === item.targetId)
      }
      
      return { ...item, target }
    })

    return NextResponse.json({
      menuItems: menuItemsWithTargets,
      availableGroups: groups,
      availableCollections: collections,
      availableCategories: categories
    })

  } catch (error) {
    console.error('Error fetching custom menu:', error)
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 })
  }
}

// POST - Create a new menu item
export async function POST(
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
    const { type, targetId, name, nameAl, url } = body

    // Validate type
    if (!['group', 'collection', 'category', 'link'].includes(type)) {
      return NextResponse.json(
        { message: 'Invalid menu item type' },
        { status: 400 }
      )
    }

    // Validate required fields based on type
    if (type === 'link') {
      if (!name || !url) {
        return NextResponse.json(
          { message: 'Name and URL are required for custom links' },
          { status: 400 }
        )
      }
    } else {
      if (!targetId) {
        return NextResponse.json(
          { message: 'Target ID is required' },
          { status: 400 }
        )
      }

      // Fetch target entity to auto-populate names
      let targetEntity: any = null
      
      if (type === 'group') {
        targetEntity = await prisma.group.findFirst({
          where: { id: targetId, businessId },
          select: { name: true, nameAl: true }
        })
      } else if (type === 'collection') {
        targetEntity = await prisma.collection.findFirst({
          where: { id: targetId, businessId },
          select: { name: true, nameAl: true }
        })
      } else if (type === 'category') {
        targetEntity = await prisma.category.findFirst({
          where: { id: targetId, businessId },
          select: { name: true, nameAl: true }
        })
      }

      if (!targetEntity) {
        return NextResponse.json(
          { message: 'Target entity not found' },
          { status: 404 }
        )
      }
    }

    // Get current menu items
    const business = await prisma.business.findUnique({
      where: { id: businessId },
      select: { customMenuItems: true }
    })

    const currentMenuItems = (business?.customMenuItems as any[]) || []

    // Determine sortOrder (last + 1)
    const maxSortOrder = currentMenuItems.length > 0
      ? Math.max(...currentMenuItems.map((item: any) => item.sortOrder || 0))
      : -1

    // Create new menu item
    let newMenuItem: any = {
      id: uuidv4(),
      type,
      sortOrder: maxSortOrder + 1,
      isActive: true
    }

    if (type === 'link') {
      newMenuItem.name = name
      newMenuItem.nameAl = nameAl || null
      newMenuItem.url = url
    } else {
      // Auto-populate from target entity
      const targetEntity: any = type === 'group'
        ? await prisma.group.findFirst({ where: { id: targetId, businessId }, select: { name: true, nameAl: true } })
        : type === 'collection'
        ? await prisma.collection.findFirst({ where: { id: targetId, businessId }, select: { name: true, nameAl: true } })
        : await prisma.category.findFirst({ where: { id: targetId, businessId }, select: { name: true, nameAl: true } })

      newMenuItem.name = targetEntity?.name || 'Unnamed'
      newMenuItem.nameAl = targetEntity?.nameAl || null
      newMenuItem.targetId = targetId
    }

    // Update business with new menu item
    await prisma.business.update({
      where: { id: businessId },
      data: {
        customMenuItems: [...currentMenuItems, newMenuItem]
      }
    })

    return NextResponse.json({ menuItem: newMenuItem }, { status: 201 })

  } catch (error) {
    console.error('Error creating menu item:', error)
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 })
  }
}
