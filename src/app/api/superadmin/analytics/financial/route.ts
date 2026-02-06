// app/api/superadmin/analytics/financial/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { getBillingTypeFromPriceId } from '@/lib/stripe'

// Plan pricing for calculations
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

    const now = new Date()

    // Get all active businesses with their subscription info
    const businesses = await prisma.business.findMany({
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

    // Process each business to determine subscription status
    const processedBusinesses = businesses.map(business => {
      const owner = business.users.find(u => u.role === 'OWNER')?.user
      const subscriptionPriceId = owner?.subscription?.priceId
      const plan = business.subscriptionPlan as 'STARTER' | 'PRO' | 'BUSINESS'
      
      // Determine billing type
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

      // Calculate days until trial expires
      let trialDaysRemaining: number | null = null
      if (isOnTrial && business.trialEndsAt) {
        trialDaysRemaining = Math.ceil(
          (new Date(business.trialEndsAt).getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
        )
      }

      // Calculate monthly revenue contribution
      let monthlyRevenue = 0
      if (billingType === 'monthly') {
        monthlyRevenue = PLAN_PRICES[plan]?.monthly || 0
      } else if (billingType === 'yearly') {
        monthlyRevenue = PLAN_PRICES[plan]?.yearly || 0
      }

      return {
        id: business.id,
        name: business.name,
        plan,
        billingType,
        trialEndsAt: business.trialEndsAt,
        trialDaysRemaining,
        monthlyRevenue,
        createdAt: business.createdAt,
        ownerEmail: owner?.email
      }
    })

    // === SUBSCRIPTION OVERVIEW ===
    
    // By Plan
    const byPlan = {
      STARTER: processedBusinesses.filter(b => b.plan === 'STARTER').length,
      PRO: processedBusinesses.filter(b => b.plan === 'PRO').length,
      BUSINESS: processedBusinesses.filter(b => b.plan === 'BUSINESS').length
    }

    // By Billing Type
    const byBillingType = {
      free: processedBusinesses.filter(b => b.billingType === 'free').length,
      trial: processedBusinesses.filter(b => b.billingType === 'trial').length,
      monthly: processedBusinesses.filter(b => b.billingType === 'monthly').length,
      yearly: processedBusinesses.filter(b => b.billingType === 'yearly').length
    }

    // === TRIAL ANALYTICS ===
    
    // Active trials
    const activeTrials = processedBusinesses.filter(b => b.billingType === 'trial')
    
    // Trials expiring soon (within 7, 14, 30 days)
    const trialsExpiringSoon = {
      within7Days: activeTrials.filter(b => b.trialDaysRemaining !== null && b.trialDaysRemaining <= 7),
      within14Days: activeTrials.filter(b => b.trialDaysRemaining !== null && b.trialDaysRemaining <= 14),
      within30Days: activeTrials.filter(b => b.trialDaysRemaining !== null && b.trialDaysRemaining <= 30)
    }

    // Calculate trial conversion rate based on ENDED trials only
    // Active trials should NOT be counted - we only count trials that have expired
    
    // Trials that have ENDED (trialEndsAt is in the past)
    const endedTrials = processedBusinesses.filter(b => {
      // Business must have had a trial (trialEndsAt exists)
      const business = businesses.find(biz => biz.id === b.id)
      if (!business?.trialEndsAt) return false
      
      // Trial must have ENDED (not active anymore)
      const trialEndDate = new Date(business.trialEndsAt)
      return trialEndDate < now
    })
    
    // Of ended trials, how many converted to paid (monthly or yearly)?
    const convertedTrials = endedTrials.filter(b => 
      b.billingType === 'monthly' || b.billingType === 'yearly'
    )
    
    const totalTrialsEnded = endedTrials.length
    const totalTrialsConverted = convertedTrials.length
    
    // Also count total trials ever started (for context)
    const totalTrialsStarted = processedBusinesses.filter(b => {
      const business = businesses.find(biz => biz.id === b.id)
      return business?.trialEndsAt !== null // Has/had a trial
    }).length

    const trialConversionRate = totalTrialsEnded > 0 
      ? ((totalTrialsConverted / totalTrialsEnded) * 100).toFixed(1)
      : '0.0'

    // === REVENUE METRICS ===
    
    // MRR (Monthly Recurring Revenue)
    const payingMonthly = processedBusinesses.filter(b => b.billingType === 'monthly')
    const payingYearly = processedBusinesses.filter(b => b.billingType === 'yearly')
    
    const mrrFromMonthly = payingMonthly.reduce((sum, b) => sum + b.monthlyRevenue, 0)
    const mrrFromYearly = payingYearly.reduce((sum, b) => sum + b.monthlyRevenue, 0)
    const totalMRR = mrrFromMonthly + mrrFromYearly
    const totalARR = totalMRR * 12

    // Revenue by plan
    const revenueByPlan = {
      STARTER: processedBusinesses
        .filter(b => b.plan === 'STARTER' && (b.billingType === 'monthly' || b.billingType === 'yearly'))
        .reduce((sum, b) => sum + b.monthlyRevenue, 0),
      PRO: processedBusinesses
        .filter(b => b.plan === 'PRO' && (b.billingType === 'monthly' || b.billingType === 'yearly'))
        .reduce((sum, b) => sum + b.monthlyRevenue, 0),
      BUSINESS: processedBusinesses
        .filter(b => b.plan === 'BUSINESS' && (b.billingType === 'monthly' || b.billingType === 'yearly'))
        .reduce((sum, b) => sum + b.monthlyRevenue, 0)
    }

    // === CUSTOMER METRICS ===
    
    const totalPayingCustomers = payingMonthly.length + payingYearly.length
    const arpu = totalPayingCustomers > 0 ? totalMRR / totalPayingCustomers : 0

    // === GROWTH METRICS (Historical) ===
    
    // Get subscription changes over the last 6 months
    const sixMonthsAgo = new Date()
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6)

    // Monthly breakdown for charts
    const monthlyData: Array<{
      month: string
      monthLabel: string
      newBusinesses: number
      trials: number
      paid: number
      mrr: number
    }> = []

    for (let i = 5; i >= 0; i--) {
      const monthStart = new Date(now.getFullYear(), now.getMonth() - i, 1)
      const monthEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 0)
      
      const monthBusinesses = processedBusinesses.filter(b => {
        const created = new Date(b.createdAt)
        return created >= monthStart && created <= monthEnd
      })

      // Count businesses that were on trial during this month
      const trialsThisMonth = businesses.filter(b => {
        if (!b.trialEndsAt) return false
        const trialEnd = new Date(b.trialEndsAt)
        const trialStart = new Date(trialEnd)
        trialStart.setDate(trialStart.getDate() - 14) // Assuming 14-day trials
        return trialStart <= monthEnd && trialEnd >= monthStart
      }).length

      // Estimate paid customers for this month (simplified)
      const paidThisMonth = processedBusinesses.filter(b => {
        const created = new Date(b.createdAt)
        return created <= monthEnd && (b.billingType === 'monthly' || b.billingType === 'yearly')
      }).length

      // Estimate MRR for this month
      const mrrThisMonth = processedBusinesses
        .filter(b => {
          const created = new Date(b.createdAt)
          return created <= monthEnd && (b.billingType === 'monthly' || b.billingType === 'yearly')
        })
        .reduce((sum, b) => sum + b.monthlyRevenue, 0)

      monthlyData.push({
        month: monthStart.toISOString().slice(0, 7),
        monthLabel: monthStart.toLocaleDateString('en-US', { month: 'short', year: '2-digit' }),
        newBusinesses: monthBusinesses.length,
        trials: trialsThisMonth,
        paid: paidThisMonth,
        mrr: mrrThisMonth
      })
    }

    // Calculate MRR growth rate (current vs previous month)
    const currentMonthMRR = monthlyData[monthlyData.length - 1]?.mrr || 0
    const previousMonthMRR = monthlyData[monthlyData.length - 2]?.mrr || 0
    const mrrGrowthRate = previousMonthMRR > 0 
      ? (((currentMonthMRR - previousMonthMRR) / previousMonthMRR) * 100).toFixed(1)
      : currentMonthMRR > 0 ? '100.0' : '0.0'

    // === TRIALS EXPIRING LIST ===
    const trialsExpiringList = activeTrials
      .sort((a, b) => (a.trialDaysRemaining || 999) - (b.trialDaysRemaining || 999))
      .slice(0, 10)
      .map(b => ({
        id: b.id,
        name: b.name,
        plan: b.plan,
        daysRemaining: b.trialDaysRemaining,
        expiresAt: b.trialEndsAt,
        ownerEmail: b.ownerEmail
      }))

    return NextResponse.json({
      // Overview
      totalBusinesses: processedBusinesses.length,
      byPlan,
      byBillingType,
      
      // Trial Analytics
      trialAnalytics: {
        activeTrials: activeTrials.length,
        trialsExpiringSoon,
        trialConversionRate: parseFloat(trialConversionRate),
        totalTrialsStarted,    // Total businesses that have/had a trial
        totalTrialsEnded,      // Trials that have expired (used for conversion calc)
        totalTrialsConverted,  // Ended trials that became paid
        trialsExpiringList
      },
      
      // Revenue Metrics
      revenue: {
        mrr: totalMRR,
        arr: totalARR,
        mrrFromMonthly,
        mrrFromYearly,
        revenueByPlan
      },
      
      // Customer Metrics
      customers: {
        totalPaying: totalPayingCustomers,
        monthlySubscribers: payingMonthly.length,
        yearlySubscribers: payingYearly.length,
        arpu: Math.round(arpu * 100) / 100
      },
      
      // Growth Metrics
      growth: {
        mrrGrowthRate: parseFloat(mrrGrowthRate),
        monthlyData
      }
    })

  } catch (error) {
    console.error('Error fetching financial analytics:', error)
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    )
  }
}
