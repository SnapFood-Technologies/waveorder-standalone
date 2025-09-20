// src/app/api/admin/stores/[businessId]/metrics/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export async function GET(
  request: NextRequest,
  { params }: { params: { businessId: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
    }

    // Verify user has access to this business
    const businessUser = await prisma.businessUser.findFirst({
      where: {
        businessId: params.businessId,
        userId: session.user.id
      }
    })

    if (!businessUser) {
      return NextResponse.json({ message: 'Access denied' }, { status: 403 })
    }

    // Get date range (last 30 days)
    const endDate = new Date()
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - 30)

    // Get orders count and revenue
    const orders = await prisma.order.findMany({
      where: {
        businessId: params.businessId,
        createdAt: {
          gte: startDate,
          lte: endDate
        }
      },
      select: {
        total: true,
        createdAt: true
      }
    })

    // Get analytics data for views
    const analytics = await prisma.analytics.findMany({
      where: {
        businessId: params.businessId,
        date: {
          gte: startDate,
          lte: endDate
        }
      },
      select: {
        visitors: true
      }
    })

    // Calculate metrics
    const totalOrders = orders.length
    const totalRevenue = orders.reduce((sum, order) => sum + order.total, 0)
    const totalViews = analytics.reduce((sum, record) => sum + record.visitors, 0)

    // Calculate growth (compare with previous period)
    const prevStartDate = new Date(startDate)
    prevStartDate.setDate(prevStartDate.getDate() - 30)
    
    const prevOrders = await prisma.order.findMany({
      where: {
        businessId: params.businessId,
        createdAt: {
          gte: prevStartDate,
          lt: startDate
        }
      },
      select: { total: true }
    })

    const prevRevenue = prevOrders.reduce((sum, order) => sum + order.total, 0)
    const growth = prevRevenue > 0 ? Math.round(((totalRevenue - prevRevenue) / prevRevenue) * 100) : 0

    return NextResponse.json({
      metrics: {
        views: totalViews,
        orders: totalOrders,
        revenue: totalRevenue,
        growth: growth
      }
    })

  } catch (error) {
    console.error('Error fetching metrics:', error)
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 })
  }
}