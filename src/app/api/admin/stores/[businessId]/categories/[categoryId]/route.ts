// app/api/admin/stores/[businessId]/categories/[categoryId]/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { checkBusinessAccess } from '@/lib/api-helpers'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

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
        _count: {
          select: {
            products: true
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

    const category = await prisma.category.updateMany({
      where: {
        id: categoryId,
        businessId
      },
      data: {
        name: categoryData.name,
        description: categoryData.description || null,
        image: categoryData.image || null,
        isActive: categoryData.isActive
      }
    })

    if (category.count === 0) {
      return NextResponse.json({ message: 'Category not found' }, { status: 404 })
    }

    const updatedCategory = await prisma.category.findUnique({
      where: { id: categoryId },
      include: {
        _count: {
          select: {
            products: true
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

    const category = await prisma.category.findFirst({
      where: {
        id: categoryId,
        businessId
      },
      include: {
        _count: {
          select: {
            products: true
          }
        }
      }
    })

    if (!category) {
      return NextResponse.json({ message: 'Category not found' }, { status: 404 })
    }

    await prisma.category.delete({
      where: { id: categoryId }
    })

    return NextResponse.json({ 
      message: 'Category deleted successfully',
      deletedProducts: category._count.products
    })

  } catch (error) {
    console.error('Error deleting category:', error)
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 })
  }
}