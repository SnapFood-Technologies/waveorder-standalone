import { NextRequest, NextResponse } from 'next/server'
import { checkBusinessAccess } from '@/lib/api-helpers'
import { checkFeatureAccess } from '@/lib/feature-access'
import { prisma } from '@/lib/prisma'

// GET - Get a single group
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ businessId: string; groupId: string }> }
) {
  try {
    const { businessId, groupId } = await params

    const access = await checkBusinessAccess(businessId)
    
    if (!access.authorized) {
      return NextResponse.json({ message: access.error }, { status: access.status })
    }

    // Check if groups feature is enabled
    const featureAccess = await checkFeatureAccess(businessId, 'groups')
    if (!featureAccess.authorized) {
      return NextResponse.json({ message: featureAccess.error }, { status: featureAccess.status })
    }

    const group = await prisma.group.findFirst({
      where: {
        id: groupId,
        businessId
      }
    })

    if (!group) {
      return NextResponse.json({ message: 'Group not found' }, { status: 404 })
    }

    // Get product count
    const productCount = await prisma.product.count({
      where: {
        businessId,
        groupIds: {
          has: group.id
        }
      }
    })

    return NextResponse.json({ 
      group: {
        ...group,
        productCount
      }
    })

  } catch (error) {
    console.error('Error fetching group:', error)
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 })
  }
}

// PUT - Update a group
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ businessId: string; groupId: string }> }
) {
  try {
    const { businessId, groupId } = await params

    const access = await checkBusinessAccess(businessId)
    
    if (!access.authorized) {
      return NextResponse.json({ message: access.error }, { status: access.status })
    }

    // Check if groups feature is enabled
    const featureAccess = await checkFeatureAccess(businessId, 'groups')
    if (!featureAccess.authorized) {
      return NextResponse.json({ message: featureAccess.error }, { status: featureAccess.status })
    }

    const body = await request.json()
    const { name, nameAl, description, sortOrder, isActive, metadata } = body

    // Check if group exists
    const existingGroup = await prisma.group.findFirst({
      where: {
        id: groupId,
        businessId
      }
    })

    if (!existingGroup) {
      return NextResponse.json({ message: 'Group not found' }, { status: 404 })
    }

    // Check for duplicate name (excluding current group)
    if (name && name !== existingGroup.name) {
      const duplicateGroup = await prisma.group.findFirst({
        where: {
          businessId,
          name,
          id: { not: groupId }
        }
      })

      if (duplicateGroup) {
        return NextResponse.json({ message: 'A group with this name already exists' }, { status: 400 })
      }
    }

    const group = await prisma.group.update({
      where: { id: groupId },
      data: {
        name: name ?? existingGroup.name,
        nameAl: nameAl !== undefined ? nameAl : existingGroup.nameAl,
        description: description !== undefined ? description : existingGroup.description,
        sortOrder: sortOrder !== undefined ? sortOrder : existingGroup.sortOrder,
        isActive: isActive !== undefined ? isActive : existingGroup.isActive,
        metadata: metadata !== undefined ? metadata : existingGroup.metadata
      }
    })

    return NextResponse.json({ group })

  } catch (error) {
    console.error('Error updating group:', error)
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 })
  }
}

// DELETE - Delete a group
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ businessId: string; groupId: string }> }
) {
  try {
    const { businessId, groupId } = await params

    const access = await checkBusinessAccess(businessId)
    
    if (!access.authorized) {
      return NextResponse.json({ message: access.error }, { status: access.status })
    }

    // Check if groups feature is enabled
    const featureAccess = await checkFeatureAccess(businessId, 'groups')
    if (!featureAccess.authorized) {
      return NextResponse.json({ message: featureAccess.error }, { status: featureAccess.status })
    }

    // Check if group exists
    const group = await prisma.group.findFirst({
      where: {
        id: groupId,
        businessId
      }
    })

    if (!group) {
      return NextResponse.json({ message: 'Group not found' }, { status: 404 })
    }

    // Check if group has products
    const productCount = await prisma.product.count({
      where: {
        businessId,
        groupIds: {
          has: groupId
        }
      }
    })

    if (productCount > 0) {
      return NextResponse.json({ 
        message: `Cannot delete group. It has ${productCount} product(s) assigned to it. Please reassign or remove products first.` 
      }, { status: 400 })
    }

    await prisma.group.delete({
      where: { id: groupId }
    })

    return NextResponse.json({ message: 'Group deleted successfully' })

  } catch (error) {
    console.error('Error deleting group:', error)
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 })
  }
}
