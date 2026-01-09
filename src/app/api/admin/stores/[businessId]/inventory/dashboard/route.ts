// app/api/admin/stores/[businessId]/inventory/dashboard/route.ts
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
    const range = searchParams.get('range') || '7d'

    const now = new Date()
    const daysBack = range === '1d' ? 1 : range === '7d' ? 7 : range === '30d' ? 30 : 90
    const startDate = new Date(now.getTime() - (daysBack * 24 * 60 * 60 * 1000))

    // Fetch all products for inventory value calculation (matching other systems)
    // But only show trackInventory products for other metrics
    const allProducts = await prisma.product.findMany({
      where: {
        businessId,
        isActive: true
      },
      include: {
        category: {
          select: {
            name: true
          }
        }
      }
    })

    // Products with inventory tracking enabled (for low stock alerts, etc.)
    const trackedProducts = allProducts.filter(p => p.trackInventory)

    const totalProducts = trackedProducts.length
    // Calculate inventory value for ALL active products (regardless of trackInventory setting)
    // This matches other systems that include all products in inventory value
    const totalValue = allProducts.reduce((sum, product) => sum + (product.stock * product.price), 0)
    const lowStockProducts = trackedProducts.filter(p => 
      p.lowStockAlert && p.stock <= p.lowStockAlert && p.stock > 0
    ).length
    const outOfStockProducts = trackedProducts.filter(p => p.stock === 0).length

    const lowStockAlerts = trackedProducts
      .filter(p => p.lowStockAlert && p.stock <= p.lowStockAlert)
      .sort((a, b) => a.stock - b.stock)
      .slice(0, 10)

    const recentActivities = await prisma.inventoryActivity.findMany({
      where: {
        businessId,
        createdAt: {
          gte: startDate
        }
      },
      include: {
        product: {
          select: {
            name: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: 10
    })

    return NextResponse.json({
      totalProducts,
      totalValue,
      lowStockProducts,
      outOfStockProducts,
      lowStockAlerts,
      recentActivities
    })

  } catch (error) {
    console.error('Error fetching inventory dashboard:', error)
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 })
  }
}