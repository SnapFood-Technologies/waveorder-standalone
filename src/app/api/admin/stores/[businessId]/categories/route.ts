// app/api/admin/stores/[businessId]/categories/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { checkBusinessAccess } from '@/lib/api-helpers'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

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

    const categories = await prisma.category.findMany({
      where: { businessId },
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
      },
      orderBy: [
        { parentId: 'asc' },
        { sortOrder: 'asc' }
      ]
    })

    return NextResponse.json({ categories })

  } catch (error) {
    console.error('Error fetching categories:', error)
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 })
  }
}

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

    const categoryData = await request.json()

    // Validate parentId if provided
    if (categoryData.parentId) {
      const parentCategory = await prisma.category.findFirst({
        where: {
          id: categoryData.parentId,
          businessId // Ensure parent belongs to same business
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
    }

    // Get sort order for the hierarchy level
    const lastCategory = await prisma.category.findFirst({
      where: { 
        businessId,
        parentId: categoryData.parentId || null // Same parent level
      },
      orderBy: { sortOrder: 'desc' }
    })

    const nextSortOrder = (lastCategory?.sortOrder || 0) + 1

    const category = await prisma.category.create({
      data: {
        name: categoryData.name,
        nameAl: categoryData.nameAl || null,
        description: categoryData.description || null,
        descriptionAl: categoryData.descriptionAl || null,
        parentId: categoryData.parentId || null,
        hideParentInStorefront: categoryData.hideParentInStorefront ?? false,
        image: categoryData.image || null,
        isActive: categoryData.isActive ?? true,
        sortOrder: nextSortOrder,
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

    return NextResponse.json({ category })

  } catch (error) {
    console.error('Error creating category:', error)
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 })
  }
}