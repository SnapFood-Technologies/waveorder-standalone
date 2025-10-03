// app/api/superadmin/analytics/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { PrismaClient } from '@prisma/client'
import { authOptions } from '@/lib/auth'

const prisma = new PrismaClient()

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || session.user.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const range = searchParams.get('range') || '30d'

    // Calculate date range
    const now = new Date()
    const startDate = new Date()
    
    switch (range) {
      case '7d':
        startDate.setDate(now.getDate() - 7)
        break
      case '30d':
        startDate.setDate(now.getDate() - 30)
        break
      case '90d':
        startDate.setDate(now.getDate() - 90)
        break
      case '1y':
        startDate.setFullYear(now.getFullYear() - 1)
        break
      default:
        startDate.setDate(now.getDate() - 30)
    }

    // Fetch all data in parallel for performance
    const [
      totalBusinesses,
      totalUsers,
      totalOrders,
      deliveredOrders,
      businesses,
      users,
      orders
    ] = await Promise.all([
      // Total counts
      prisma.business.count(),
      prisma.user.count(),
      prisma.order.count(),
      
      // Delivered and paid orders for revenue
      prisma.order.findMany({
        where: {
          status: 'DELIVERED',
          paymentStatus: 'PAID'
        },
        select: {
          total: true,
          createdAt: true,
          businessId: true
        }
      }),

      // Businesses with order counts for top performers
      prisma.business.findMany({
        include: {
          orders: {
            where: {
              status: 'DELIVERED',
              paymentStatus: 'PAID'
            },
            select: {
              total: true
            }
          },
          _count: {
            select: {
              orders: true
            }
          }
        },
        orderBy: {
          createdAt: 'desc'
        }
      }),

      // Users for growth tracking
      prisma.user.findMany({
        where: {
          createdAt: {
            gte: startDate
          }
        },
        select: {
          createdAt: true
        },
        orderBy: {
          createdAt: 'asc'
        }
      }),

      // Orders for analytics
      prisma.order.findMany({
        where: {
          createdAt: {
            gte: startDate
          }
        },
        select: {
          createdAt: true,
          status: true
        }
      })
    ])

    // Calculate average order value (across all businesses' orders - for platform metrics)
    const avgOrderValue = deliveredOrders.length > 0 
      ? deliveredOrders.reduce((sum, order) => sum + order.total, 0) / deliveredOrders.length 
      : 0

    // Calculate conversion rate (delivered orders / total orders)
    const conversionRate = totalOrders > 0 
      ? (deliveredOrders.length / totalOrders) * 100 
      : 0

    // Business growth over time (group by date)
    const businessGrowth = businesses.reduce((acc: any[], business) => {
      const date = business.createdAt.toISOString().split('T')[0]
      const existing = acc.find(item => item.date === date)
      
      if (existing) {
        existing.count += 1
      } else {
        acc.push({ date, count: 1 })
      }
      
      return acc
    }, []).sort((a, b) => a.date.localeCompare(b.date))

    // User growth over time
    const userGrowth = users.reduce((acc: any[], user) => {
      const date = user.createdAt.toISOString().split('T')[0]
      const existing = acc.find(item => item.date === date)
      
      if (existing) {
        existing.count += 1
      } else {
        acc.push({ date, count: 1 })
      }
      
      return acc
    }, []).sort((a, b) => a.date.localeCompare(b.date))

    // Top performing businesses (by completed order revenue)
    const topBusinesses = businesses
      .map(business => {
        const businessOrderRevenue = business.orders.reduce((sum, order) => sum + order.total, 0)
        return {
          id: business.id,
          name: business.name,
          orders: business._count.orders,
          revenue: businessOrderRevenue, // Business sales from delivered + paid orders
          plan: business.subscriptionPlan
        }
      })
      .filter(b => b.revenue > 0)
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 10)

    // TODO: Platform subscription revenue by plan
    // Once Pro plan pricing is set and Stripe integration is implemented:
    // - Track actual subscription payments from Stripe
    // - Calculate MRR (Monthly Recurring Revenue) = active Pro businesses × Pro plan price
    // - Show historical subscription revenue over time
    // For now, showing $0 since all businesses are on FREE plan
    const revenueByPlan = [
      {
        plan: 'FREE',
        revenue: 0, // FREE plan = $0 subscription revenue
        businesses: businesses.filter(b => b.subscriptionPlan === 'FREE').length
      },
      {
        plan: 'PRO',
        revenue: 0, // TODO: Will calculate once Pro pricing and Stripe are implemented
        businesses: businesses.filter(b => b.subscriptionPlan === 'PRO').length
      }
    ].filter(item => item.businesses > 0) // Only show plans that have businesses

    // Format cumulative growth data
    const formatCumulativeGrowth = (data: any[]) => {
      let cumulative = 0
      return data.map(item => {
        cumulative += item.count
        return { ...item, count: cumulative }
      })
    }

    return NextResponse.json({
      overview: {
        totalBusinesses,
        totalUsers,
        totalOrders,
        avgOrderValue, // Average order value across all businesses
        conversionRate
      },
      businessGrowth: formatCumulativeGrowth(businessGrowth),
      userGrowth: formatCumulativeGrowth(userGrowth),
      topBusinesses, // Ranked by business order revenue (delivered + paid)
      revenueByPlan // Platform subscription revenue by plan (currently all $0)
    })

  } catch (error) {
    console.error('Error fetching analytics:', error)
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    )
  } finally {
    await prisma.$disconnect()
  }
}