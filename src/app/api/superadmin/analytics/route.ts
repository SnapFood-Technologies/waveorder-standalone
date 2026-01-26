// app/api/superadmin/analytics/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { getBillingTypeFromPriceId } from '@/lib/stripe'


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
      
      // Paid and completed orders for revenue
      // - DELIVERY orders: DELIVERED + PAID
      // - PICKUP orders: PICKED_UP + PAID
      // - DINE_IN orders: PICKED_UP + PAID
      // Filter by date range if specified
      prisma.order.findMany({
        where: {
          paymentStatus: 'PAID',
          OR: [
            { type: 'DELIVERY', status: 'DELIVERED' },
            { type: 'PICKUP', status: 'PICKED_UP' },
            { type: 'DINE_IN', status: 'PICKED_UP' }
          ],
          NOT: {
            status: {
              in: ['CANCELLED', 'REFUNDED']
            }
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
          users: {
            where: {
              role: 'OWNER'
            },
            select: {
              role: true,
              user: {
                select: {
                  subscription: {
                    select: {
                      priceId: true
                    }
                  }
                }
              }
            }
          },
          orders: {
            where: {
              paymentStatus: 'PAID',
              OR: [
                { type: 'DELIVERY', status: 'DELIVERED' },
                { type: 'PICKUP', status: 'PICKED_UP' },
                { type: 'DINE_IN', status: 'PICKED_UP' }
              ],
              NOT: {
                status: {
                  in: ['CANCELLED', 'REFUNDED']
                }
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

    // Calculate total page views (from old Analytics + new VisitorSession)
    const oldPageViews = await prisma.analytics.aggregate({
      where: {
        date: { gte: startDate, lte: now }
      },
      _sum: { visitors: true }
    })
    
    const newPageViews = await prisma.visitorSession.count({
      where: {
        visitedAt: { gte: startDate, lte: now }
      }
    })
    
    const totalPageViews = (oldPageViews?._sum.visitors || 0) + (newPageViews || 0)

    // Get time-series data for page views (for chart)
    const oldAnalyticsData = await prisma.analytics.findMany({
      where: {
        date: { gte: startDate, lte: now }
      },
      select: {
        date: true,
        visitors: true
      },
      orderBy: { date: 'asc' }
    })

    const newVisitorSessions = await prisma.visitorSession.findMany({
      where: {
        visitedAt: { gte: startDate, lte: now }
      },
      select: {
        visitedAt: true
      },
      orderBy: { visitedAt: 'asc' }
    })

    // Merge and group time-series data by date
    const pageViewsTimeSeries = new Map<string, number>()

    // Add old analytics data
    oldAnalyticsData.forEach(item => {
      const dateKey = item.date.toISOString().split('T')[0]
      pageViewsTimeSeries.set(dateKey, (pageViewsTimeSeries.get(dateKey) || 0) + (item.visitors || 0))
    })

    // Add new visitor sessions data (group by date)
    newVisitorSessions.forEach(session => {
      const dateKey = session.visitedAt.toISOString().split('T')[0]
      pageViewsTimeSeries.set(dateKey, (pageViewsTimeSeries.get(dateKey) || 0) + 1)
    })

    // Convert to sorted array
    const pageViewsData = Array.from(pageViewsTimeSeries.entries())
      .map(([date, views]) => ({ date, views }))
      .sort((a, b) => a.date.localeCompare(b.date))

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
        const owner = business.users.find(u => u.role === 'OWNER')?.user
        const subscriptionPriceId = owner?.subscription?.priceId
        const billingType = subscriptionPriceId ? getBillingTypeFromPriceId(subscriptionPriceId) : null
        
        return {
          id: business.id,
          name: business.name,
          orders: business._count.orders,
          revenue: businessOrderRevenue, // Business sales from delivered + paid orders
          plan: business.subscriptionPlan,
          billingType: billingType
        }
      })
      .filter(b => b.revenue > 0)
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 10)

    // Platform subscription revenue by plan and billing type
    // Note: Only counting ACTIVE businesses for each plan (businesses array is already filtered to active only)
    // Once Pro plan pricing is set and Stripe integration is implemented:
    // - Track actual subscription payments from Stripe
    // - Calculate MRR (Monthly Recurring Revenue) = active Pro businesses × Pro plan price
    // - Show historical subscription revenue over time
    // Subscription revenue calculation - group by plan and billing type
    const planBillingGroups: Record<string, { plan: string; billingType: string; businesses: number }> = {}
    
    businesses.forEach(business => {
      const owner = business.users.find(u => u.role === 'OWNER')?.user
      const subscriptionPriceId = owner?.subscription?.priceId
      const billingType = subscriptionPriceId ? getBillingTypeFromPriceId(subscriptionPriceId) : null
      const billingTypeKey = billingType || 'unknown'
      
      const key = `${business.subscriptionPlan}_${billingTypeKey}`
      if (!planBillingGroups[key]) {
        planBillingGroups[key] = {
          plan: business.subscriptionPlan,
          billingType: billingTypeKey,
          businesses: 0
        }
      }
      planBillingGroups[key].businesses++
    })
    
    const revenueByPlan = Object.values(planBillingGroups)
      .map(item => ({
        plan: item.plan,
        billingType: item.billingType,
        revenue: 0, // Subscription revenue - TODO: Calculate actual revenue from Stripe
        businesses: item.businesses
      }))
      .filter(item => item.businesses > 0) // Only show plans that have active businesses
      .sort((a, b) => {
        // Sort by plan first (STARTER before PRO), then by billing type
        if (a.plan !== b.plan) {
          return a.plan === 'STARTER' ? -1 : 1
        }
        const billingOrder = { free: 0, monthly: 1, yearly: 2, unknown: 3 }
        return (billingOrder[a.billingType as keyof typeof billingOrder] || 3) - 
               (billingOrder[b.billingType as keyof typeof billingOrder] || 3)
      })

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
        pageViews: totalPageViews, // Total page views across all businesses
        conversionRate
      },
      businessGrowth: formatCumulativeGrowth(businessGrowth),
      userGrowth: formatCumulativeGrowth(userGrowth),
      topBusinesses, // Ranked by business order revenue (delivered + paid)
      revenueByPlan, // Platform subscription revenue by plan (currently all $0)
      incompleteBusinesses: formattedIncompleteBusinesses,
      inactiveBusinesses: formattedInactiveBusinesses,
      pageViewsTimeSeries: pageViewsData // Time-series data for page views chart
    })

  } catch (error) {
    console.error('Error fetching analytics:', error)
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    )
  }
}