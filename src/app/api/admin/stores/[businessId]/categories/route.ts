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

    // Get connected businesses for this business
    const business = await prisma.business.findUnique({
      where: { id: businessId },
      select: { connectedBusinesses: true }
    })

    const categories = await prisma.category.findMany({
      where: {
        OR: [
          { businessId: businessId },
          { businessId: { in: business?.connectedBusinesses || [] } }
        ]
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
            children: true
          }
        },
        business: { select: { id: true, name: true } }
      },
      orderBy: [
        { parentId: 'asc' },
        { sortOrder: 'asc' }
      ]
    })

    // Get product counts for each category (with business filtering like groups/collections/brands)
    const categoryProductCounts = new Map<string, number>()
    for (const category of categories) {
      const productCount = await prisma.product.count({
        where: {
          OR: [
            { businessId: businessId },
            { businessId: { in: business?.connectedBusinesses || [] } }
          ],
          categoryId: category.id
        }
      })
      categoryProductCounts.set(category.id, productCount)
    }
    
    // For each parent category, calculate total products (direct + children)
    const categoriesWithTotalCounts = categories.map(category => {
      const directProductCount = categoryProductCounts.get(category.id) || 0
      
      if (!category.parentId && category._count.children > 0) {
        // This is a parent category with children - calculate total products
        let totalProducts = directProductCount // Start with direct products
        
        // Add products from all child categories
        for (const child of category.children || []) {
          const childProductCount = categoryProductCounts.get(child.id) || 0
          totalProducts += childProductCount
        }
        
        return {
          ...category,
          _count: {
            products: totalProducts, // Total count (direct + children)
            children: category._count.children
          }
        }
      }
      
      return {
        ...category,
        _count: {
          products: directProductCount, // Direct count only
          children: category._count.children
        }
      }
    })

    // Get total unique products count (to avoid double counting from summing categories)
    const totalProducts = await prisma.product.count({
      where: {
        OR: [
          { businessId: businessId },
          { businessId: { in: business?.connectedBusinesses || [] } }
        ]
      }
    })

    return NextResponse.json({ 
      categories: categoriesWithTotalCounts,
      totalProducts // Add total products count to avoid frontend double-counting
    })

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