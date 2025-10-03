// app/api/admin/stores/[businessId]/products/route.ts
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

    const { searchParams } = new URL(request.url)
    
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '12')
    const search = searchParams.get('search') || ''
    const category = searchParams.get('category') || ''
    const status = searchParams.get('status') || 'all'
    const skip = (page - 1) * limit

    const whereClause: any = {
      businessId
    }

    if (search) {
      whereClause.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
        { sku: { contains: search, mode: 'insensitive' } }
      ]
    }

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
      
      const filteredProducts = lowStockProducts.filter(p => 
        p.lowStockAlert && p.stock <= p.lowStockAlert
      )
      total = filteredProducts.length
    } else {
      total = await prisma.product.count({ where: whereClause })
    }

    let products = []
    
    if (status === 'low-stock') {
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
          category: { select: { id: true, name: true } },
          variants: true,
          modifiers: true
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
          modifiers: true
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit
      })
    }

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
    const { businessId } = await params

    const access = await checkBusinessAccess(businessId)
    
    if (!access.authorized) {
      return NextResponse.json({ message: access.error }, { status: access.status })
    }

    const productData = await request.json()

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