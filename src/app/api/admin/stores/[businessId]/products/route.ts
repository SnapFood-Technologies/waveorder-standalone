// app/api/admin/stores/[businessId]/products/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { checkBusinessAccess } from '@/lib/api-helpers'
import { syncProductToOmniGateway } from '@/lib/omnigateway'
import { canAddProduct, getPlanLimits } from '@/lib/stripe'


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

    const { searchParams } = new URL(request.url)
    
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '12')
    const search = searchParams.get('search') || ''
    const category = searchParams.get('category') || ''
    const status = searchParams.get('status') || 'all'
    const skip = (page - 1) * limit

    // Business filter: own business + connected businesses
    const businessFilter = {
      OR: [
        { businessId: businessId },
        { businessId: { in: business?.connectedBusinesses || [] } }
      ]
    }

    // Build where clause: combine business filter with search filter using AND
    const whereClause: any = search
      ? {
          AND: [
            businessFilter,
            {
              OR: [
                { name: { contains: search, mode: 'insensitive' } },
                { description: { contains: search, mode: 'insensitive' } },
                { sku: { contains: search, mode: 'insensitive' } }
              ]
            }
          ]
        }
      : businessFilter

    if (category) {
      whereClause.categoryId = category
    }

    if (status === 'active') {
      whereClause.isActive = true
    } else if (status === 'inactive') {
      whereClause.isActive = false
    } else if (status === 'low-stock') {
      whereClause.trackInventory = true
      whereClause.lowStockAlert = { not: null }
    }

    let total = 0
    
    if (status === 'low-stock') {
      const lowStockWhere: any = search
        ? {
            AND: [
              businessFilter,
              {
                OR: [
                  { name: { contains: search, mode: 'insensitive' } },
                  { description: { contains: search, mode: 'insensitive' } },
                  { sku: { contains: search, mode: 'insensitive' } }
                ]
              }
            ],
            trackInventory: true,
            lowStockAlert: { not: null }
          }
        : {
            ...businessFilter,
            trackInventory: true,
            lowStockAlert: { not: null }
          }

      if (category) {
        lowStockWhere.categoryId = category
      }

      const lowStockProducts = await prisma.product.findMany({
        where: lowStockWhere,
        select: { id: true, stock: true, lowStockAlert: true }
      })
      
      const filteredProducts = lowStockProducts.filter(p => 
        p.lowStockAlert && p.stock <= p.lowStockAlert
      )
      total = filteredProducts.length
    } else {
      total = await prisma.product.count({ where: whereClause })
    }

    let products = []
    
    if (status === 'low-stock') {
      const lowStockWhere: any = search
        ? {
            AND: [
              businessFilter,
              {
                OR: [
                  { name: { contains: search, mode: 'insensitive' } },
                  { description: { contains: search, mode: 'insensitive' } },
                  { sku: { contains: search, mode: 'insensitive' } }
                ]
              }
            ],
            trackInventory: true,
            lowStockAlert: { not: null }
          }
        : {
            ...businessFilter,
            trackInventory: true,
            lowStockAlert: { not: null }
          }

      if (category) {
        lowStockWhere.categoryId = category
      }

      const allProducts = await prisma.product.findMany({
        where: lowStockWhere,
        include: {
          category: { select: { id: true, name: true } },
          variants: true,
          modifiers: true,
          business: { select: { id: true, name: true } }
        },
        orderBy: { createdAt: 'desc' }
      })
      
      const filteredProducts = allProducts.filter(p => 
        p.lowStockAlert && p.stock <= p.lowStockAlert
      )
      
      products = filteredProducts.slice(skip, skip + limit)
    } else {
      products = await prisma.product.findMany({
        where: whereClause,
        include: {
          category: { select: { id: true, name: true } },
          variants: true,
          modifiers: true,
          business: { select: { id: true, name: true } }
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit
      })
    }

    const pages = Math.ceil(total / limit)

    // Get stats for all products (not filtered by current page)
    // Build stats where clause: combine business filter with search filter using AND
    const statsWhereClause: any = search
      ? {
          AND: [
            businessFilter,
            {
              OR: [
                { name: { contains: search, mode: 'insensitive' } },
                { description: { contains: search, mode: 'insensitive' } },
                { sku: { contains: search, mode: 'insensitive' } }
              ]
            }
          ]
        }
      : businessFilter
    
    if (category) {
      statsWhereClause.categoryId = category
    }

    // Get total counts for stats (only if no status filter is applied, or if status is 'all')
    const [activeCount, lowStockCount, featuredCount] = await Promise.all([
      // Active products count
      prisma.product.count({
        where: {
          ...statsWhereClause,
          isActive: true
        }
      }),
      // Low stock products count
      (async () => {
        const lowStockProducts = await prisma.product.findMany({
          where: {
            ...statsWhereClause,
            trackInventory: true,
            lowStockAlert: { not: null }
          },
          select: { id: true, stock: true, lowStockAlert: true }
        })
        return lowStockProducts.filter(p => 
          p.lowStockAlert && p.stock <= p.lowStockAlert
        ).length
      })(),
      // Featured products count
      prisma.product.count({
        where: {
          ...statsWhereClause,
          featured: true
        }
      })
    ])

    return NextResponse.json({
      products,
      pagination: {
        page,
        limit,
        total,
        pages
      },
      stats: {
        active: activeCount,
        lowStock: lowStockCount,
        featured: featuredCount
      }
    })

  } catch (error) {
    console.error('Error fetching products:', error)
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

    // Get business owner's plan to check product limit
    const businessOwner = await prisma.businessUser.findFirst({
      where: { businessId, role: 'OWNER' },
      include: { user: { select: { plan: true } } }
    })
    
    const userPlan = (businessOwner?.user?.plan as 'STARTER' | 'PRO' | 'BUSINESS') || 'STARTER'
    const planLimits = getPlanLimits(userPlan)
    
    // Count current products for this business
    const currentProductCount = await prisma.product.count({
      where: { businessId }
    })
    
    // Check if user can add more products
    if (!canAddProduct(userPlan, currentProductCount)) {
      return NextResponse.json({ 
        message: `Product limit reached. Your ${userPlan} plan allows up to ${planLimits.products} products. Please upgrade to add more products.`,
        code: 'PRODUCT_LIMIT_REACHED',
        currentCount: currentProductCount,
        limit: planLimits.products,
        plan: userPlan
      }, { status: 403 })
    }

    const productData = await request.json()

    // Parse sale dates
    let saleStartDate: Date | null = null
    let saleEndDate: Date | null = null
    
    if (productData.saleStartDate) {
      try {
        saleStartDate = new Date(productData.saleStartDate)
        if (isNaN(saleStartDate.getTime())) {
          saleStartDate = null
        }
      } catch {
        saleStartDate = null
      }
    }
    
    if (productData.saleEndDate) {
      try {
        saleEndDate = new Date(productData.saleEndDate)
        if (isNaN(saleEndDate.getTime())) {
          saleEndDate = null
        }
      } catch {
        saleEndDate = null
      }
    }

    const product = await prisma.product.create({
      data: {
        name: productData.name,
        nameAl: productData.nameAl || null,
        nameEl: productData.nameEl || null,
        description: productData.description || null,
        descriptionAl: productData.descriptionAl || null,
        descriptionEl: productData.descriptionEl || null,
        images: productData.images || [],
        price: productData.price,
        originalPrice: productData.originalPrice || null,
        saleStartDate,
        saleEndDate,
        sku: productData.sku || null,
        stock: productData.trackInventory ? productData.stock : 0,
        trackInventory: productData.trackInventory,
        lowStockAlert: productData.lowStockAlert || null,
        enableLowStockNotification: productData.enableLowStockNotification || false,
        isActive: productData.isActive,
        featured: productData.featured,
        metaTitle: productData.metaTitle || null,
        metaDescription: productData.metaDescription || null,
        businessId,
        categoryId: productData.categoryId,
        variants: {
          create: productData.variants?.map((variant: any) => {
            const metadata: any = {}
            if (variant.image) {
              metadata.image = variant.image
            }
            
            return {
              name: variant.name,
              price: variant.price,
              stock: variant.stock || 0,
              sku: variant.sku || null,
              metadata: Object.keys(metadata).length > 0 ? metadata : undefined
            }
          }) || []
        },
        modifiers: {
          create: productData.modifiers?.map((modifier: any) => ({
            name: modifier.name,
            price: modifier.price,
            required: modifier.required
          })) || []
        }
      },
      include: {
        category: true,
        variants: true,
        modifiers: true
      }
    })

    if (productData.trackInventory && productData.stock > 0) {
      await prisma.inventoryActivity.create({
        data: {
          productId: product.id,
          businessId,
          type: 'RESTOCK',
          quantity: productData.stock,
          oldStock: 0,
          newStock: productData.stock,
          reason: 'Initial stock when creating product'
        }
      })
    }

    // Sync to OmniStack Gateway (if product is linked)
    // Run in background - don't block the response
    syncProductToOmniGateway(product).catch(err => {
      console.error('[OmniGateway] Background sync failed:', err);
    });

    // TODO: Sync to ByBest Shop (if product is linked)
    // Run in background - don't block the response
    // import { syncProductToByBestShop } from '@/lib/bybestshop';
    // syncProductToByBestShop(product).catch(err => {
    //   console.error('[ByBestShop] Background sync failed:', err);
    // });

    return NextResponse.json({ product })

  } catch (error) {
    console.error('Error creating product:', error)
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 })
  }
}