// src/app/api/admin/stores/[businessId]/cost-margins/route.ts
// Cost & Margins API - Overview data for costs, margins, and supplier tracking
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

    // Check if cost price feature is enabled for this business
    const business = await prisma.business.findUnique({
      where: { id: businessId },
      select: {
        id: true,
        name: true,
        showCostPrice: true,
        currency: true
      }
    })

    if (!business) {
      return NextResponse.json({ message: 'Business not found' }, { status: 404 })
    }

    // If feature is disabled, return empty response with flag
    if (!business.showCostPrice) {
      return NextResponse.json({
        enabled: false,
        message: 'Cost & Margins is not enabled for this business. Contact support to enable this feature.',
        data: null
      })
    }

    // Fetch products with cost price data
    const products = await prisma.product.findMany({
      where: { businessId },
      select: {
        id: true,
        name: true,
        price: true,
        costPrice: true,
        supplierName: true,
        stock: true,
        isActive: true
      }
    })

    // Calculate margins and statistics
    const productsWithCostPrice = products.filter(p => p.costPrice !== null)
    const productsWithSupplier = products.filter(p => p.supplierName !== null && p.supplierName !== '')

    // Group products by supplier
    const supplierMap = new Map<string, {
      products: number
      totalCost: number
      totalRevenue: number
      totalStock: number
    }>()

    for (const product of products) {
      if (product.supplierName) {
        const supplier = supplierMap.get(product.supplierName) || {
          products: 0,
          totalCost: 0,
          totalRevenue: 0,
          totalStock: 0
        }
        supplier.products++
        if (product.costPrice) {
          supplier.totalCost += product.costPrice * (product.stock || 0)
        }
        supplier.totalRevenue += product.price * (product.stock || 0)
        supplier.totalStock += product.stock || 0
        supplierMap.set(product.supplierName, supplier)
      }
    }

    const suppliers = Array.from(supplierMap.entries())
      .map(([name, data]) => ({
        name,
        productCount: data.products,
        totalInventoryCost: data.totalCost,
        totalInventoryValue: data.totalRevenue,
        totalStock: data.totalStock
      }))
      .sort((a, b) => b.productCount - a.productCount)

    // Calculate overall statistics
    let totalCostValue = 0
    let totalSellingValue = 0
    let totalPotentialProfit = 0
    let productsWithPositiveMargin = 0
    let productsWithNegativeMargin = 0
    let lowestMarginProduct = null
    let highestMarginProduct = null
    let lowestMargin = Infinity
    let highestMargin = -Infinity

    for (const product of productsWithCostPrice) {
      if (product.costPrice !== null) {
        const margin = ((product.price - product.costPrice) / product.price) * 100
        const profit = (product.price - product.costPrice) * (product.stock || 0)
        
        totalCostValue += product.costPrice * (product.stock || 0)
        totalSellingValue += product.price * (product.stock || 0)
        totalPotentialProfit += profit

        if (margin > 0) {
          productsWithPositiveMargin++
        } else if (margin < 0) {
          productsWithNegativeMargin++
        }

        if (margin < lowestMargin) {
          lowestMargin = margin
          lowestMarginProduct = { ...product, margin }
        }
        if (margin > highestMargin) {
          highestMargin = margin
          highestMarginProduct = { ...product, margin }
        }
      }
    }

    const averageMargin = productsWithCostPrice.length > 0
      ? productsWithCostPrice.reduce((sum, p) => {
          if (p.costPrice !== null) {
            return sum + ((p.price - p.costPrice) / p.price) * 100
          }
          return sum
        }, 0) / productsWithCostPrice.length
      : 0

    // Get recent supplier payments summary
    const thisMonthStart = new Date()
    thisMonthStart.setDate(1)
    thisMonthStart.setHours(0, 0, 0, 0)

    const [totalPayments, thisMonthPayments] = await Promise.all([
      prisma.supplierPayment.aggregate({
        where: { businessId },
        _sum: { amount: true },
        _count: true
      }),
      prisma.supplierPayment.aggregate({
        where: {
          businessId,
          paidAt: { gte: thisMonthStart }
        },
        _sum: { amount: true },
        _count: true
      })
    ])

    return NextResponse.json({
      enabled: true,
      currency: business.currency || 'EUR',
      data: {
        summary: {
          totalProducts: products.length,
          productsWithCostPrice: productsWithCostPrice.length,
          productsWithoutCostPrice: products.length - productsWithCostPrice.length,
          productsWithSupplier: productsWithSupplier.length,
          uniqueSuppliers: suppliers.length,
          averageMargin: Math.round(averageMargin * 10) / 10,
          totalInventoryCost: totalCostValue,
          totalInventoryValue: totalSellingValue,
          totalPotentialProfit: totalPotentialProfit,
          productsWithPositiveMargin,
          productsWithNegativeMargin
        },
        margins: {
          lowest: lowestMarginProduct ? {
            productId: lowestMarginProduct.id,
            productName: lowestMarginProduct.name,
            margin: Math.round(lowestMarginProduct.margin * 10) / 10,
            costPrice: lowestMarginProduct.costPrice,
            sellingPrice: lowestMarginProduct.price
          } : null,
          highest: highestMarginProduct ? {
            productId: highestMarginProduct.id,
            productName: highestMarginProduct.name,
            margin: Math.round(highestMarginProduct.margin * 10) / 10,
            costPrice: highestMarginProduct.costPrice,
            sellingPrice: highestMarginProduct.price
          } : null
        },
        suppliers,
        payments: {
          allTime: {
            count: totalPayments._count,
            total: totalPayments._sum.amount || 0
          },
          thisMonth: {
            count: thisMonthPayments._count,
            total: thisMonthPayments._sum.amount || 0
          }
        }
      }
    })

  } catch (error) {
    console.error('Error fetching cost & margins:', error)
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    )
  }
}

// PATCH - Update product cost prices (single or bulk)
export async function PATCH(
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
      select: { showCostPrice: true }
    })

    if (!business?.showCostPrice) {
      return NextResponse.json({
        enabled: false,
        message: 'Cost & Margins is not enabled for this business.'
      }, { status: 403 })
    }

    const body = await request.json()
    const { updates } = body // Array of { productId, costPrice, supplierName }

    if (!updates || !Array.isArray(updates)) {
      return NextResponse.json({ message: 'Updates array is required' }, { status: 400 })
    }

    // Validate all products belong to this business
    const productIds = updates.map((u: any) => u.productId)
    const products = await prisma.product.findMany({
      where: {
        id: { in: productIds },
        businessId
      },
      select: { id: true }
    })

    const validProductIds = new Set(products.map(p => p.id))
    const invalidProducts = productIds.filter((id: string) => !validProductIds.has(id))

    if (invalidProducts.length > 0) {
      return NextResponse.json({
        message: `Some products not found or don't belong to this business`,
        invalidProducts
      }, { status: 400 })
    }

    // Update products
    const updateResults = await Promise.all(
      updates.map(async (update: { productId: string; costPrice?: number | null; supplierName?: string | null }) => {
        const updateData: any = {}
        
        if (update.costPrice !== undefined) {
          updateData.costPrice = update.costPrice === null ? null : Number(update.costPrice)
        }
        
        if (update.supplierName !== undefined) {
          updateData.supplierName = update.supplierName || null
        }

        return prisma.product.update({
          where: { id: update.productId },
          data: updateData,
          select: {
            id: true,
            name: true,
            price: true,
            costPrice: true,
            supplierName: true
          }
        })
      })
    )

    return NextResponse.json({
      success: true,
      message: `Updated ${updateResults.length} product(s)`,
      products: updateResults
    })

  } catch (error) {
    console.error('Error updating product costs:', error)
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    )
  }
}
