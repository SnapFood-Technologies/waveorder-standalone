// app/api/superadmin/stats/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'


export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || session.user.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const startDateParam = searchParams.get('startDate')
    const endDateParam = searchParams.get('endDate')

    // Parse dates or use default (current month)
    let startDate: Date
    let endDate: Date

    if (startDateParam && endDateParam) {
      startDate = new Date(startDateParam)
      endDate = new Date(endDateParam)
    } else {
      const now = new Date()
      startDate = new Date(now.getFullYear(), now.getMonth(), 1)
      endDate = now
    }

    endDate.setHours(23, 59, 59, 999)

    // Get current month and last month dates for growth calculation
    const now = new Date()
    const currentMonth = new Date(now.getFullYear(), now.getMonth(), 1)
    const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1)
    const thisWeek = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)

    // Parallel queries for better performance
    const [
      totalBusinessesAllTime,
      activeBusinesses,
      totalUsersAllTime,
      businessesInPeriod,
      usersInPeriod,
      currentMonthBusinesses,
      lastMonthBusinesses,
      recentSignups,
      oldPageViews,
      newPageViews
    ] = await Promise.all([
      // Total businesses (all time)
      prisma.business.count(),
      
      // Active businesses (all time)
      prisma.business.count({
        where: { isActive: true }
      }),
      
      // Total users (all time) - fetch to filter by active businesses
      prisma.user.findMany({
        where: {
          role: { not: 'SUPER_ADMIN' }
        },
        include: {
          businesses: {
            include: {
              business: {
                select: {
                  id: true,
                  isActive: true,
                  deactivatedAt: true
                }
              }
            }
          }
        }
      }),

      // Businesses created in selected period (fetch to filter deactivated in memory)
      prisma.business.findMany({
        where: {
          createdAt: {
            gte: startDate,
            lte: endDate
          }
        },
        select: {
          deactivatedAt: true
        }
      }),

      // Users created in selected period (exclude SUPER_ADMIN) - fetch to filter by active businesses
      prisma.user.findMany({
        where: {
          createdAt: {
            gte: startDate,
            lte: endDate
          },
          role: { not: 'SUPER_ADMIN' }
        },
        include: {
          businesses: {
            include: {
              business: {
                select: {
                  id: true,
                  isActive: true,
                  deactivatedAt: true
                }
              }
            }
          }
        }
      }),
      
      // Current month businesses (for growth calculation - fetch to filter deactivated)
      prisma.business.findMany({
        where: {
          createdAt: {
            gte: currentMonth
          }
        },
        select: {
          deactivatedAt: true
        }
      }),
      
      // Last month businesses (for growth calculation - fetch to filter deactivated)
      prisma.business.findMany({
        where: {
          createdAt: {
            gte: lastMonth,
            lt: currentMonth
          }
        },
        select: {
          deactivatedAt: true
        }
      }),
      
      // Recent signups (this week) - EXCLUDE SUPER_ADMIN - fetch to filter by active businesses
      prisma.user.findMany({
        where: {
          createdAt: {
            gte: thisWeek
          },
          role: { not: 'SUPER_ADMIN' }
        },
        include: {
          businesses: {
            include: {
              business: {
                select: {
                  id: true,
                  isActive: true,
                  deactivatedAt: true
                }
              }
            }
          }
        }
      }),

      // Total page views from old Analytics (legacy data)
      prisma.analytics.aggregate({
        where: {
          date: {
            gte: startDate,
            lte: endDate
          }
        },
        _sum: {
          visitors: true
        }
      }),
      
      // Total page views from new VisitorSession (new tracking)
      prisma.visitorSession.count({
        where: {
          visitedAt: {
            gte: startDate,
            lte: endDate
          }
        }
      })
    ])

    // Filter out deactivated businesses in memory (handles both null and undefined)
    const activeBusinessesInPeriod = businessesInPeriod.filter((b: any) => !b.deactivatedAt || b.deactivatedAt === null)
    const activeCurrentMonthBusinesses = currentMonthBusinesses.filter((b: any) => !b.deactivatedAt || b.deactivatedAt === null)
    const activeLastMonthBusinesses = lastMonthBusinesses.filter((b: any) => !b.deactivatedAt || b.deactivatedAt === null)

    // Filter users: must have at least one active, non-deactivated business
    const filterUsersWithActiveBusinesses = (users: any[]) => {
      return users.filter(user => {
        if (!user.businesses || user.businesses.length === 0) {
          return false
        }
        
        const hasActiveBusiness = user.businesses.some((bu: any) => 
          bu.business.isActive && 
          (!bu.business.deactivatedAt || bu.business.deactivatedAt === null)
        )
        
        return hasActiveBusiness
      })
    }

    const activeUsersAllTime = filterUsersWithActiveBusinesses(totalUsersAllTime as unknown as any[])
    const activeUsersInPeriod = filterUsersWithActiveBusinesses(usersInPeriod as unknown as any[])
    const activeRecentSignups = filterUsersWithActiveBusinesses(recentSignups as unknown as any[])

    // Calculate monthly growth
    const monthlyGrowth = activeLastMonthBusinesses.length > 0 
      ? ((activeCurrentMonthBusinesses.length - activeLastMonthBusinesses.length) / activeLastMonthBusinesses.length * 100)
      : activeCurrentMonthBusinesses.length > 0 ? 100 : 0

    const stats = {
      // Show businesses created in selected period for "New Businesses" (excluding deactivated)
      totalBusinesses: activeBusinessesInPeriod.length,
      // Show all-time active businesses (not affected by date filter)
      activeBusinesses,
      // Show users created in selected period for "New Users" (only with active businesses)
      totalUsers: activeUsersInPeriod.length,
      // Monthly growth comparison (not affected by date filter)
      monthlyGrowth: Math.round(monthlyGrowth * 10) / 10,
      // Recent signups this week (not affected by date filter, only with active businesses)
      recentSignups: activeRecentSignups.length,
      totalPageViews: (oldPageViews?._sum.visitors || 0) + (newPageViews || 0)
    }

    return NextResponse.json(stats)

  } catch (error) {
    console.error('Error fetching superadmin stats:', error)
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    )
  }
}