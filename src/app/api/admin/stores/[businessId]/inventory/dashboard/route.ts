// app/api/admin/stores/[businessId]/inventory/dashboard/route.ts
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
    const range = searchParams.get('range') || '7d'

    // Calculate date range
    const now = new Date()
    const daysBack = range === '1d' ? 1 : range === '7d' ? 7 : range === '30d' ? 30 : 90
    const startDate = new Date(now.getTime() - (daysBack * 24 * 60 * 60 * 1000))

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

    // Get all products with inventory tracking
    const products = await prisma.product.findMany({
      where: {
        businessId,
        trackInventory: true
      },
      include: {
        category: {
          select: {
            name: true
          }
        }
      }
    })

    // Calculate stats
    const totalProducts = products.length
    const totalValue = products.reduce((sum, product) => sum + (product.stock * product.price), 0)
    const lowStockProducts = products.filter(p => 
      p.lowStockAlert && p.stock <= p.lowStockAlert && p.stock > 0
    ).length
    const outOfStockProducts = products.filter(p => p.stock === 0).length

    // Get low stock alerts
    const lowStockAlerts = products
      .filter(p => p.lowStockAlert && p.stock <= p.lowStockAlert)
      .sort((a, b) => a.stock - b.stock)
      .slice(0, 10)

    // Get recent inventory activities
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