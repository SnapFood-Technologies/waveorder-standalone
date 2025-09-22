// app/api/admin/stores/[businessId]/products/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { PrismaClient } from '@prisma/client'
import { authOptions } from '@/lib/auth'

const prisma = new PrismaClient()

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ businessId: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
    }

    const { businessId } = await params
    const { searchParams } = new URL(request.url)
    
    // Get query parameters
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '12')
    const search = searchParams.get('search') || ''
    const category = searchParams.get('category') || ''
    const status = searchParams.get('status') || 'all'
    const skip = (page - 1) * limit

    // Verify user has access to business
    const business = await prisma.business.findFirst({
      where: {
        id: businessId,
        users: {
          some: {
            user: {
              email: session.user.email
            }
          }
        }
      }
    })

    if (!business) {
      return NextResponse.json({ message: 'Business not found' }, { status: 404 })
    }

    // Build where clause for filtering
    const whereClause: any = {
      businessId
    }

    // Add search filter
    if (search) {
      whereClause.OR = [
        {
          name: {
            contains: search,
            mode: 'insensitive'
          }
        },
        {
          description: {
            contains: search,
            mode: 'insensitive'
          }
        },
        {
          sku: {
            contains: search,
            mode: 'insensitive'
          }
        }
      ]
    }

    // Add category filter
    if (category) {
      whereClause.categoryId = category
    }

    // Add status filter
    if (status === 'active') {
      whereClause.isActive = true
    } else if (status === 'inactive') {
      whereClause.isActive = false
    } else if (status === 'low-stock') {
      whereClause.AND = [
        { trackInventory: true },
        { lowStockAlert: { not: null } },
        {
          OR: [
            { stock: { lte: { lowStockAlert: true } } }
          ]
        }
      ]
      // For low stock, we need a more complex query
      whereClause.trackInventory = true
      whereClause.lowStockAlert = { not: null }
    }

    // Get total count for pagination
    let total = 0
    
    if (status === 'low-stock') {
      // Special handling for low stock filter
      const lowStockProducts = await prisma.product.findMany({
        where: {
          businessId,
          trackInventory: true,
          lowStockAlert: { not: null },
          ...(search && {
            OR: [
              { name: { contains: search, mode: 'insensitive' } },
              { description: { contains: search, mode: 'insensitive' } },
              { sku: { contains: search, mode: 'insensitive' } }
            ]
          }),
          ...(category && { categoryId: category })
        },
        select: { id: true, stock: true, lowStockAlert: true }
      })
      
      // Filter where stock <= lowStockAlert
      const filteredProducts = lowStockProducts.filter(p => 
        p.lowStockAlert && p.stock <= p.lowStockAlert
      )
      total = filteredProducts.length
    } else {
      total = await prisma.product.count({
        where: whereClause
      })
    }

    // Get products with pagination
    let products = []
    
    if (status === 'low-stock') {
      // For low stock, get all matching products first, then filter and paginate
      const allProducts = await prisma.product.findMany({
        where: {
          businessId,
          trackInventory: true,
          lowStockAlert: { not: null },
          ...(search && {
            OR: [
              { name: { contains: search, mode: 'insensitive' } },
              { description: { contains: search, mode: 'insensitive' } },
              { sku: { contains: search, mode: 'insensitive' } }
            ]
          }),
          ...(category && { categoryId: category })
        },
        include: {
          category: {
            select: {
              id: true,
              name: true
            }
          },
          variants: true,
          modifiers: true
        },
        orderBy: { createdAt: 'desc' }
      })
      
      // Filter where stock <= lowStockAlert and apply pagination
      const filteredProducts = allProducts.filter(p => 
        p.lowStockAlert && p.stock <= p.lowStockAlert
      )
      
      products = filteredProducts.slice(skip, skip + limit)
    } else {
      products = await prisma.product.findMany({
        where: whereClause,
        include: {
          category: {
            select: {
              id: true,
              name: true
            }
          },
          variants: true,
          modifiers: true
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit
      })
    }

    // Calculate pagination info
    const pages = Math.ceil(total / limit)

    return NextResponse.json({
      products,
      pagination: {
        page,
        limit,
        total,
        pages
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
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
    }

    const { businessId } = await params
    const productData = await request.json()

    // Verify user has access to business
    const business = await prisma.business.findFirst({
      where: {
        id: businessId,
        users: {
          some: {
            user: {
              email: session.user.email
            }
          }
        }
      }
    })

    if (!business) {
      return NextResponse.json({ message: 'Business not found' }, { status: 404 })
    }

    // Create product with variants and modifiers
    const product = await prisma.product.create({
      data: {
        name: productData.name,
        description: productData.description || null,
        images: productData.images || [],
        price: productData.price,
        originalPrice: productData.originalPrice || null,
        sku: productData.sku || null,
        stock: productData.trackInventory ? productData.stock : 0,
        trackInventory: productData.trackInventory,
        lowStockAlert: productData.lowStockAlert || null,
        isActive: productData.isActive,
        featured: productData.featured,
        metaTitle: productData.metaTitle || null,
        metaDescription: productData.metaDescription || null,
        businessId,
        categoryId: productData.categoryId,
        variants: {
          create: productData.variants?.map((variant: any) => ({
            name: variant.name,
            price: variant.price,
            stock: variant.stock || 0,
            sku: variant.sku || null
          })) || []
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

    // Create inventory activity if tracking inventory
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

    return NextResponse.json({ product })

  } catch (error) {
    console.error('Error creating product:', error)
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 })
  }
}