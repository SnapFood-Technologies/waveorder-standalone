// src/app/api/admin/stores/[businessId]/financial/overview/route.ts
// Financial overview: order revenue, affiliate/delivery deductions, internal expenses, payables
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
        internalExpensesEnabled: true,
        enableAffiliateSystem: true,
        enableDeliveryManagement: true,
        enableTeamPaymentTracking: true,
        showCostPrice: true,
        businessType: true,
        currency: true,
        financialReportLastGeneratedAt: true
      }
    })

    if (!business) {
      return NextResponse.json({ error: 'Business not found' }, { status: 404 })
    }

    const currency = business.currency || 'EUR'

    // 1. Order revenue (gross) - paid, delivered/completed orders
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

    // 2. Affiliate earnings & payments (when enabled)
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

    // 3. Delivery earnings & payments (when enabled)
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

    // 4. Net order revenue (excludes affiliate + delivery portions)
    const netOrderRevenue =
      orderRevenue - affiliateEarningsTotal - deliveryEarningsTotal

    // 5. Internal expenses (when enabled)
    let totalExpenses = 0
    let totalInjections = 0
    if (business.internalExpensesEnabled) {
      const [expenses, injections] = await Promise.all([
        prisma.internalExpense.aggregate({
          where: { businessId, type: { not: 'INJECTION' } },
          _sum: { amount: true }
        }),
        prisma.internalExpense.aggregate({
          where: { businessId, type: 'INJECTION' },
          _sum: { amount: true }
        })
      ])
      totalExpenses = expenses._sum.amount ?? 0
      totalInjections = injections._sum.amount ?? 0
    }

    // 6. Supplier payable (when Cost & Margins enabled)
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
      const cogsBySupplier: Record<string, number> = {}
      for (const order of completedOrders) {
        for (const item of order.items) {
          const cost = (item.product?.costPrice || 0) * item.quantity
          totalCOGS += cost
          const name = item.product?.supplierName || 'Unknown'
          cogsBySupplier[name] = (cogsBySupplier[name] || 0) + cost
        }
      }
      const supplierPayments = await prisma.supplierPayment.findMany({
        where: { businessId }
      })
      const paidBySupplier: Record<string, number> = {}
      for (const p of supplierPayments) {
        paidBySupplier[p.supplierName] = (paidBySupplier[p.supplierName] || 0) + p.amount
      }
      supplierPaid = supplierPayments.reduce((s, p) => s + p.amount, 0)
      supplierOwed = totalCOGS
      supplierOutstanding = Math.max(0, totalCOGS - supplierPaid)
    }

    const affiliatePayable = Math.max(0, affiliateEarningsTotal - affiliatePaymentsTotal)
    const deliveryPayable = Math.max(0, deliveryEarningsTotal - deliveryPaymentsTotal)

    // 7. Team payments (when enabled)
    let totalTeamPayments = 0
    if (business.enableTeamPaymentTracking) {
      const agg = await prisma.teamMemberPayment.aggregate({
        where: { businessId },
        _sum: { amount: true }
      })
      totalTeamPayments = agg._sum.amount ?? 0
    }

    return NextResponse.json({
      enabled: true,
      currency,
      lastGeneratedAt: business.financialReportLastGeneratedAt?.toISOString() ?? null,
      data: {
        orderRevenue: Math.round(orderRevenue * 100) / 100,
        affiliateEarnings: affiliateEarningsTotal,
        affiliatePayments: affiliatePaymentsTotal,
        affiliatePayable,
        deliveryEarnings: deliveryEarningsTotal,
        deliveryPayments: deliveryPaymentsTotal,
        deliveryPayable,
        netOrderRevenue: Math.round(netOrderRevenue * 100) / 100,
        totalExpenses,
        totalInjections,
        netCashFlow: totalInjections - totalExpenses,
        supplierOwed: Math.round(supplierOwed * 100) / 100,
        supplierPaid: Math.round(supplierPaid * 100) / 100,
        supplierOutstanding: Math.round(supplierOutstanding * 100) / 100,
        totalTeamPayments: Math.round(totalTeamPayments * 100) / 100,
        features: {
          internalExpensesEnabled: business.internalExpensesEnabled,
          enableAffiliateSystem: business.enableAffiliateSystem,
          enableDeliveryManagement: business.enableDeliveryManagement,
          enableTeamPaymentTracking: business.enableTeamPaymentTracking,
          showCostPrice: business.showCostPrice
        }
      }
    })
  } catch (error) {
    console.error('Error fetching financial overview:', error)
    return NextResponse.json(
      { error: 'Failed to fetch financial overview' },
      { status: 500 }
    )
  }
}
