// Financial Analytics API — uses real Stripe data + DB context
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { stripe, mapStripePlanToDb, getBillingTypeFromPriceId, PLANS, fetchAllStripeRecords, isWaveOrderSubscription } from '@/lib/stripe'
import Stripe from 'stripe'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || session.user.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
    }

    const now = new Date()

    // Fetch ALL Stripe subscriptions (auto-paginated) and DB businesses in parallel
    const [rawSubsArray, businesses, deactivatedBusinesses, dbTransactions] = await Promise.all([
      fetchAllStripeRecords((p) => stripe.subscriptions.list(p), {}).catch(() => [] as Stripe.Subscription[]),
      prisma.business.findMany({
        where: { isActive: true, testMode: { not: true } },
        include: {
          users: {
            where: { role: 'OWNER' },
            include: {
              user: {
                include: { subscription: true }
              }
            }
          }
        }
      }),
      prisma.business.findMany({
        where: { isActive: false, testMode: { not: true } },
        select: {
          id: true,
          name: true,
          subscriptionPlan: true,
          trialEndsAt: true,
          createdAt: true,
          isActive: true,
        }
      }).catch(() => [] as any[]),
      prisma.stripeTransaction.findMany({
        where: { status: { in: ['succeeded', 'paid'] } },
        select: { amount: true, stripeCreatedAt: true, type: true, refundedAmount: true }
      }).catch(() => [])
    ])

    // Filter to WaveOrder subscriptions only (by price ID)
    const allSubs = rawSubsArray.filter(s => isWaveOrderSubscription(s))

    // "paid" = active + actually paying money (unit_amount > 0)
    const activePaid = allSubs.filter(s => {
      if (s.status !== 'active') return false
      const price = s.items.data[0]?.price
      return price && (price.unit_amount || 0) > 0
    })
    const trialing = allSubs.filter(s => s.status === 'trialing')
    const paused = allSubs.filter(s => s.status === 'paused')
    const freeSubs = allSubs.filter(s => {
      if (s.status !== 'active') return false
      const price = s.items.data[0]?.price
      return !price || (price.unit_amount || 0) === 0
    })

    // === REAL MRR FROM STRIPE ===
    let totalMRR = 0
    let mrrFromMonthly = 0
    let mrrFromYearly = 0
    const revenueByPlan: Record<string, number> = { STARTER: 0, PRO: 0, BUSINESS: 0 }
    const subscribersByPlan: Record<string, number> = { STARTER: 0, PRO: 0, BUSINESS: 0 }
    const subscribersByBilling: { monthly: number; yearly: number } = { monthly: 0, yearly: 0 }

    for (const sub of activePaid) {
      const price = sub.items.data[0]?.price
      if (!price) continue

      const priceId = price.id
      const plan = mapStripePlanToDb(priceId)
      const billingType = getBillingTypeFromPriceId(priceId)
      let monthlyAmount = 0

      if (price.recurring?.interval === 'year') {
        monthlyAmount = (price.unit_amount || 0) / 100 / 12
        mrrFromYearly += monthlyAmount
        subscribersByBilling.yearly++
      } else {
        monthlyAmount = (price.unit_amount || 0) / 100
        mrrFromMonthly += monthlyAmount
        subscribersByBilling.monthly++
      }

      totalMRR += monthlyAmount
      revenueByPlan[plan] = (revenueByPlan[plan] || 0) + monthlyAmount
      subscribersByPlan[plan] = (subscribersByPlan[plan] || 0) + 1
    }

    const totalARR = totalMRR * 12
    const totalPayingCustomers = activePaid.length
    const arpu = totalPayingCustomers > 0 ? totalMRR / totalPayingCustomers : 0

    // === PROCESS ACTIVE BUSINESSES FOR CURRENT-STATE METRICS ===
    const processedBusinesses = businesses.map(business => {
      const owner = business.users.find(u => u.role === 'OWNER')?.user
      const plan = (business.subscriptionPlan || 'STARTER') as 'STARTER' | 'PRO' | 'BUSINESS'
      const subscriptionPriceId = owner?.subscription?.priceId
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

      let trialDaysRemaining: number | null = null
      if (isOnTrial && business.trialEndsAt) {
        trialDaysRemaining = Math.ceil(
          (new Date(business.trialEndsAt).getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
        )
      }

      return {
        id: business.id,
        name: business.name,
        plan,
        billingType,
        trialEndsAt: business.trialEndsAt,
        trialDaysRemaining,
        createdAt: business.createdAt,
        ownerEmail: owner?.email,
      }
    })

    // All businesses (active + deactivated) for historical/growth metrics
    const allProcessed = [
      ...processedBusinesses.map(b => ({ ...b, isActive: true })),
      ...deactivatedBusinesses.map(b => ({
        id: b.id,
        name: b.name,
        plan: (b.subscriptionPlan || 'STARTER') as 'STARTER' | 'PRO' | 'BUSINESS',
        billingType: 'free' as const,
        trialEndsAt: b.trialEndsAt,
        trialDaysRemaining: null as number | null,
        createdAt: b.createdAt,
        ownerEmail: null as string | null | undefined,
        isActive: false,
      })),
    ]

    // === SUBSCRIPTION OVERVIEW (DB-based, active businesses only) ===
    const byPlan = {
      STARTER: processedBusinesses.filter(b => b.plan === 'STARTER').length,
      PRO: processedBusinesses.filter(b => b.plan === 'PRO').length,
      BUSINESS: processedBusinesses.filter(b => b.plan === 'BUSINESS').length,
    }

    const byBillingType = {
      free: processedBusinesses.filter(b => b.billingType === 'free').length,
      trial: processedBusinesses.filter(b => b.billingType === 'trial').length,
      monthly: subscribersByBilling.monthly || processedBusinesses.filter(b => b.billingType === 'monthly').length,
      yearly: subscribersByBilling.yearly || processedBusinesses.filter(b => b.billingType === 'yearly').length,
    }

    // === TRIAL ANALYTICS ===
    const activeTrials = processedBusinesses.filter(b => b.billingType === 'trial')
    const trialsExpiringSoon = {
      within7Days: activeTrials.filter(b => b.trialDaysRemaining !== null && b.trialDaysRemaining <= 7),
      within14Days: activeTrials.filter(b => b.trialDaysRemaining !== null && b.trialDaysRemaining <= 14),
      within30Days: activeTrials.filter(b => b.trialDaysRemaining !== null && b.trialDaysRemaining <= 30),
    }

    // Trial funnel uses all businesses (including deactivated) for accurate conversion tracking
    const endedTrials = allProcessed.filter(b => {
      if (!b.trialEndsAt) return false
      return new Date(b.trialEndsAt) < now
    })

    const convertedTrials = activePaid.length
    const totalTrialsEnded = endedTrials.length
    const totalTrialsStarted = allProcessed.filter(b => b.trialEndsAt !== null).length

    const trialConversionRate = totalTrialsEnded > 0
      ? ((convertedTrials / totalTrialsEnded) * 100)
      : 0

    const trialsExpiringList = activeTrials
      .sort((a, b) => (a.trialDaysRemaining || 999) - (b.trialDaysRemaining || 999))
      .slice(0, 10)
      .map(b => ({
        id: b.id,
        name: b.name,
        plan: b.plan,
        daysRemaining: b.trialDaysRemaining,
        expiresAt: b.trialEndsAt,
        ownerEmail: b.ownerEmail,
      }))

    // === GROWTH METRICS ===
    // Use actual Stripe charges for real monthly revenue data
    const monthlyData: Array<{
      month: string
      monthLabel: string
      newBusinesses: number
      trials: number
      paid: number
      mrr: number
      actualRevenue: number
    }> = []

    for (let i = 5; i >= 0; i--) {
      const monthStart = new Date(now.getFullYear(), now.getMonth() - i, 1)
      const monthEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 0)

      const monthBusinesses = allProcessed.filter(b => {
        const created = new Date(b.createdAt)
        return created >= monthStart && created <= monthEnd
      })

      const trialsThisMonth = allProcessed.filter(b => {
        if (!b.trialEndsAt) return false
        const trialEnd = new Date(b.trialEndsAt)
        const trialStart = new Date(trialEnd)
        trialStart.setDate(trialStart.getDate() - 14)
        return trialStart <= monthEnd && trialEnd >= monthStart
      }).length

      // Count paid from Stripe (subscriptions active before monthEnd)
      const paidThisMonth = activePaid.filter(s =>
        new Date(s.created * 1000) <= monthEnd
      ).length

      // MRR for this month from Stripe (all active paid at that time point)
      const mrrThisMonth = totalMRR // Simplified: current MRR for the latest month

      // Actual revenue from DB transactions or estimate
      const monthRevenue = dbTransactions
        .filter(t => {
          const d = new Date(t.stripeCreatedAt)
          return d >= monthStart && d <= monthEnd && (t.type === 'charge' || t.type === 'invoice')
        })
        .reduce((s, t) => s + (t.amount - (t.refundedAmount || 0)), 0) / 100

      monthlyData.push({
        month: monthStart.toISOString().slice(0, 7),
        monthLabel: monthStart.toLocaleDateString('en-US', { month: 'short', year: '2-digit' }),
        newBusinesses: monthBusinesses.length,
        trials: trialsThisMonth,
        paid: i === 0 ? paidThisMonth : paidThisMonth, // Approximation for past months
        mrr: i === 0 ? totalMRR : mrrThisMonth,
        actualRevenue: monthRevenue,
      })
    }

    const currentMonthMRR = monthlyData[monthlyData.length - 1]?.mrr || 0
    const previousMonthMRR = monthlyData[monthlyData.length - 2]?.mrr || 0
    const mrrGrowthRate = previousMonthMRR > 0
      ? (((currentMonthMRR - previousMonthMRR) / previousMonthMRR) * 100)
      : currentMonthMRR > 0 ? 100 : 0

    return NextResponse.json({
      totalBusinesses: processedBusinesses.length,
      byPlan,
      byBillingType,

      trialAnalytics: {
        activeTrials: Math.max(activeTrials.length, trialing.length),
        trialsExpiringSoon,
        trialConversionRate: parseFloat(trialConversionRate.toFixed(1)),
        totalTrialsStarted,
        totalTrialsEnded,
        totalTrialsConverted: convertedTrials,
        trialsExpiringList,
      },

      revenue: {
        mrr: Math.round(totalMRR * 100) / 100,
        arr: Math.round(totalARR * 100) / 100,
        mrrFromMonthly: Math.round(mrrFromMonthly * 100) / 100,
        mrrFromYearly: Math.round(mrrFromYearly * 100) / 100,
        revenueByPlan: {
          STARTER: Math.round((revenueByPlan.STARTER || 0) * 100) / 100,
          PRO: Math.round((revenueByPlan.PRO || 0) * 100) / 100,
          BUSINESS: Math.round((revenueByPlan.BUSINESS || 0) * 100) / 100,
        },
      },

      customers: {
        totalPaying: totalPayingCustomers,
        monthlySubscribers: subscribersByBilling.monthly,
        yearlySubscribers: subscribersByBilling.yearly,
        arpu: Math.round(arpu * 100) / 100,
      },

      growth: {
        mrrGrowthRate: parseFloat(mrrGrowthRate.toFixed(1)),
        monthlyData,
      },

      stripeStats: {
        totalSubscriptions: allSubs.length,
        activePaid: activePaid.length,
        trialing: trialing.length,
        paused: paused.length,
        free: freeSubs.length,
      },

      dataSource: 'stripe_api',
    })

  } catch (error: any) {
    console.error('Error fetching financial analytics:', error?.message, error?.stack)
    return NextResponse.json(
      { message: 'Internal server error', detail: error?.message || 'Unknown error' },
      { status: 500 }
    )
  }
}
