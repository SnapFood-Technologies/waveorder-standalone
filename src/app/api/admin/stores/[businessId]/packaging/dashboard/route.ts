// src/app/api/admin/stores/[businessId]/packaging/dashboard/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { checkBusinessAccess } from '@/lib/api-helpers'

// GET - Fetch packaging dashboard statistics
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

    // Check if packaging tracking is enabled
    const business = await prisma.business.findUnique({
      where: { id: businessId },
      select: { packagingTrackingEnabled: true, currency: true }
    })

    if (!business?.packagingTrackingEnabled) {
      return NextResponse.json({ message: 'Packaging tracking is not enabled for this business' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const range = searchParams.get('range') || '30d' // 7d, 30d, 90d, all

    // Calculate date range
    let startDate: Date | null = null
    if (range !== 'all') {
      const days = range === '7d' ? 7 : range === '30d' ? 30 : 90
      startDate = new Date()
      startDate.setDate(startDate.getDate() - days)
    }

    // Get all packaging types
    const packagingTypes = await prisma.packagingType.findMany({
      where: { businessId, isActive: true },
      include: {
        _count: {
          select: {
            purchases: true,
            orderPackagings: true
          }
        }
      }
    })

    // Get total purchases
    const purchasesWhere: any = { businessId }
    if (startDate) {
      purchasesWhere.purchaseDate = { gte: startDate }
    }
    const totalPurchases = await prisma.packagingPurchase.count({
      where: purchasesWhere
    })

    const totalSpent = await prisma.packagingPurchase.aggregate({
      where: purchasesWhere,
      _sum: { totalCost: true }
    })

    // Get total packages used
    const orderPackagingWhere: any = { businessId }
    if (startDate) {
      orderPackagingWhere.createdAt = { gte: startDate }
    }
    const totalPackagesUsed = await prisma.orderPackaging.aggregate({
      where: orderPackagingWhere,
      _sum: { quantity: true }
    })

    // Get total cost from order packaging (manual entries)
    const totalOrderCost = await prisma.orderPackaging.aggregate({
      where: orderPackagingWhere,
      _sum: { cost: true }
    })

    // Get top suppliers
    const topSuppliers = await prisma.packagingPurchase.groupBy({
      by: ['supplier'],
      where: purchasesWhere,
      _sum: { totalCost: true },
      _count: { id: true },
      orderBy: { _sum: { totalCost: 'desc' } },
      take: 5
    })

    // Get most used packaging types
    const mostUsedTypes = await prisma.orderPackaging.groupBy({
      by: ['packagingTypeId'],
      where: orderPackagingWhere,
      _sum: { quantity: true },
      _count: { id: true },
      orderBy: { _sum: { quantity: 'desc' } },
      take: 5
    })

    // Get packaging type details for most used
    const mostUsedTypesWithDetails = await Promise.all(
      mostUsedTypes.map(async (item) => {
        const type = await prisma.packagingType.findUnique({
          where: { id: item.packagingTypeId },
          select: { id: true, name: true, unit: true }
        })
        return {
          ...item,
          packagingType: type
        }
      })
    )

    // Get recent purchases
    const recentPurchases = await prisma.packagingPurchase.findMany({
      where: purchasesWhere,
      include: {
        packagingType: {
          select: {
            id: true,
            name: true,
            unit: true
          }
        }
      },
      orderBy: { purchaseDate: 'desc' },
      take: 10
    })

    return NextResponse.json({
      stats: {
        totalPackagingTypes: packagingTypes.length,
        totalPurchases,
        totalSpent: totalSpent._sum.totalCost || 0,
        totalPackagesUsed: totalPackagesUsed._sum.quantity || 0,
        totalOrderCost: totalOrderCost._sum.cost || 0
      },
      topSuppliers: topSuppliers.map(s => ({
        supplier: s.supplier,
        totalSpent: s._sum.totalCost || 0,
        purchaseCount: s._count.id
      })),
      mostUsedTypes: mostUsedTypesWithDetails.map(t => ({
        packagingType: t.packagingType,
        quantityUsed: t._sum.quantity || 0,
        usageCount: t._count.id
      })),
      recentPurchases,
      currency: business.currency
    })

  } catch (error) {
    console.error('Error fetching packaging dashboard:', error)
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 })
  }
}
