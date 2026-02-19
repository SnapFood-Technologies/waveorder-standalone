// Financial Dashboard API — real-time Stripe data + DB context
import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { stripe, mapStripePlanToDb, PLANS, getBillingTypeFromPriceId } from '@/lib/stripe'

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session || session.user.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
    }

    // Fetch data in parallel
    const [
      stripeBalance,
      subscriptions,
      recentCharges,
      dbBusinesses,
      dbTransactions
    ] = await Promise.all([
      stripe.balance.retrieve().catch(() => null),
      stripe.subscriptions.list({ limit: 100, expand: ['data.default_payment_method'] }).catch(() => ({ data: [] })),
      stripe.charges.list({ limit: 100, created: { gte: getMonthsAgo(6) } }).catch(() => ({ data: [] })),
      prisma.business.findMany({
        where: { isActive: true },
        select: {
          id: true,
          name: true,
          subscriptionPlan: true,
          subscriptionStatus: true,
          trialEndsAt: true,
          graceEndsAt: true,
          createdAt: true,
        }
      }),
      prisma.stripeTransaction.findMany({
        orderBy: { stripeCreatedAt: 'desc' },
        take: 10
      }).catch(() => [])
    ])

    // Categorize subscriptions
    const allSubs = subscriptions.data.filter(s =>
      s.metadata?.source === 'waveorder_platform' || !s.metadata?.source
    )

    const activePaid = allSubs.filter(s =>
      s.status === 'active' && !isFreePrice(s.items.data[0]?.price?.id)
    )
    const trialing = allSubs.filter(s => s.status === 'trialing')
    const paused = allSubs.filter(s => s.status === 'paused')
    const canceled = allSubs.filter(s => ['canceled', 'incomplete_expired'].includes(s.status))
    const freeSubs = allSubs.filter(s =>
      s.status === 'active' && isFreePrice(s.items.data[0]?.price?.id)
    )

    // Calculate MRR from active paid subscriptions
    let mrr = 0
    const revenueByPlan: Record<string, { subscribers: number; mrr: number }> = {}

    for (const sub of activePaid) {
      const priceId = sub.items.data[0]?.price?.id
      const price = sub.items.data[0]?.price
      if (!price) continue

      const plan = mapStripePlanToDb(priceId)
      let monthlyAmount = 0

      if (price.recurring?.interval === 'year') {
        monthlyAmount = (price.unit_amount || 0) / 100 / 12
      } else {
        monthlyAmount = (price.unit_amount || 0) / 100
      }

      mrr += monthlyAmount

      if (!revenueByPlan[plan]) {
        revenueByPlan[plan] = { subscribers: 0, mrr: 0 }
      }
      revenueByPlan[plan].subscribers++
      revenueByPlan[plan].mrr += monthlyAmount
    }

    const arr = mrr * 12
    const arpu = activePaid.length > 0 ? mrr / activePaid.length : 0

    // Calculate total revenue from charges
    const allCharges = recentCharges.data.filter(c => c.status === 'succeeded')
    const totalRevenue = allCharges.reduce((sum, c) => sum + c.amount, 0) / 100
    const totalRefunded = allCharges.reduce((sum, c) => sum + (c.amount_refunded || 0), 0) / 100
    const netRevenue = totalRevenue - totalRefunded

    // This month's revenue
    const thisMonthStart = new Date()
    thisMonthStart.setDate(1)
    thisMonthStart.setHours(0, 0, 0, 0)
    const thisMonthCharges = allCharges.filter(c => new Date(c.created * 1000) >= thisMonthStart)
    const thisMonthRevenue = thisMonthCharges.reduce((sum, c) => sum + c.amount, 0) / 100

    const lastMonthStart = new Date(thisMonthStart)
    lastMonthStart.setMonth(lastMonthStart.getMonth() - 1)
    const lastMonthCharges = allCharges.filter(c => {
      const d = new Date(c.created * 1000)
      return d >= lastMonthStart && d < thisMonthStart
    })
    const lastMonthRevenue = lastMonthCharges.reduce((sum, c) => sum + c.amount, 0) / 100
    const monthOverMonthChange = lastMonthRevenue > 0
      ? ((thisMonthRevenue - lastMonthRevenue) / lastMonthRevenue) * 100
      : thisMonthRevenue > 0 ? 100 : 0

    // Monthly revenue breakdown (last 6 months)
    const monthlyRevenue = buildMonthlyRevenue(allCharges, 6)

    // Trial funnel
    const endedTrials = dbBusinesses.filter(b =>
      b.trialEndsAt && new Date(b.trialEndsAt) < new Date()
    ).length
    const activeTrials = trialing.length + dbBusinesses.filter(b =>
      b.trialEndsAt && new Date(b.trialEndsAt) > new Date()
    ).length
    const convertedTrials = activePaid.length
    const conversionRate = endedTrials > 0
      ? (convertedTrials / (endedTrials + convertedTrials)) * 100
      : 0

    // Recent transactions (prefer DB, fallback to Stripe charges)
    const recentTransactions = dbTransactions.length > 0
      ? dbTransactions.map(t => ({
          id: t.stripeId,
          type: t.type,
          customerEmail: t.customerEmail,
          customerName: t.customerName,
          description: t.description,
          amount: t.amount / 100,
          currency: t.currency,
          status: t.status,
          date: t.stripeCreatedAt.toISOString(),
        }))
      : allCharges.slice(0, 5).map(c => ({
          id: c.id,
          type: 'charge',
          customerEmail: c.billing_details?.email || null,
          customerName: c.billing_details?.name || null,
          description: c.description || 'Payment',
          amount: c.amount / 100,
          currency: c.currency,
          status: c.status,
          date: new Date(c.created * 1000).toISOString(),
        }))

    // Stripe balance
    const available = stripeBalance?.available?.reduce((s, b) => s + b.amount, 0) || 0
    const pending = stripeBalance?.pending?.reduce((s, b) => s + b.amount, 0) || 0

    return NextResponse.json({
      revenue: {
        total: netRevenue,
        totalCharges: totalRevenue,
        totalRefunded,
        thisMonth: thisMonthRevenue,
        lastMonth: lastMonthRevenue,
        monthOverMonthChange: Math.round(monthOverMonthChange * 10) / 10,
      },
      mrr: Math.round(mrr * 100) / 100,
      arr: Math.round(arr * 100) / 100,
      arpu: Math.round(arpu * 100) / 100,
      stripeBalance: {
        available: available / 100,
        pending: pending / 100,
      },
      subscriptions: {
        paidActive: activePaid.length,
        trialing: activeTrials,
        paused: paused.length,
        canceled: canceled.length,
        free: freeSubs.length,
        total: dbBusinesses.length,
      },
      revenueByPlan,
      trialFunnel: {
        activeTrials,
        endedTrials,
        converted: convertedTrials,
        conversionRate: Math.round(conversionRate * 10) / 10,
      },
      monthlyRevenue,
      recentTransactions,
      currency: 'usd',
    })

  } catch (error: any) {
    console.error('Financial dashboard error:', error)
    return NextResponse.json(
      { message: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}

function getMonthsAgo(months: number): number {
  const d = new Date()
  d.setMonth(d.getMonth() - months)
  return Math.floor(d.getTime() / 1000)
}

function isFreePrice(priceId: string | undefined): boolean {
  if (!priceId) return true
  return (
    priceId === PLANS.STARTER.freePriceId ||
    priceId === PLANS.PRO.freePriceId ||
    priceId === PLANS.BUSINESS.freePriceId
  )
}

function buildMonthlyRevenue(charges: any[], months: number) {
  const result: Array<{ month: string; revenue: number; charges: number; refunds: number }> = []

  for (let i = months - 1; i >= 0; i--) {
    const d = new Date()
    d.setMonth(d.getMonth() - i)
    const monthStart = new Date(d.getFullYear(), d.getMonth(), 1)
    const monthEnd = new Date(d.getFullYear(), d.getMonth() + 1, 1)

    const monthCharges = charges.filter(c => {
      const cd = new Date(c.created * 1000)
      return cd >= monthStart && cd < monthEnd
    })

    const revenue = monthCharges.reduce((s: number, c: any) => s + (c.amount - (c.amount_refunded || 0)), 0) / 100
    const refunds = monthCharges.reduce((s: number, c: any) => s + (c.amount_refunded || 0), 0) / 100

    const monthLabel = monthStart.toLocaleDateString('en-US', { month: 'short', year: '2-digit' })

    result.push({
      month: monthLabel,
      revenue: Math.round(revenue * 100) / 100,
      charges: monthCharges.length,
      refunds: Math.round(refunds * 100) / 100,
    })
  }

  return result
}
