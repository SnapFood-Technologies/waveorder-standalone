// src/app/api/admin/stores/[businessId]/cost-margins/financial/route.ts
// Financial summary API - Revenue, COGS, Profit, Supplier balances
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { checkBusinessAccess } from '@/lib/api-helpers'

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

    // Check if cost price feature is enabled
    const business = await prisma.business.findUnique({
      where: { id: businessId },
      select: { showCostPrice: true, currency: true }
    })

    if (!business?.showCostPrice) {
      return NextResponse.json({
        enabled: false,
        message: 'Cost & Margins is not enabled for this business.'
      })
    }

    const { searchParams } = new URL(request.url)
    const period = searchParams.get('period') || 'this_month' // this_month, last_month, this_year, all
    const startDateParam = searchParams.get('startDate')
    const endDateParam = searchParams.get('endDate')

    // Calculate date range
    let startDate: Date
    let endDate: Date = new Date()
    endDate.setHours(23, 59, 59, 999)

    if (startDateParam && endDateParam) {
      startDate = new Date(startDateParam)
      endDate = new Date(endDateParam)
      endDate.setHours(23, 59, 59, 999)
    } else {
      switch (period) {
        case 'today':
          startDate = new Date()
          startDate.setHours(0, 0, 0, 0)
          break
        case 'this_week':
          startDate = new Date()
          startDate.setDate(startDate.getDate() - startDate.getDay())
          startDate.setHours(0, 0, 0, 0)
          break
        case 'last_month':
          startDate = new Date()
          startDate.setMonth(startDate.getMonth() - 1)
          startDate.setDate(1)
          startDate.setHours(0, 0, 0, 0)
          endDate = new Date()
          endDate.setDate(0) // Last day of previous month
          endDate.setHours(23, 59, 59, 999)
          break
        case 'this_year':
          startDate = new Date()
          startDate.setMonth(0)
          startDate.setDate(1)
          startDate.setHours(0, 0, 0, 0)
          break
        case 'all':
          startDate = new Date(0) // Beginning of time
          break
        case 'this_month':
        default:
          startDate = new Date()
          startDate.setDate(1)
          startDate.setHours(0, 0, 0, 0)
          break
      }
    }

    // Fetch completed orders with their items
    const completedOrders = await prisma.order.findMany({
      where: {
        businessId,
        status: { in: ['DELIVERED', 'PICKED_UP'] },
        paymentStatus: 'PAID',
        createdAt: {
          gte: startDate,
          lte: endDate
        }
      },
      include: {
        items: {
          include: {
            product: {
              select: {
                id: true,
                name: true,
                costPrice: true,
                supplierName: true
              }
            }
          }
        }
      }
    })

    // Calculate financial metrics
    let totalRevenue = 0
    let totalCOGS = 0
    const supplierCOGS: Record<string, { cogs: number; items: number; revenue: number }> = {}

    for (const order of completedOrders) {
      totalRevenue += order.total

      for (const item of order.items) {
        const costPrice = item.product?.costPrice || 0
        const supplierName = item.product?.supplierName || 'Unknown'
        const itemCOGS = costPrice * item.quantity
        const itemRevenue = item.price * item.quantity

        totalCOGS += itemCOGS

        if (!supplierCOGS[supplierName]) {
          supplierCOGS[supplierName] = { cogs: 0, items: 0, revenue: 0 }
        }
        supplierCOGS[supplierName].cogs += itemCOGS
        supplierCOGS[supplierName].items += item.quantity
        supplierCOGS[supplierName].revenue += itemRevenue
      }
    }

    const grossProfit = totalRevenue - totalCOGS
    const grossMarginPercent = totalRevenue > 0 ? (grossProfit / totalRevenue) * 100 : 0

    // Get supplier payments for the period
    const supplierPayments = await prisma.supplierPayment.findMany({
      where: {
        businessId,
        paidAt: {
          gte: startDate,
          lte: endDate
        }
      }
    })

    const totalPaidToSuppliers = supplierPayments.reduce((sum, p) => sum + p.amount, 0)

    // Group payments by supplier
    const paymentsBySupplier: Record<string, number> = {}
    for (const payment of supplierPayments) {
      paymentsBySupplier[payment.supplierName] = (paymentsBySupplier[payment.supplierName] || 0) + payment.amount
    }

    // Calculate outstanding balance per supplier
    const supplierBreakdown = Object.entries(supplierCOGS)
      .map(([name, data]) => ({
        supplierName: name,
        cogs: Math.round(data.cogs * 100) / 100,
        revenue: Math.round(data.revenue * 100) / 100,
        itemsSold: data.items,
        paid: Math.round((paymentsBySupplier[name] || 0) * 100) / 100,
        outstanding: Math.round((data.cogs - (paymentsBySupplier[name] || 0)) * 100) / 100
      }))
      .filter(s => s.cogs > 0 || s.paid > 0)
      .sort((a, b) => b.cogs - a.cogs)

    const totalOutstanding = totalCOGS - totalPaidToSuppliers

    // Get historical data for charts (daily breakdown)
    const dailyData: Record<string, { revenue: number; cogs: number; profit: number }> = {}
    
    for (const order of completedOrders) {
      const dateKey = order.createdAt.toISOString().split('T')[0]
      if (!dailyData[dateKey]) {
        dailyData[dateKey] = { revenue: 0, cogs: 0, profit: 0 }
      }
      dailyData[dateKey].revenue += order.total
      
      for (const item of order.items) {
        const costPrice = item.product?.costPrice || 0
        dailyData[dateKey].cogs += costPrice * item.quantity
      }
      dailyData[dateKey].profit = dailyData[dateKey].revenue - dailyData[dateKey].cogs
    }

    const chartData = Object.entries(dailyData)
      .map(([date, data]) => ({
        date,
        revenue: Math.round(data.revenue * 100) / 100,
        cogs: Math.round(data.cogs * 100) / 100,
        profit: Math.round(data.profit * 100) / 100
      }))
      .sort((a, b) => a.date.localeCompare(b.date))

    return NextResponse.json({
      enabled: true,
      currency: business.currency || 'EUR',
      data: {
        period: {
          start: startDate.toISOString(),
          end: endDate.toISOString(),
          label: period
        },
        summary: {
          totalRevenue: Math.round(totalRevenue * 100) / 100,
          totalCOGS: Math.round(totalCOGS * 100) / 100,
          grossProfit: Math.round(grossProfit * 100) / 100,
          grossMarginPercent: Math.round(grossMarginPercent * 10) / 10,
          ordersCount: completedOrders.length
        },
        supplierBalances: {
          owedToSuppliers: Math.round(totalCOGS * 100) / 100,
          alreadyPaid: Math.round(totalPaidToSuppliers * 100) / 100,
          outstandingBalance: Math.round(totalOutstanding * 100) / 100
        },
        supplierBreakdown,
        chartData
      }
    })

  } catch (error) {
    console.error('Error fetching financial summary:', error)
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    )
  }
}
