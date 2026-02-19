// CX Analytics API — enhanced with Stripe data for accurate churn/CLV
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { stripe, mapStripePlanToDb, fetchAllStripeRecords } from '@/lib/stripe'
import Stripe from 'stripe'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || session.user.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const timeRange = searchParams.get('range') || '30d'
    
    const now = new Date()

    let startDate = new Date()
    switch (timeRange) {
      case '7d': startDate.setDate(now.getDate() - 7); break
      case '30d': startDate.setDate(now.getDate() - 30); break
      case '90d': startDate.setDate(now.getDate() - 90); break
      case '1y': startDate.setFullYear(now.getFullYear() - 1); break
      default: startDate.setDate(now.getDate() - 30)
    }

    // Fetch Stripe subscriptions and DB transactions in parallel with other queries
    const [
      npsFeedbacks,
      allFeedbacks,
      businessesWithOnboarding,
      allBusinesses,
      supportTickets,
      atRiskBusinesses,
      stripeSubscriptions,
      dbTransactions
    ] = await Promise.all([
      // NPS
      prisma.businessFeedback.findMany({
        where: { type: 'NPS', createdAt: { gte: startDate } },
        select: { rating: true, createdAt: true, businessId: true }
      }),
      // All feedback
      prisma.businessFeedback.findMany({
        where: { createdAt: { gte: startDate } },
        select: { rating: true, type: true, createdAt: true }
      }),
      // Onboarding
      prisma.business.findMany({
        where: {
          onboardingCompleted: true,
          onboardingCompletedAt: { not: null, gte: startDate },
          testMode: { not: true }
        },
        select: {
          id: true, onboardingCompletedAt: true, createdAt: true,
          orders: { take: 1, orderBy: { createdAt: 'asc' }, select: { createdAt: true } }
        }
      }),
      // All businesses for churn
      prisma.business.findMany({
        where: { testMode: { not: true } },
        select: { id: true, isActive: true, deactivatedAt: true, createdAt: true }
      }),
      // Support tickets
      prisma.supportTicket.findMany({
        where: { createdAt: { gte: startDate } },
        include: {
          comments: { orderBy: { createdAt: 'asc' }, select: { createdAt: true, authorId: true } }
        }
      }),
      // At-risk businesses
      prisma.business.findMany({
        where: { isActive: true, testMode: { not: true } },
        include: {
          supportTickets: { where: { createdAt: { gte: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000) } } },
          feedbacks: { where: { createdAt: { gte: new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000) } }, orderBy: { createdAt: 'desc' }, take: 1 },
          orders: { where: { createdAt: { gte: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000) } } }
        }
      }),
      // ALL Stripe subscriptions (auto-paginated) for churn/CLV
      fetchAllStripeRecords((p) => stripe.subscriptions.list(p), { status: 'all' }).catch(() => [] as Stripe.Subscription[]),
      // DB transactions for actual revenue CLV
      prisma.stripeTransaction.findMany({
        where: { status: { in: ['succeeded', 'paid'] } },
        select: { amount: true, stripeCreatedAt: true, customerId: true, userId: true, businessId: true }
      }).catch(() => [])
    ])

    // This Stripe account is dedicated to WaveOrder — all subscriptions are ours

    // === NPS CALCULATION ===
    const promoters = npsFeedbacks.filter(f => f.rating >= 9).length
    const passives = npsFeedbacks.filter(f => f.rating >= 7 && f.rating <= 8).length
    const detractors = npsFeedbacks.filter(f => f.rating <= 6).length
    const totalNPSResponses = npsFeedbacks.length
    const nps = totalNPSResponses > 0
      ? Math.round(((promoters - detractors) / totalNPSResponses) * 100)
      : null

    const npsTrend = buildMonthlyTrend(npsFeedbacks, now, (monthFeedbacks) => {
      const p = monthFeedbacks.filter(f => f.rating >= 9).length
      const d = monthFeedbacks.filter(f => f.rating <= 6).length
      const total = monthFeedbacks.length
      return { nps: total > 0 ? Math.round(((p - d) / total) * 100) : null, responses: total }
    })

    // === CSAT CALCULATION ===
    const csatScore = allFeedbacks.length > 0
      ? Math.round((allFeedbacks.reduce((sum, f) => sum + f.rating, 0) / allFeedbacks.length) * 10) / 10
      : null

    const csatByType: Record<string, { score: number; count: number }> = {}
    const feedbackTypes = ['INITIAL', 'PERIODIC', 'NPS', 'FEATURE_REQUEST', 'SUPPORT', 'OTHER']
    feedbackTypes.forEach(type => {
      const typeFeedbacks = allFeedbacks.filter(f => f.type === type)
      if (typeFeedbacks.length > 0) {
        csatByType[type] = {
          score: Math.round((typeFeedbacks.reduce((sum, f) => sum + f.rating, 0) / typeFeedbacks.length) * 10) / 10,
          count: typeFeedbacks.length
        }
      }
    })

    const csatTrend = buildMonthlyTrend(allFeedbacks, now, (monthFeedbacks) => {
      const score = monthFeedbacks.length > 0
        ? Math.round((monthFeedbacks.reduce((s, f) => s + f.rating, 0) / monthFeedbacks.length) * 10) / 10
        : null
      return { csat: score, responses: monthFeedbacks.length }
    })

    // === CES (Customer Effort Score) ===
    const onboardingTimes: number[] = []
    const firstOrderTimes: number[] = []

    businessesWithOnboarding.forEach(business => {
      if (business.onboardingCompletedAt) {
        const hrs = (new Date(business.onboardingCompletedAt).getTime() - new Date(business.createdAt).getTime()) / (1000 * 60 * 60)
        onboardingTimes.push(hrs)
      }
      if (business.orders.length > 0) {
        const days = (new Date(business.orders[0].createdAt).getTime() - new Date(business.createdAt).getTime()) / (1000 * 60 * 60 * 24)
        firstOrderTimes.push(days)
      }
    })

    const avgOnboardingTime = onboardingTimes.length > 0
      ? Math.round((onboardingTimes.reduce((a, b) => a + b, 0) / onboardingTimes.length) * 10) / 10
      : null
    const avgTimeToFirstOrder = firstOrderTimes.length > 0
      ? Math.round((firstOrderTimes.reduce((a, b) => a + b, 0) / firstOrderTimes.length) * 10) / 10
      : null
    const cesScore = avgOnboardingTime !== null && avgTimeToFirstOrder !== null
      ? Math.max(1, Math.min(5, 5 - (avgOnboardingTime / 24) * 0.5 - (avgTimeToFirstOrder / 7) * 0.5))
      : null

    // === ENHANCED CHURN RATE (DB + Stripe) ===
    const activeBusinesses = allBusinesses.filter(b => b.isActive).length
    const dbChurned = allBusinesses.filter(b =>
      !b.isActive && b.deactivatedAt && new Date(b.deactivatedAt) >= startDate
    ).length

    // Stripe-detected churn: canceled subscriptions in the period
    const stripeCanceled = stripeSubscriptions.filter(s => {
      if (s.status !== 'canceled') return false
      const canceledAt = s.canceled_at ? new Date(s.canceled_at * 1000) : null
      return canceledAt && canceledAt >= startDate
    }).length

    // Use whichever is higher (some churn only visible in Stripe, some only in DB)
    const churnedBusinesses = Math.max(dbChurned, stripeCanceled)
    const businessesAtStart = allBusinesses.filter(b => new Date(b.createdAt) < startDate).length
    const churnRate = businessesAtStart > 0
      ? Math.round((churnedBusinesses / businessesAtStart) * 100 * 10) / 10
      : 0

    // Revenue churn: MRR lost from canceled subscriptions
    let revenueChurnMRR = 0
    stripeSubscriptions
      .filter(s => s.status === 'canceled' && s.canceled_at && new Date(s.canceled_at * 1000) >= startDate)
      .forEach(s => {
        const price = s.items.data[0]?.price
        if (!price || !price.unit_amount) return
        const monthlyAmount = price.recurring?.interval === 'year'
          ? price.unit_amount / 100 / 12
          : price.unit_amount / 100
        revenueChurnMRR += monthlyAmount
      })

    const churnTrend = []
    for (let i = 5; i >= 0; i--) {
      const monthStart = new Date(now.getFullYear(), now.getMonth() - i, 1)
      const monthEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 0)

      const businessesAtMonthStart = allBusinesses.filter(b => new Date(b.createdAt) < monthStart).length
      const dbChurnedThisMonth = allBusinesses.filter(b =>
        !b.isActive && b.deactivatedAt &&
        new Date(b.deactivatedAt) >= monthStart && new Date(b.deactivatedAt) <= monthEnd
      ).length
      const stripeChurnedThisMonth = stripeSubscriptions.filter(s => {
        if (s.status !== 'canceled' || !s.canceled_at) return false
        const d = new Date(s.canceled_at * 1000)
        return d >= monthStart && d <= monthEnd
      }).length

      const churnedThisMonth = Math.max(dbChurnedThisMonth, stripeChurnedThisMonth)
      const monthChurnRate = businessesAtMonthStart > 0
        ? Math.round((churnedThisMonth / businessesAtMonthStart) * 100 * 10) / 10
        : 0

      churnTrend.push({
        month: monthStart.toISOString().slice(0, 7),
        monthLabel: monthStart.toLocaleDateString('en-US', { month: 'short', year: '2-digit' }),
        churnRate: monthChurnRate,
        churned: churnedThisMonth,
        totalAtStart: businessesAtMonthStart
      })
    }

    const churnedWithReasons = await prisma.business.findMany({
      where: { isActive: false, deactivatedAt: { not: null, gte: startDate }, deactivationReason: { not: null } },
      select: { deactivationReason: true }
    })
    const churnReasons: Record<string, number> = {}
    churnedWithReasons.forEach(b => {
      const reason = b.deactivationReason || 'Unknown'
      churnReasons[reason] = (churnReasons[reason] || 0) + 1
    })

    // === ENHANCED CLV (Stripe-based) ===
    // Try to use actual transaction data first, fall back to subscription-based estimate
    let avgCLV: number | null = null
    const clvByPlan: Record<string, { avgCLV: number; count: number }> = {}

    if (dbTransactions.length > 0) {
      // Group transactions by business/customer
      const revenueByBusiness: Record<string, { total: number; plan: string }> = {}

      // Get business owner mapping for plan info
      const businessOwners = await prisma.business.findMany({
        where: { isActive: true, testMode: { not: true } },
        select: {
          id: true,
          subscriptionPlan: true,
          createdAt: true,
          users: { where: { role: 'OWNER' }, select: { user: { select: { stripeCustomerId: true } } } }
        }
      })

      const customerToBusinessMap = new Map<string, { businessId: string; plan: string; createdAt: Date }>()
      businessOwners.forEach(b => {
        const customerId = b.users[0]?.user?.stripeCustomerId
        if (customerId) {
          customerToBusinessMap.set(customerId, {
            businessId: b.id,
            plan: b.subscriptionPlan,
            createdAt: b.createdAt
          })
        }
      })

      dbTransactions.forEach(t => {
        const key = t.businessId || t.customerId || 'unknown'
        if (!revenueByBusiness[key]) {
          const bizInfo = t.customerId ? customerToBusinessMap.get(t.customerId) : null
          revenueByBusiness[key] = { total: 0, plan: bizInfo?.plan || 'STARTER' }
        }
        revenueByBusiness[key].total += t.amount / 100
      })

      const clvValues = Object.values(revenueByBusiness).map(r => r.total).filter(v => v > 0)
      avgCLV = clvValues.length > 0
        ? Math.round((clvValues.reduce((a, b) => a + b, 0) / clvValues.length) * 100) / 100
        : null

      // CLV by plan
      const planCLVGroups: Record<string, number[]> = {}
      Object.values(revenueByBusiness).forEach(r => {
        if (r.total > 0) {
          if (!planCLVGroups[r.plan]) planCLVGroups[r.plan] = []
          planCLVGroups[r.plan].push(r.total)
        }
      })
      Object.entries(planCLVGroups).forEach(([plan, values]) => {
        clvByPlan[plan] = {
          avgCLV: Math.round((values.reduce((a, b) => a + b, 0) / values.length) * 100) / 100,
          count: values.length
        }
      })
    } else {
      // Fallback: estimate CLV from Stripe subscriptions
      const activeSubs = stripeSubscriptions.filter(s => s.status === 'active')
      const clvValues: number[] = []
      const planCLVGroups: Record<string, number[]> = {}

      activeSubs.forEach(s => {
        const price = s.items.data[0]?.price
        if (!price?.unit_amount) return

        const monthlyAmount = price.recurring?.interval === 'year'
          ? price.unit_amount / 100 / 12
          : price.unit_amount / 100

        const createdAt = new Date(s.created * 1000)
        const monthsTenure = Math.max(1, Math.floor((now.getTime() - createdAt.getTime()) / (1000 * 60 * 60 * 24 * 30)))
        const clv = monthlyAmount * monthsTenure
        clvValues.push(clv)

        const plan = mapStripePlanToDb(price.id)
        if (!planCLVGroups[plan]) planCLVGroups[plan] = []
        planCLVGroups[plan].push(clv)
      })

      avgCLV = clvValues.length > 0
        ? Math.round((clvValues.reduce((a, b) => a + b, 0) / clvValues.length) * 100) / 100
        : null

      Object.entries(planCLVGroups).forEach(([plan, values]) => {
        clvByPlan[plan] = {
          avgCLV: Math.round((values.reduce((a, b) => a + b, 0) / values.length) * 100) / 100,
          count: values.length
        }
      })
    }

    // === SUPPORT METRICS ===
    const frtData: number[] = []
    supportTickets.forEach(ticket => {
      if (ticket.comments.length > 0) {
        const hrs = (new Date(ticket.comments[0].createdAt).getTime() - new Date(ticket.createdAt).getTime()) / (1000 * 60 * 60)
        frtData.push(hrs)
      }
    })

    const avgFRT = frtData.length > 0
      ? Math.round((frtData.reduce((a, b) => a + b, 0) / frtData.length) * 10) / 10
      : null

    const resolvedTickets = supportTickets.filter(t => t.status === 'RESOLVED' || t.status === 'CLOSED')
    const singleInteractionResolved = resolvedTickets.filter(t => t.comments.length === 1).length
    const fcr = resolvedTickets.length > 0
      ? Math.round((singleInteractionResolved / resolvedTickets.length) * 100 * 10) / 10
      : null

    const supportTrend = []
    for (let i = 5; i >= 0; i--) {
      const monthStart = new Date(now.getFullYear(), now.getMonth() - i, 1)
      const monthEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 0)

      const monthTickets = supportTickets.filter(t => {
        const created = new Date(t.createdAt)
        return created >= monthStart && created <= monthEnd
      })
      const monthResolved = monthTickets.filter(t => t.status === 'RESOLVED' || t.status === 'CLOSED').length
      const monthSingleInteraction = monthTickets.filter(t =>
        (t.status === 'RESOLVED' || t.status === 'CLOSED') && t.comments.length === 1
      ).length
      const monthFRT = monthTickets.filter(t => t.comments.length > 0).map(t =>
        (new Date(t.comments[0].createdAt).getTime() - new Date(t.createdAt).getTime()) / (1000 * 60 * 60)
      )
      const avgMonthFRT = monthFRT.length > 0
        ? Math.round((monthFRT.reduce((a, b) => a + b, 0) / monthFRT.length) * 10) / 10
        : null

      supportTrend.push({
        month: monthStart.toISOString().slice(0, 7),
        monthLabel: monthStart.toLocaleDateString('en-US', { month: 'short', year: '2-digit' }),
        tickets: monthTickets.length,
        resolved: monthResolved,
        fcr: monthResolved > 0 ? Math.round((monthSingleInteraction / monthResolved) * 100 * 10) / 10 : null,
        avgFRT: avgMonthFRT
      })
    }

    const ticketsByType: Record<string, number> = {}
    supportTickets.forEach(ticket => {
      ticketsByType[ticket.type] = (ticketsByType[ticket.type] || 0) + 1
    })

    // === AT-RISK CUSTOMERS ===
    const atRisk: Array<{
      id: string; name: string; riskScore: number; reasons: string[]
      lastOrderDate: string | null; supportTicketsCount: number; lastFeedbackRating: number | null
    }> = []

    atRiskBusinesses.forEach(business => {
      const reasons: string[] = []
      let riskScore = 0

      if (business.orders.length === 0) {
        reasons.push('No orders in last 30 days')
        riskScore += 30
      } else if (business.orders.length < 3) {
        reasons.push('Low order activity')
        riskScore += 15
      }
      if (business.supportTickets.length >= 3) {
        reasons.push(`${business.supportTickets.length} support tickets in last 30 days`)
        riskScore += 25
      } else if (business.supportTickets.length >= 2) {
        reasons.push('Multiple support tickets')
        riskScore += 10
      }
      if (business.feedbacks.length > 0) {
        const lastFeedback = business.feedbacks[0]
        if (lastFeedback.rating <= 2) { reasons.push('Low feedback rating'); riskScore += 35 }
        else if (lastFeedback.rating <= 3) { reasons.push('Below average feedback'); riskScore += 15 }
      }
      if (business.orders.length > 0) {
        const lastOrder = business.orders[business.orders.length - 1]
        const daysSinceLastOrder = (now.getTime() - new Date(lastOrder.createdAt).getTime()) / (1000 * 60 * 60 * 24)
        if (daysSinceLastOrder > 14) { reasons.push('No recent orders'); riskScore += 20 }
      }

      if (riskScore > 0) {
        atRisk.push({
          id: business.id,
          name: business.name,
          riskScore,
          reasons,
          lastOrderDate: business.orders.length > 0 ? business.orders[business.orders.length - 1].createdAt.toISOString() : null,
          supportTicketsCount: business.supportTickets.length,
          lastFeedbackRating: business.feedbacks.length > 0 ? business.feedbacks[0].rating : null
        })
      }
    })

    const topAtRisk = atRisk.sort((a, b) => b.riskScore - a.riskScore).slice(0, 20)

    return NextResponse.json({
      nps: {
        score: nps,
        promoters,
        passives,
        detractors,
        totalResponses: totalNPSResponses,
        trend: npsTrend
      },
      csat: {
        score: csatScore,
        totalResponses: allFeedbacks.length,
        byType: csatByType,
        trend: csatTrend
      },
      ces: {
        score: cesScore !== null ? Math.round(cesScore * 10) / 10 : null,
        avgOnboardingTimeHours: avgOnboardingTime,
        avgTimeToFirstOrderDays: avgTimeToFirstOrder,
        businessesAnalyzed: businessesWithOnboarding.length
      },
      churn: {
        rate: churnRate,
        churnedThisPeriod: churnedBusinesses,
        activeBusinesses,
        revenueChurnMRR: Math.round(revenueChurnMRR * 100) / 100,
        trend: churnTrend,
        reasons: churnReasons,
        dataSource: 'stripe_enhanced',
      },
      clv: {
        average: avgCLV,
        byPlan: clvByPlan,
        businessesAnalyzed: Object.values(clvByPlan).reduce((s, p) => s + p.count, 0),
        dataSource: dbTransactions.length > 0 ? 'transactions' : 'stripe_estimate',
      },
      support: {
        avgFirstResponseTimeHours: avgFRT,
        firstContactResolutionRate: fcr,
        totalTickets: supportTickets.length,
        resolvedTickets: resolvedTickets.length,
        trend: supportTrend,
        byType: ticketsByType
      },
      atRisk: {
        count: topAtRisk.length,
        businesses: topAtRisk
      }
    })

  } catch (error) {
    console.error('Error fetching CX analytics:', error)
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    )
  }
}

function buildMonthlyTrend<T extends { createdAt: Date }, R>(
  items: T[],
  now: Date,
  computeFn: (monthItems: T[]) => R
): Array<{ month: string; monthLabel: string } & R> {
  const result: Array<{ month: string; monthLabel: string } & R> = []
  for (let i = 5; i >= 0; i--) {
    const monthStart = new Date(now.getFullYear(), now.getMonth() - i, 1)
    const monthEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 0)
    const monthItems = items.filter(f => {
      const d = new Date(f.createdAt)
      return d >= monthStart && d <= monthEnd
    })
    result.push({
      month: monthStart.toISOString().slice(0, 7),
      monthLabel: monthStart.toLocaleDateString('en-US', { month: 'short', year: '2-digit' }),
      ...computeFn(monthItems)
    })
  }
  return result
}
