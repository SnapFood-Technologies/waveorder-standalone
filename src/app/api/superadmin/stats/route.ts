
// API Route: app/api/superadmin/stats/route.ts
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
      totalBusinesses,
      activeBusinesses,
      totalUsers,
      businessesInPeriod,
      usersInPeriod,
      currentMonthBusinesses,
      lastMonthBusinesses,
      recentSignups
    ] = await Promise.all([
      // Total businesses (all time)
      prisma.business.count(),
      
      // Active businesses (all time)
      prisma.business.count({
        where: { isActive: true }
      }),
      
      // Total users (all time)
      prisma.user.count(),

      // Businesses created in selected period
      prisma.business.count({
        where: {
          createdAt: {
            gte: startDate,
            lte: endDate
          }
        }
      }),

      // Users created in selected period
      prisma.user.count({
        where: {
          createdAt: {
            gte: startDate,
            lte: endDate
          }
        }
      }),
      
      // Current month businesses (for growth calculation)
      prisma.business.count({
        where: {
          createdAt: {
            gte: currentMonth
          }
        }
      }),
      
      // Last month businesses (for growth calculation)
      prisma.business.count({
        where: {
          createdAt: {
            gte: lastMonth,
            lt: currentMonth
          }
        }
      }),
      
      // Recent signups (this week) - EXCLUDE SUPER_ADMIN
      prisma.user.count({
        where: {
          createdAt: {
            gte: thisWeek
          },
          role: {
            not: 'SUPER_ADMIN'
          }
        }
      })
    ])

    // Calculate monthly growth
    const monthlyGrowth = lastMonthBusinesses > 0 
      ? ((currentMonthBusinesses - lastMonthBusinesses) / lastMonthBusinesses * 100)
      : currentMonthBusinesses > 0 ? 100 : 0

    const stats = {
      totalBusinesses: businessesInPeriod, // Show businesses in selected period
      activeBusinesses,
      totalUsers: usersInPeriod, // Show users in selected period  
      monthlyGrowth: Math.round(monthlyGrowth * 10) / 10,
      recentSignups
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