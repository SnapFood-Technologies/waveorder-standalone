// app/api/admin/stores/[businessId]/categories/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { checkBusinessAccess } from '@/lib/api-helpers'
import { canAddCategory, getPlanLimits } from '@/lib/stripe'


export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ businessId: string }> }
) {
  try {
    const { businessId } = await params
    const { searchParams } = new URL(request.url)
    
    // Query parameters for lightweight mode and pagination
    const lightweight = searchParams.get('lightweight') === 'true'
    const forServices = searchParams.get('forServices') === 'true' // For SALON/SERVICES: count services only
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '500')

    const access = await checkBusinessAccess(businessId)
    
    if (!access.authorized) {
      return NextResponse.json({ message: access.error }, { status: access.status })
    }

    // Get connected businesses for this business
    const business = await prisma.business.findUnique({
      where: { id: businessId },
      select: { connectedBusinesses: true }
    })

    const businessFilter = {
      OR: [
        { businessId: businessId },
        { businessId: { in: business?.connectedBusinesses || [] } }
      ]
    }

    // LIGHTWEIGHT MODE: For dropdowns (product form, filters) - fast query
    if (lightweight) {
      const categories = await prisma.category.findMany({
        where: businessFilter,
        select: {
          id: true,
          name: true,
          nameAl: true,
          nameEl: true,
          parentId: true,
          isActive: true,
          sortOrder: true
        },
        orderBy: [
          { parentId: 'asc' },
          { sortOrder: 'asc' }
        ]
      })
      
      return NextResponse.json({ categories })
    }

    // FULL MODE: For categories management screen - paginate by PARENT categories
    // This ensures each parent comes with ALL its children (hierarchy intact)
    const skip = (page - 1) * limit
    
    // First, get paginated PARENT categories only (no parentId)
    const parentFilter = { ...businessFilter, parentId: null }
    
    const [parentCategories, totalParents] = await Promise.all([
      prisma.category.findMany({
        where: parentFilter,
        include: {
          children: {
            include: {
              _count: {
                select: { children: true }
              },
              business: { select: { id: true, name: true } }
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
        orderBy: { sortOrder: 'asc' },
        skip,
        take: limit
      }),
      prisma.category.count({ where: parentFilter })
    ])
    
    // Flatten: parents + their children for the response
    const categories: any[] = []
    for (const parent of parentCategories) {
      categories.push({
        ...parent,
        parent: null // Parent categories have no parent
      })
      // Add children with parent reference
      for (const child of parent.children || []) {
        categories.push({
          ...child,
          parentId: parent.id,
          parent: {
            id: parent.id,
            name: parent.name,
            nameAl: parent.nameAl,
            nameEl: parent.nameEl
          },
          children: [], // Children don't have children (2-level hierarchy)
          _count: {
            products: 0, // Will be filled below
            children: child._count?.children || 0
          }
        })
      }
    }
    
    const total = totalParents // Pagination is by parent count

    // Get product counts for all categories in a single query (instead of N+1 queries)
    // Use try-catch for groupBy as MongoDB can sometimes have issues with it
    let categoryProductCounts = new Map<string, number>()
    
    try {
      const productCountWhere: any = {
        ...businessFilter,
        categoryId: { not: null }
      }
      if (forServices) productCountWhere.isService = true
      
      const productCounts = await prisma.product.groupBy({
        by: ['categoryId'],
        where: productCountWhere,
        _count: { id: true }
      })
      
      // Convert to Map for O(1) lookup
      for (const item of productCounts) {
        if (item.categoryId) {
          categoryProductCounts.set(item.categoryId, item._count.id)
        }
      }
    } catch (groupByError) {
      // Fallback: If groupBy fails, get counts individually (slower but safer)
      console.error('groupBy failed, using fallback:', groupByError)
      for (const category of categories) {
        const countWhere: any = { ...businessFilter, categoryId: category.id }
        if (forServices) countWhere.isService = true
        const count = await prisma.product.count({ where: countWhere })
        categoryProductCounts.set(category.id, count)
      }
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
    const totalCountWhere: any = { ...businessFilter }
    if (forServices) totalCountWhere.isService = true
    const totalProducts = await prisma.product.count({
      where: totalCountWhere
    })

    return NextResponse.json({ 
      categories: categoriesWithTotalCounts,
      totalProducts, // Add total products count to avoid frontend double-counting
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
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

    // Get business owner's plan to check category limit
    const businessOwner = await prisma.businessUser.findFirst({
      where: { businessId, role: 'OWNER' },
      include: { user: { select: { plan: true } } }
    })
    
    const userPlan = (businessOwner?.user?.plan as 'STARTER' | 'PRO' | 'BUSINESS') || 'STARTER'
    const planLimits = getPlanLimits(userPlan)
    
    // Count current categories for this business
    const currentCategoryCount = await prisma.category.count({
      where: { businessId }
    })
    
    // Check if user can add more categories
    if (!canAddCategory(userPlan, currentCategoryCount)) {
      return NextResponse.json({ 
        message: `Category limit reached. Your ${userPlan} plan allows up to ${planLimits.categories} categories. Please upgrade to add more categories.`,
        code: 'CATEGORY_LIMIT_REACHED',
        currentCount: currentCategoryCount,
        limit: planLimits.categories,
        plan: userPlan
      }, { status: 403 })
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
        nameEl: categoryData.nameEl || null,
        description: categoryData.description || null,
        descriptionAl: categoryData.descriptionAl || null,
        descriptionEl: categoryData.descriptionEl || null,
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
            nameAl: true,
            nameEl: true
          }
        },
        children: {
          select: {
            id: true,
            name: true,
            nameAl: true,
            nameEl: true,
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
