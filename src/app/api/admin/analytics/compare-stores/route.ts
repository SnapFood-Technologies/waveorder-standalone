// src/app/api/admin/analytics/compare-stores/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
    }

    // Get all businesses for this user
    const businessUsers = await prisma.businessUser.findMany({
      where: { userId: session.user.id },
      include: {
        business: {
          select: {
            id: true,
            name: true,
            slug: true,
            logo: true,
            currency: true
          }
        }
      }
    })

    if (businessUsers.length < 2) {
      return NextResponse.json({ 
        message: 'Need at least 2 stores to compare',
        stores: []
      })
    }

    const { searchParams } = new URL(request.url)
    const period = searchParams.get('period') || '30' // days
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - parseInt(period))

    // Get stats for each business
    const storeStats = await Promise.all(
      businessUsers.map(async (bu) => {
        const businessId = bu.business.id

        // Get orders in period
        const orders = await prisma.order.findMany({
          where: {
            businessId,
            createdAt: { gte: startDate }
          },
          select: {
            total: true,
            status: true
          }
        })

        const totalOrders = orders.length
        const totalRevenue = orders
          .filter(o => ['DELIVERED', 'READY', 'CONFIRMED'].includes(o.status))
          .reduce((sum, o) => sum + o.total, 0)

        // Get product count
        const productCount = await prisma.product.count({
          where: { businessId, isActive: true }
        })

        // Get customer count
        const customerCount = await prisma.customer.count({
          where: { businessId }
        })

        // Get page views (if tracking exists)
        const pageViews = await prisma.visitorSession.count({
          where: {
            businessId,
            createdAt: { gte: startDate }
          }
        })

        return {
          id: bu.business.id,
          name: bu.business.name,
          slug: bu.business.slug,
          logo: bu.business.logo,
          currency: bu.business.currency,
          stats: {
            orders: totalOrders,
            revenue: totalRevenue,
            products: productCount,
            customers: customerCount,
            views: pageViews,
            avgOrderValue: totalOrders > 0 ? totalRevenue / totalOrders : 0
          }
        }
      })
    )

    return NextResponse.json({
      stores: storeStats,
      period: parseInt(period),
      generatedAt: new Date().toISOString()
    })

  } catch (error) {
    console.error('Error fetching store comparison:', error)
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    )
  }
}
