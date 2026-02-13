// app/api/superadmin/analytics/cx/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { getBillingTypeFromPriceId } from '@/lib/stripe'

// Plan pricing for CLV calculations
const PLAN_PRICES = {
  STARTER: { monthly: 19, yearly: 16 },
  PRO: { monthly: 39, yearly: 32 },
  BUSINESS: { monthly: 79, yearly: 66 }
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || session.user.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const timeRange = searchParams.get('range') || '30d'
    
    // Calculate date range
    const now = new Date()
    let startDate = new Date()
    switch (timeRange) {
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

    // === NPS CALCULATION ===
    const npsFeedbacks = await prisma.businessFeedback.findMany({
      where: {
        type: 'NPS',
        createdAt: { gte: startDate }
      },
      select: {
        rating: true,
        createdAt: true,
        businessId: true
      }
    })

    const promoters = npsFeedbacks.filter(f => f.rating >= 9).length
    const passives = npsFeedbacks.filter(f => f.rating >= 7 && f.rating <= 8).length
    const detractors = npsFeedbacks.filter(f => f.rating <= 6).length
    const totalNPSResponses = npsFeedbacks.length
    const nps = totalNPSResponses > 0 
      ? Math.round(((promoters - detractors) / totalNPSResponses) * 100)
      : null

    // NPS trend (last 6 months)
    const npsTrend = []
    for (let i = 5; i >= 0; i--) {
      const monthStart = new Date(now.getFullYear(), now.getMonth() - i, 1)
      const monthEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 0)
      
      const monthFeedbacks = npsFeedbacks.filter(f => {
        const created = new Date(f.createdAt)
        return created >= monthStart && created <= monthEnd
      })
      
      const monthPromoters = monthFeedbacks.filter(f => f.rating >= 9).length
      const monthDetractors = monthFeedbacks.filter(f => f.rating <= 6).length
      const monthTotal = monthFeedbacks.length
      const monthNPS = monthTotal > 0 
        ? Math.round(((monthPromoters - monthDetractors) / monthTotal) * 100)
        : null

      npsTrend.push({
        month: monthStart.toISOString().slice(0, 7),
        monthLabel: monthStart.toLocaleDateString('en-US', { month: 'short', year: '2-digit' }),
        nps: monthNPS,
        responses: monthTotal
      })
    }

    // === CSAT CALCULATION ===
    const allFeedbacks = await prisma.businessFeedback.findMany({
      where: {
        createdAt: { gte: startDate }
      },
      select: {
        rating: true,
        type: true,
        createdAt: true
      }
    })

    const csatScore = allFeedbacks.length > 0
      ? Math.round((allFeedbacks.reduce((sum, f) => sum + f.rating, 0) / allFeedbacks.length) * 10) / 10
      : null

    // CSAT by type
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

    // CSAT trend
    const csatTrend = []
    for (let i = 5; i >= 0; i--) {
      const monthStart = new Date(now.getFullYear(), now.getMonth() - i, 1)
      const monthEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 0)
      
      const monthFeedbacks = allFeedbacks.filter(f => {
        const created = new Date(f.createdAt)
        return created >= monthStart && created <= monthEnd
      })
      
      const monthCSAT = monthFeedbacks.length > 0
        ? Math.round((monthFeedbacks.reduce((sum, f) => sum + f.rating, 0) / monthFeedbacks.length) * 10) / 10
        : null

      csatTrend.push({
        month: monthStart.toISOString().slice(0, 7),
        monthLabel: monthStart.toLocaleDateString('en-US', { month: 'short', year: '2-digit' }),
        csat: monthCSAT,
        responses: monthFeedbacks.length
      })
    }

    // === CES (Customer Effort Score) ===
    // Calculate from onboarding completion time and first order time
    const businessesWithOnboarding = await prisma.business.findMany({
      where: {
        onboardingCompleted: true,
        onboardingCompletedAt: { not: null, gte: startDate },
        testMode: { not: true }
      },
      select: {
        id: true,
        onboardingCompletedAt: true,
        createdAt: true,
        orders: {
          take: 1,
          orderBy: { createdAt: 'asc' },
          select: { createdAt: true }
        }
      }
    })

    const onboardingTimes: number[] = []
    const firstOrderTimes: number[] = []

    businessesWithOnboarding.forEach(business => {
      if (business.onboardingCompletedAt) {
        const onboardingTime = (new Date(business.onboardingCompletedAt).getTime() - new Date(business.createdAt).getTime()) / (1000 * 60 * 60) // hours
        onboardingTimes.push(onboardingTime)
      }
      
      if (business.orders.length > 0) {
        const firstOrderTime = (new Date(business.orders[0].createdAt).getTime() - new Date(business.createdAt).getTime()) / (1000 * 60 * 60 * 24) // days
        firstOrderTimes.push(firstOrderTime)
      }
    })

    const avgOnboardingTime = onboardingTimes.length > 0
      ? Math.round((onboardingTimes.reduce((a, b) => a + b, 0) / onboardingTimes.length) * 10) / 10
      : null

    const avgTimeToFirstOrder = firstOrderTimes.length > 0
      ? Math.round((firstOrderTimes.reduce((a, b) => a + b, 0) / firstOrderTimes.length) * 10) / 10
      : null

    // CES score (inverse of effort - lower time = higher score, normalized to 1-5)
    const cesScore = avgOnboardingTime !== null && avgTimeToFirstOrder !== null
      ? Math.max(1, Math.min(5, 5 - (avgOnboardingTime / 24) * 0.5 - (avgTimeToFirstOrder / 7) * 0.5))
      : null

    // === CHURN RATE ===
    const allBusinesses = await prisma.business.findMany({
      where: {
        testMode: { not: true }
      },
      select: {
        id: true,
        isActive: true,
        deactivatedAt: true,
        createdAt: true
      }
    })

    const activeBusinesses = allBusinesses.filter(b => b.isActive).length
    const churnedBusinesses = allBusinesses.filter(b => !b.isActive && b.deactivatedAt && new Date(b.deactivatedAt) >= startDate).length
    
    // Calculate churn rate for the period
    const businessesAtStart = allBusinesses.filter(b => new Date(b.createdAt) < startDate).length
    const churnRate = businessesAtStart > 0
      ? Math.round((churnedBusinesses / businessesAtStart) * 100 * 10) / 10
      : 0

    // Churn trend
    const churnTrend = []
    for (let i = 5; i >= 0; i--) {
      const monthStart = new Date(now.getFullYear(), now.getMonth() - i, 1)
      const monthEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 0)
      
      const businessesAtMonthStart = allBusinesses.filter(b => new Date(b.createdAt) < monthStart).length
      const churnedThisMonth = allBusinesses.filter(b => 
        !b.isActive && 
        b.deactivatedAt && 
        new Date(b.deactivatedAt) >= monthStart && 
        new Date(b.deactivatedAt) <= monthEnd
      ).length
      
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

    // Churn reasons (from deactivationReason)
    const churnedWithReasons = await prisma.business.findMany({
      where: {
        isActive: false,
        deactivatedAt: { not: null, gte: startDate },
        deactivationReason: { not: null }
      },
      select: {
        deactivationReason: true
      }
    })

    const churnReasons: Record<string, number> = {}
    churnedWithReasons.forEach(b => {
      const reason = b.deactivationReason || 'Unknown'
      churnReasons[reason] = (churnReasons[reason] || 0) + 1
    })

    // === CLV (Customer Lifetime Value) ===
    const businessesWithSubscriptions = await prisma.business.findMany({
      where: {
        isActive: true,
        testMode: { not: true }
      },
      include: {
        users: {
          where: { role: 'OWNER' },
          include: {
            user: {
              include: {
                subscription: true
              }
            }
          }
        }
      }
    })

    const clvData: number[] = []
    businessesWithSubscriptions.forEach(business => {
      const owner = business.users.find(u => u.role === 'OWNER')?.user
      const subscriptionPriceId = owner?.subscription?.priceId
      const plan = business.subscriptionPlan as 'STARTER' | 'PRO' | 'BUSINESS'
      
      const isOnTrial = business.trialEndsAt && new Date(business.trialEndsAt) > now
      let billingType: 'free' | 'trial' | 'monthly' | 'yearly' = 'free'
      
      if (isOnTrial) {
        billingType = 'trial'
      } else if (subscriptionPriceId) {
        const stripeBillingType = getBillingTypeFromPriceId(subscriptionPriceId)
        if (stripeBillingType && ['free', 'monthly', 'yearly'].includes(stripeBillingType)) {
          billingType = stripeBillingType as 'free' | 'monthly' | 'yearly'
        }
      }

      if (billingType === 'monthly' || billingType === 'yearly') {
        const monthlyRevenue = billingType === 'monthly'
          ? PLAN_PRICES[plan]?.monthly || 0
          : PLAN_PRICES[plan]?.yearly || 0
        
        // Calculate tenure in months
        const createdAt = new Date(business.createdAt)
        const monthsSinceCreation = Math.max(1, Math.floor((now.getTime() - createdAt.getTime()) / (1000 * 60 * 60 * 24 * 30)))
        
        // CLV = monthly revenue * average customer lifetime (in months)
        // For now, use tenure as proxy, but ideally use churn rate to estimate lifetime
        const estimatedLifetimeMonths = monthsSinceCreation > 0 ? monthsSinceCreation : 1
        const clv = monthlyRevenue * estimatedLifetimeMonths
        clvData.push(clv)
      }
    })

    const avgCLV = clvData.length > 0
      ? Math.round((clvData.reduce((a, b) => a + b, 0) / clvData.length) * 100) / 100
      : null

    // CLV by plan
    const clvByPlan: Record<string, { avgCLV: number; count: number }> = {}
    const planGroups: Record<string, number[]> = {}
    
    businessesWithSubscriptions.forEach(business => {
      const owner = business.users.find(u => u.role === 'OWNER')?.user
      const subscriptionPriceId = owner?.subscription?.priceId
      const plan = business.subscriptionPlan as 'STARTER' | 'PRO' | 'BUSINESS'
      
      const isOnTrial = business.trialEndsAt && new Date(business.trialEndsAt) > now
      let billingType: 'free' | 'trial' | 'monthly' | 'yearly' = 'free'
      
      if (isOnTrial) {
        billingType = 'trial'
      } else if (subscriptionPriceId) {
        const stripeBillingType = getBillingTypeFromPriceId(subscriptionPriceId)
        if (stripeBillingType && ['free', 'monthly', 'yearly'].includes(stripeBillingType)) {
          billingType = stripeBillingType as 'free' | 'monthly' | 'yearly'
        }
      }

      if (billingType === 'monthly' || billingType === 'yearly') {
        const monthlyRevenue = billingType === 'monthly'
          ? PLAN_PRICES[plan]?.monthly || 0
          : PLAN_PRICES[plan]?.yearly || 0
        
        const createdAt = new Date(business.createdAt)
        const monthsSinceCreation = Math.max(1, Math.floor((now.getTime() - createdAt.getTime()) / (1000 * 60 * 60 * 24 * 30)))
        const clv = monthlyRevenue * monthsSinceCreation
        
        if (!planGroups[plan]) planGroups[plan] = []
        planGroups[plan].push(clv)
      }
    })

    Object.keys(planGroups).forEach(plan => {
      const clvs = planGroups[plan]
      if (clvs.length > 0) {
        clvByPlan[plan] = {
          avgCLV: Math.round((clvs.reduce((a, b) => a + b, 0) / clvs.length) * 100) / 100,
          count: clvs.length
        }
      }
    })

    // === SUPPORT METRICS ===
    const supportTickets = await prisma.supportTicket.findMany({
      where: {
        createdAt: { gte: startDate }
      },
      include: {
        comments: {
          orderBy: { createdAt: 'asc' },
          select: { createdAt: true, authorId: true }
        }
      }
    })

    // First Response Time (FRT)
    const frtData: number[] = []
    supportTickets.forEach(ticket => {
      if (ticket.comments.length > 0) {
        const firstComment = ticket.comments[0]
        const ticketCreated = new Date(ticket.createdAt)
        const firstResponse = new Date(firstComment.createdAt)
        const hours = (firstResponse.getTime() - ticketCreated.getTime()) / (1000 * 60 * 60)
        frtData.push(hours)
      }
    })

    const avgFRT = frtData.length > 0
      ? Math.round((frtData.reduce((a, b) => a + b, 0) / frtData.length) * 10) / 10
      : null

    // First Contact Resolution (FCR)
    const resolvedTickets = supportTickets.filter(t => 
      t.status === 'RESOLVED' || t.status === 'CLOSED'
    )
    const singleInteractionResolved = resolvedTickets.filter(ticket => {
      // Count tickets resolved with only 1 comment (first response resolved it)
      // Note: This is a simplified FCR calculation - ideally we'd check if resolution happened on first response
      return ticket.comments.length === 1
    }).length

    const fcr = resolvedTickets.length > 0
      ? Math.round((singleInteractionResolved / resolvedTickets.length) * 100 * 10) / 10
      : null

    // Support ticket volume trend
    const supportTrend = []
    for (let i = 5; i >= 0; i--) {
      const monthStart = new Date(now.getFullYear(), now.getMonth() - i, 1)
      const monthEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 0)
      
      const monthTickets = supportTickets.filter(t => {
        const created = new Date(t.createdAt)
        return created >= monthStart && created <= monthEnd
      })
      
      const monthResolved = monthTickets.filter(t => 
        t.status === 'RESOLVED' || t.status === 'CLOSED'
      ).length
      const monthSingleInteraction = monthTickets.filter(t => {
        if (t.status !== 'RESOLVED' && t.status !== 'CLOSED') return false
        // Simplified: tickets resolved with only 1 comment
        return t.comments.length === 1
      }).length
      
      const monthFRT = monthTickets.filter(t => t.comments.length > 0).map(t => {
        const ticketCreated = new Date(t.createdAt)
        const firstResponse = new Date(t.comments[0].createdAt)
        return (firstResponse.getTime() - ticketCreated.getTime()) / (1000 * 60 * 60)
      })
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

    // Support tickets by type
    const ticketsByType: Record<string, number> = {}
    supportTickets.forEach(ticket => {
      ticketsByType[ticket.type] = (ticketsByType[ticket.type] || 0) + 1
    })

    // === AT-RISK CUSTOMERS ===
    // Businesses with low engagement, multiple support tickets, or low feedback scores
    const atRiskBusinesses = await prisma.business.findMany({
      where: {
        isActive: true,
        testMode: { not: true }
      },
      include: {
        supportTickets: {
          where: {
            createdAt: { gte: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000) } // Last 30 days
          }
        },
        feedbacks: {
          where: {
            createdAt: { gte: new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000) } // Last 90 days
          },
          orderBy: { createdAt: 'desc' },
          take: 1
        },
        orders: {
          where: {
            createdAt: { gte: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000) } // Last 30 days
          }
        }
      }
    })

    const atRisk: Array<{
      id: string
      name: string
      riskScore: number
      reasons: string[]
      lastOrderDate: string | null
      supportTicketsCount: number
      lastFeedbackRating: number | null
    }> = []

    atRiskBusinesses.forEach(business => {
      const reasons: string[] = []
      let riskScore = 0

      // Check for low/no orders in last 30 days
      if (business.orders.length === 0) {
        reasons.push('No orders in last 30 days')
        riskScore += 30
      } else if (business.orders.length < 3) {
        reasons.push('Low order activity')
        riskScore += 15
      }

      // Check for multiple support tickets
      if (business.supportTickets.length >= 3) {
        reasons.push(`${business.supportTickets.length} support tickets in last 30 days`)
        riskScore += 25
      } else if (business.supportTickets.length >= 2) {
        reasons.push('Multiple support tickets')
        riskScore += 10
      }

      // Check for low feedback scores
      if (business.feedbacks.length > 0) {
        const lastFeedback = business.feedbacks[0]
        if (lastFeedback.rating <= 2) {
          reasons.push('Low feedback rating')
          riskScore += 35
        } else if (lastFeedback.rating <= 3) {
          reasons.push('Below average feedback')
          riskScore += 15
        }
      }

      // Check for long time since last order
      if (business.orders.length > 0) {
        const lastOrder = business.orders[business.orders.length - 1]
        const daysSinceLastOrder = (now.getTime() - new Date(lastOrder.createdAt).getTime()) / (1000 * 60 * 60 * 24)
        if (daysSinceLastOrder > 14) {
          reasons.push('No recent orders')
          riskScore += 20
        }
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

    // Sort by risk score and take top 20
    const topAtRisk = atRisk.sort((a, b) => b.riskScore - a.riskScore).slice(0, 20)

    return NextResponse.json({
      // NPS Metrics
      nps: {
        score: nps,
        promoters,
        passives,
        detractors,
        totalResponses: totalNPSResponses,
        trend: npsTrend
      },
      
      // CSAT Metrics
      csat: {
        score: csatScore,
        totalResponses: allFeedbacks.length,
        byType: csatByType,
        trend: csatTrend
      },
      
      // CES Metrics
      ces: {
        score: cesScore,
        avgOnboardingTimeHours: avgOnboardingTime,
        avgTimeToFirstOrderDays: avgTimeToFirstOrder,
        businessesAnalyzed: businessesWithOnboarding.length
      },
      
      // Churn Metrics
      churn: {
        rate: churnRate,
        churnedThisPeriod: churnedBusinesses,
        activeBusinesses,
        trend: churnTrend,
        reasons: churnReasons
      },
      
      // CLV Metrics
      clv: {
        average: avgCLV,
        byPlan: clvByPlan,
        businessesAnalyzed: clvData.length
      },
      
      // Support Metrics
      support: {
        avgFirstResponseTimeHours: avgFRT,
        firstContactResolutionRate: fcr,
        totalTickets: supportTickets.length,
        resolvedTickets: resolvedTickets.length,
        trend: supportTrend,
        byType: ticketsByType
      },
      
      // At-Risk Customers
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
