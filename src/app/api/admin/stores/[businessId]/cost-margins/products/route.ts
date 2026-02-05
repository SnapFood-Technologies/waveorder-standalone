// src/app/api/admin/stores/[businessId]/cost-margins/products/route.ts
// Products list with cost price data for Cost & Margins feature
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { checkBusinessAccess } from '@/lib/api-helpers'

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

    // Check if cost price feature is enabled
    const business = await prisma.business.findUnique({
      where: { id: businessId },
      select: { showCostPrice: true, currency: true }
    })

    if (!business?.showCostPrice) {
      return NextResponse.json({
        enabled: false,
        message: 'Cost & Margins is not enabled for this business.'
      })
    }

    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search') || ''
    const category = searchParams.get('category') || ''
    const supplier = searchParams.get('supplier') || ''
    const hasCostPrice = searchParams.get('hasCostPrice') // 'true', 'false', or null for all
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '50')
    const sortBy = searchParams.get('sortBy') || 'name'
    const sortOrder = searchParams.get('sortOrder') || 'asc'

    // Build filters
    const where: any = { businessId }
    
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { sku: { contains: search, mode: 'insensitive' } },
        { supplierName: { contains: search, mode: 'insensitive' } }
      ]
    }
    
    if (category) {
      where.categoryId = category
    }
    
    if (supplier) {
      where.supplierName = { contains: supplier, mode: 'insensitive' }
    }
    
    if (hasCostPrice === 'true') {
      where.costPrice = { not: null }
    } else if (hasCostPrice === 'false') {
      where.costPrice = null
    }

    // Build sort
    const orderBy: any = {}
    if (sortBy === 'margin') {
      // Margin sorting needs special handling - we'll sort in memory
      orderBy.name = 'asc'
    } else {
      orderBy[sortBy] = sortOrder
    }

    // Fetch products with pagination
    const [products, total, categories] = await Promise.all([
      prisma.product.findMany({
        where,
        orderBy,
        skip: (page - 1) * limit,
        take: limit,
        select: {
          id: true,
          name: true,
          price: true,
          originalPrice: true,
          costPrice: true,
          supplierName: true,
          sku: true,
          stock: true,
          isActive: true,
          images: true,
          category: {
            select: {
              id: true,
              name: true
            }
          }
        }
      }),
      prisma.product.count({ where }),
      // Get unique categories for filter dropdown
      prisma.category.findMany({
        where: { businessId },
        select: { id: true, name: true },
        orderBy: { name: 'asc' }
      })
    ])

    // Get unique suppliers for filter dropdown
    const suppliersResult = await prisma.product.findMany({
      where: { 
        businessId,
        supplierName: { not: null }
      },
      select: { supplierName: true },
      distinct: ['supplierName']
    })
    const uniqueSuppliers = suppliersResult
      .map(p => p.supplierName)
      .filter((s): s is string => s !== null)
      .sort()

    // Calculate margin for each product
    const productsWithMargin = products.map(product => {
      let margin = null
      let profit = null
      
      if (product.costPrice !== null && product.price > 0) {
        margin = ((product.price - product.costPrice) / product.price) * 100
        profit = product.price - product.costPrice
      }
      
      return {
        ...product,
        margin: margin !== null ? Math.round(margin * 10) / 10 : null,
        profit: profit !== null ? Math.round(profit * 100) / 100 : null
      }
    })

    // Sort by margin if requested
    if (sortBy === 'margin') {
      productsWithMargin.sort((a, b) => {
        if (a.margin === null && b.margin === null) return 0
        if (a.margin === null) return sortOrder === 'asc' ? -1 : 1
        if (b.margin === null) return sortOrder === 'asc' ? 1 : -1
        return sortOrder === 'asc' ? a.margin - b.margin : b.margin - a.margin
      })
    }

    return NextResponse.json({
      enabled: true,
      currency: business.currency || 'EUR',
      data: {
        products: productsWithMargin,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit)
        },
        filters: {
          categories,
          suppliers: uniqueSuppliers
        }
      }
    })

  } catch (error) {
    console.error('Error fetching products for cost margins:', error)
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    )
  }
}
