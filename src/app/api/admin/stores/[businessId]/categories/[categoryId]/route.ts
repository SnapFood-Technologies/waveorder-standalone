// app/api/admin/stores/[businessId]/categories/[categoryId]/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { checkBusinessAccess } from '@/lib/api-helpers'


export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ businessId: string; categoryId: string }> }
) {
  try {
    const { businessId, categoryId } = await params

    const access = await checkBusinessAccess(businessId)
    
    if (!access.authorized) {
      return NextResponse.json({ message: access.error }, { status: access.status })
    }

    const category = await prisma.category.findFirst({
      where: {
        id: categoryId,
        businessId
      },
      include: {
        parent: {
          select: {
            id: true,
            name: true,
            nameAl: true
          }
        },
        children: {
          select: {
            id: true,
            name: true,
            nameAl: true,
            sortOrder: true
          },
          orderBy: { sortOrder: 'asc' }
        },
        _count: {
          select: {
            products: true,
            children: true
          }
        }
      }
    })

    if (!category) {
      return NextResponse.json({ message: 'Category not found' }, { status: 404 })
    }

    return NextResponse.json({ category })

  } catch (error) {
    console.error('Error fetching category:', error)
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 })
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ businessId: string; categoryId: string }> }
) {
  try {
    const { businessId, categoryId } = await params

    const access = await checkBusinessAccess(businessId)
    
    if (!access.authorized) {
      return NextResponse.json({ message: access.error }, { status: access.status })
    }

    const categoryData = await request.json()

    // Validate parentId if being changed
    if (categoryData.parentId !== undefined) {
      // Prevent category from being its own parent
      if (categoryData.parentId === categoryId) {
        return NextResponse.json(
          { message: 'Category cannot be its own parent' },
          { status: 400 }
        )
      }

      if (categoryData.parentId) {
        // Check if parent exists and belongs to same business
        const parentCategory = await prisma.category.findFirst({
          where: {
            id: categoryData.parentId,
            businessId
          }
        })

        if (!parentCategory) {
          return NextResponse.json(
            { message: 'Parent category not found or does not belong to this business' },
            { status: 400 }
          )
        }

        // Prevent circular reference: parent can't be a child
        if (parentCategory.parentId) {
          return NextResponse.json(
            { message: 'Cannot set a subcategory as a parent' },
            { status: 400 }
          )
        }

        // Prevent setting parent to one of its own descendants
        const isDescendant = await prisma.category.findFirst({
          where: {
            id: categoryData.parentId,
            parentId: categoryId
          }
        })

        if (isDescendant) {
          return NextResponse.json(
            { message: 'Cannot set a descendant category as parent' },
            { status: 400 }
          )
        }
      }
    }

    // Build update data object
    const updateData: any = {}
    if (categoryData.name !== undefined) updateData.name = categoryData.name
    if (categoryData.nameAl !== undefined) updateData.nameAl = categoryData.nameAl || null
    if (categoryData.description !== undefined) updateData.description = categoryData.description || null
    if (categoryData.descriptionAl !== undefined) updateData.descriptionAl = categoryData.descriptionAl || null
    if (categoryData.parentId !== undefined) updateData.parentId = categoryData.parentId || null
    if (categoryData.hideParentInStorefront !== undefined) updateData.hideParentInStorefront = categoryData.hideParentInStorefront
    if (categoryData.image !== undefined) updateData.image = categoryData.image || null
    if (categoryData.isActive !== undefined) updateData.isActive = categoryData.isActive

    const category = await prisma.category.updateMany({
      where: {
        id: categoryId,
        businessId
      },
      data: updateData
    })

    if (category.count === 0) {
      return NextResponse.json({ message: 'Category not found' }, { status: 404 })
    }

    const updatedCategory = await prisma.category.findUnique({
      where: { id: categoryId },
      include: {
        parent: {
          select: {
            id: true,
            name: true,
            nameAl: true
          }
        },
        children: {
          select: {
            id: true,
            name: true,
            nameAl: true,
            sortOrder: true
          },
          orderBy: { sortOrder: 'asc' }
        },
        _count: {
          select: {
            products: true,
            children: true
          }
        }
      }
    })

    return NextResponse.json({ category: updatedCategory })

  } catch (error) {
    console.error('Error updating category:', error)
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 })
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ businessId: string; categoryId: string }> }
) {
  try {
    const { businessId, categoryId } = await params

    const access = await checkBusinessAccess(businessId)
    
    if (!access.authorized) {
      return NextResponse.json({ message: access.error }, { status: access.status })
    }

    const updates = await request.json()

    const category = await prisma.category.updateMany({
      where: {
        id: categoryId,
        businessId
      },
      data: updates
    })

    if (category.count === 0) {
      return NextResponse.json({ message: 'Category not found' }, { status: 404 })
    }

    return NextResponse.json({ message: 'Category updated successfully' })

  } catch (error) {
    console.error('Error updating category:', error)
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ businessId: string; categoryId: string }> }
) {
  try {
    const { businessId, categoryId } = await params

    const access = await checkBusinessAccess(businessId)
    
    if (!access.authorized) {
      return NextResponse.json({ message: access.error }, { status: access.status })
    }

    // Get request body for confirmation
    let requestBody = null
    try {
      requestBody = await request.json()
    } catch {
      // No body provided - that's okay for categories without children
    }

    const category = await prisma.category.findFirst({
      where: {
        id: categoryId,
        businessId
      },
      include: {
        _count: {
          select: {
            products: true,
            children: true
          }
        }
      }
    })

    if (!category) {
      return NextResponse.json({ message: 'Category not found' }, { status: 404 })
    }

    // Check if category has children - requires confirmation
    if (category._count.children > 0) {
      // Require confirmation text
      if (!requestBody || !requestBody.confirmation || requestBody.confirmation !== 'DELETE') {
        return NextResponse.json(
          { 
            message: 'Confirmation required. Please type "DELETE" to confirm deletion of category with subcategories.',
            requiresConfirmation: true,
            childrenCount: category._count.children
          },
          { status: 400 }
        )
      }

      // Since we use NoAction onDelete for self-relations, we need to delete children first
      // Delete all children categories first (this will also delete their products via Product -> Category relation)
      await prisma.category.deleteMany({
        where: { 
          parentId: categoryId,
          businessId
        }
      })
    }

    // Now delete the parent category
    await prisma.category.delete({
      where: { id: categoryId }
    })

    return NextResponse.json({ 
      message: 'Category deleted successfully',
      deletedProducts: category._count.products,
      deletedChildren: category._count.children
    })

  } catch (error) {
    console.error('Error deleting category:', error)
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 })
  }
}