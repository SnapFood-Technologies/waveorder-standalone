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
      activeBusinesses,
      totalUsers,
      totalOrders,
      deliveredOrders,
      businesses,
      users,
      orders,
      incompleteBusinesses,
      inactiveBusinesses
    ] = await Promise.all([
      // Total counts
      prisma.business.count(),
      // Active businesses count
      prisma.business.count({
        where: { isActive: true }
      }),
      prisma.user.count({
        where: {
          role: {
            not: 'SUPER_ADMIN'
          }
        }
      }),
      prisma.order.count(),
      
      // Paid and completed orders for revenue (includes CONFIRMED, READY, DELIVERED)
      // Filter by date range if specified
      prisma.order.findMany({
        where: {
          paymentStatus: 'PAID',
          status: {
            in: ['CONFIRMED', 'PREPARING', 'READY', 'OUT_FOR_DELIVERY', 'DELIVERED']
          },
          createdAt: {
            gte: startDate
          }
        },
        select: {
          total: true,
          createdAt: true,
          businessId: true
        }
      }),

      // Businesses with order counts for top performers (only active businesses)
      prisma.business.findMany({
        where: {
          isActive: true // Only count active businesses for revenue calculations
        },
        select: {
          id: true,
          name: true,
          subscriptionPlan: true,
          isActive: true,
          createdAt: true, // Needed for business growth calculation
          orders: {
            where: {
              paymentStatus: 'PAID',
              status: {
                in: ['CONFIRMED', 'PREPARING', 'READY', 'OUT_FOR_DELIVERY', 'DELIVERED']
              }
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
      }),

      // Fetch all businesses first (we'll filter for incomplete in memory)
      // Prisma/MongoDB has issues with null checks in nested OR conditions
      prisma.business.findMany({
        select: {
          id: true,
          name: true,
          whatsappNumber: true,
          address: true,
          createdAt: true
        },
        orderBy: {
          createdAt: 'desc'
        }
      }),

      // Inactive businesses with deactivation info
      prisma.business.findMany({
        where: {
          isActive: false
        },
        select: {
          id: true,
          name: true,
          deactivatedAt: true,
          deactivationReason: true,
          createdAt: true
        },
        orderBy: {
          deactivatedAt: 'desc'
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

    // Platform subscription revenue by plan
    // Note: Only counting ACTIVE businesses for each plan (businesses array is already filtered to active only)
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
    ].filter(item => item.businesses > 0) // Only show plans that have active businesses

    // Format cumulative growth data
    const formatCumulativeGrowth = (data: any[]) => {
      let cumulative = 0
      return data.map(item => {
        cumulative += item.count
        return { ...item, count: cumulative }
      })
    }

    // Filter incomplete businesses in memory (due to Prisma/MongoDB null handling issues)
    // A business is incomplete if WhatsApp is missing OR address is missing
    const incompleteBusinessesFiltered = incompleteBusinesses.filter(business => {
      const whatsappNumber = (business.whatsappNumber || '').trim()
      const address = business.address ? business.address.trim() : null
      
      const hasWhatsApp = whatsappNumber !== '' && whatsappNumber !== 'Not provided'
      const hasAddress = address !== null && address !== '' && address !== 'Not set'
      
      return !hasWhatsApp || !hasAddress
    })

    // Format incomplete businesses
    // Check for missing fields: WhatsApp or Address
    const formattedIncompleteBusinesses = incompleteBusinessesFiltered.map(business => {
      const whatsappNumber = (business.whatsappNumber || '').trim()
      const address = business.address ? business.address.trim() : null
      
      const missingFields: string[] = []
      
      // Check if WhatsApp is missing
      if (!whatsappNumber || whatsappNumber === 'Not provided' || whatsappNumber === '') {
        missingFields.push('WhatsApp')
      }
      
      // Check if Address is missing
      if (!address || address === 'Not set' || address === '') {
        missingFields.push('Address')
      }
      
      return {
        id: business.id,
        name: business.name,
        missingFields,
        createdAt: business.createdAt.toISOString()
      }
    })

    // Format inactive businesses with reasons
    const formattedInactiveBusinesses = inactiveBusinesses.map(business => ({
      id: business.id,
      name: business.name,
      deactivatedAt: business.deactivatedAt?.toISOString() || null,
      deactivationReason: business.deactivationReason || null,
      createdAt: business.createdAt.toISOString()
    }))

    // Calculate total revenue from delivered orders
    const totalRevenue = deliveredOrders.reduce((sum, order) => sum + order.total, 0)

    // Calculate incomplete businesses count (all businesses, not just in date range)
    const incompleteCount = incompleteBusinessesFiltered.length

    return NextResponse.json({
      overview: {
        totalBusinesses,
        activeBusinesses,
        incompleteBusinesses: incompleteCount,
        totalUsers,
        totalOrders,
        totalRevenue,
        avgOrderValue, // Average order value across all businesses
        conversionRate
      },
      businessGrowth: formatCumulativeGrowth(businessGrowth),
      userGrowth: formatCumulativeGrowth(userGrowth),
      topBusinesses, // Ranked by business order revenue (delivered + paid)
      revenueByPlan, // Platform subscription revenue by plan (currently all $0)
      incompleteBusinesses: formattedIncompleteBusinesses,
      inactiveBusinesses: formattedInactiveBusinesses
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