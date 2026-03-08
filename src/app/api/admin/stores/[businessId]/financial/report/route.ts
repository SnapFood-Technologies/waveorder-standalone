// src/app/api/admin/stores/[businessId]/financial/report/route.ts
// GET - Full report data for PDF (overview + all cash movements)
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
      return NextResponse.json({ error: access.error }, { status: access.status })
    }

    const business = await prisma.business.findUnique({
      where: { id: businessId },
      select: {
        name: true,
        logo: true,
        address: true,
        phone: true,
        email: true,
        currency: true,
        internalExpensesEnabled: true,
        enableAffiliateSystem: true,
        enableDeliveryManagement: true,
        showCostPrice: true,
        businessType: true
      }
    })

    if (!business) {
      return NextResponse.json({ error: 'Business not found' }, { status: 404 })
    }

    const currency = business.currency || 'EUR'

    // Order revenue
    let orderRevenue = 0
    if (business.businessType === 'SALON' || business.businessType === 'SERVICES') {
      const paidCompletedAppointments = await prisma.appointment.findMany({
        where: {
          businessId,
          status: 'COMPLETED',
          order: { paymentStatus: 'PAID' }
        },
        include: { order: { select: { total: true } } }
      })
      orderRevenue = paidCompletedAppointments.reduce((sum, apt) => sum + (apt.order?.total || 0), 0)
    } else {
      const revenueAgg = await prisma.order.aggregate({
        where: {
          businessId,
          paymentStatus: 'PAID',
          OR: [
            { type: 'DELIVERY', status: 'DELIVERED' },
            { type: 'PICKUP', status: 'PICKED_UP' },
            { type: 'DINE_IN', status: 'PICKED_UP' }
          ],
          NOT: { status: { in: ['CANCELLED', 'REFUNDED'] } }
        },
        _sum: { total: true }
      })
      orderRevenue = revenueAgg._sum.total ?? 0
    }

    // Affiliate
    let affiliateEarningsTotal = 0
    let affiliatePaymentsTotal = 0
    if (business.enableAffiliateSystem) {
      const [earnings, payments] = await Promise.all([
        prisma.affiliateEarning.aggregate({
          where: { businessId, status: { not: 'CANCELLED' } },
          _sum: { amount: true }
        }),
        prisma.affiliatePayment.aggregate({
          where: { businessId },
          _sum: { amount: true }
        })
      ])
      affiliateEarningsTotal = earnings._sum.amount ?? 0
      affiliatePaymentsTotal = payments._sum.amount ?? 0
    }

    // Delivery
    let deliveryEarningsTotal = 0
    let deliveryPaymentsTotal = 0
    if (business.enableDeliveryManagement) {
      const [earnings, payments] = await Promise.all([
        prisma.deliveryEarning.aggregate({
          where: { businessId, status: { not: 'CANCELLED' } },
          _sum: { amount: true }
        }),
        prisma.deliveryPayment.aggregate({
          where: { businessId },
          _sum: { amount: true }
        })
      ])
      deliveryEarningsTotal = earnings._sum.amount ?? 0
      deliveryPaymentsTotal = payments._sum.amount ?? 0
    }

    const netOrderRevenue = orderRevenue - affiliateEarningsTotal - deliveryEarningsTotal

    // Internal expenses
    let totalExpenses = 0
    let totalInjections = 0
    let cashMovements: Array<{
      type: string
      amount: number
      date: string | null
      category: string
      notes: string | null
    }> = []
    if (business.internalExpensesEnabled) {
      const [expenses, injections, movements] = await Promise.all([
        prisma.internalExpense.aggregate({
          where: { businessId, type: { not: 'INJECTION' } },
          _sum: { amount: true }
        }),
        prisma.internalExpense.aggregate({
          where: { businessId, type: 'INJECTION' },
          _sum: { amount: true }
        }),
        prisma.internalExpense.findMany({
          where: { businessId },
          orderBy: [{ date: 'desc' }, { createdAt: 'desc' }],
          select: { type: true, amount: true, date: true, category: true, notes: true }
        })
      ])
      totalExpenses = expenses._sum.amount ?? 0
      totalInjections = injections._sum.amount ?? 0
      cashMovements = movements.map((m) => ({
        type: m.type || 'EXPENSE',
        amount: m.amount,
        date: m.date?.toISOString() ?? null,
        category: m.category,
        notes: m.notes
      }))
    }

    // Supplier
    let supplierOwed = 0
    let supplierPaid = 0
    let supplierOutstanding = 0
    if (business.showCostPrice) {
      const completedOrders = await prisma.order.findMany({
        where: {
          businessId,
          status: { in: ['DELIVERED', 'PICKED_UP'] },
          paymentStatus: 'PAID'
        },
        include: {
          items: {
            include: {
              product: {
                select: { costPrice: true, supplierName: true }
              }
            }
          }
        }
      })
      let totalCOGS = 0
      for (const order of completedOrders) {
        for (const item of order.items) {
          totalCOGS += (item.product?.costPrice || 0) * item.quantity
        }
      }
      const supplierPayments = await prisma.supplierPayment.findMany({
        where: { businessId }
      })
      supplierPaid = supplierPayments.reduce((s, p) => s + p.amount, 0)
      supplierOwed = totalCOGS
      supplierOutstanding = Math.max(0, totalCOGS - supplierPaid)
    }

    const affiliatePayable = Math.max(0, affiliateEarningsTotal - affiliatePaymentsTotal)
    const deliveryPayable = Math.max(0, deliveryEarningsTotal - deliveryPaymentsTotal)
    const netCashFlow = totalInjections - totalExpenses

    return NextResponse.json({
      business: {
        name: business.name,
        logo: business.logo,
        address: business.address,
        phone: business.phone,
        email: business.email,
        currency
      },
      overview: {
        orderRevenue: Math.round(orderRevenue * 100) / 100,
        netOrderRevenue: Math.round(netOrderRevenue * 100) / 100,
        affiliatePayable,
        deliveryPayable,
        supplierOutstanding: Math.round(supplierOutstanding * 100) / 100,
        totalExpenses,
        totalInjections,
        netCashFlow,
        features: {
          internalExpensesEnabled: business.internalExpensesEnabled,
          enableAffiliateSystem: business.enableAffiliateSystem,
          enableDeliveryManagement: business.enableDeliveryManagement,
          showCostPrice: business.showCostPrice
        }
      },
      cashMovements,
      generatedAt: new Date().toISOString()
    })
  } catch (error) {
    console.error('Error fetching financial report:', error)
    return NextResponse.json(
      { error: 'Failed to fetch financial report' },
      { status: 500 }
    )
  }
}
