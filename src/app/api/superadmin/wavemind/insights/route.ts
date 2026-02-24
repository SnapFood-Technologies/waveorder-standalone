// src/app/api/superadmin/wavemind/insights/route.ts
// Wavemind AI Engine - Financial Insights (uses Financial Dashboard as source of truth for MRR/paying count)
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { getBillingTypeFromPriceId } from '@/lib/stripe'
import OpenAI from 'openai'

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
})

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

    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        { message: 'OpenAI API key not configured' },
        { status: 503 }
      )
    }

    const now = new Date()

    // Use Financial Dashboard as single source of truth for MRR and paying customer count (Stripe-based)
    const origin = process.env.NEXTAUTH_URL || (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000')
    const dashboardUrl = `${origin.replace(/\/$/, '')}/api/superadmin/financial/dashboard`
    let dashboardMetrics: { payingCustomers: number; mrr: number; arr: number } | null = null
    try {
      const dashboardRes = await fetch(dashboardUrl, {
        headers: { cookie: request.headers.get('cookie') || '' },
        cache: 'no-store'
      })
      if (dashboardRes.ok) {
        const dashboardData = await dashboardRes.json()
        dashboardMetrics = {
          payingCustomers: dashboardData.subscriptions?.paidActive ?? 0,
          mrr: dashboardData.mrr ?? 0,
          arr: dashboardData.arr ?? 0
        }
      }
    } catch (_) {
      // ignore; will fall back to DB-based metrics
    }

    // Gather financial data for AI analysis (trials, free, activity — dashboard supplies paying/MRR)
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
        },
        orders: {
          where: {
            createdAt: {
              gte: new Date(now.getFullYear(), now.getMonth() - 1, 1)
            },
            // Only count completed orders that are paid
            status: { in: ['DELIVERED', 'PICKED_UP'] },
            paymentStatus: 'PAID'
          },
          select: {
            id: true,
            total: true,
            status: true,
            createdAt: true
          }
        }
      }
    })

    // Process business data
    const processedData = businesses.map(business => {
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

      // Orders summary (only DELIVERED/PICKED_UP + PAID orders)
      const completedOrderCount = business.orders.length
      const completedOrderRevenue = business.orders.reduce((sum, o) => sum + o.total, 0)

      return {
        name: business.name,
        plan,
        billingType,
        trialDaysRemaining,
        monthlyRevenue,
        businessType: business.businessType,
        currency: business.currency || 'USD',
        completedOrderCount,
        completedOrderRevenue, // In business's local currency
        createdAt: business.createdAt
      }
    })

    // Calculate summary metrics (paying/MRR/ARR from dashboard when available so numbers match Financial Dashboard)
    const totalBusinesses = processedData.length
    const activeTrials = processedData.filter(b => b.billingType === 'trial')
    const freeBusinesses = processedData.filter(b => b.billingType === 'free')
    const payingFromDb = processedData.filter(b => b.billingType === 'monthly' || b.billingType === 'yearly')
    const mrrFromDb = payingFromDb.reduce((sum, b) => sum + b.monthlyRevenue, 0)

    const payingCustomers = dashboardMetrics ? dashboardMetrics.payingCustomers : payingFromDb.length
    const mrr = dashboardMetrics ? dashboardMetrics.mrr : mrrFromDb
    const arr = dashboardMetrics ? dashboardMetrics.arr : mrrFromDb * 12

    const trialsExpiringSoon = activeTrials.filter(b =>
      b.trialDaysRemaining !== null && b.trialDaysRemaining <= 7
    )

    // Build context for AI (use Stripe-based paying/MRR/ARR so insights match dashboard)
    const dataContext = {
      overview: {
        totalBusinesses,
        activeTrials: activeTrials.length,
        freeBusinesses: freeBusinesses.length,
        payingCustomers,
        mrr,
        arr
      },
      trials: {
        active: activeTrials.length,
        expiringSoon: trialsExpiringSoon.length,
        list: activeTrials.map(t => ({
          name: t.name,
          daysRemaining: t.trialDaysRemaining,
          plan: t.plan
        }))
      },
      byPlan: {
        STARTER: processedData.filter(b => b.plan === 'STARTER').length,
        PRO: processedData.filter(b => b.plan === 'PRO').length,
        BUSINESS: processedData.filter(b => b.plan === 'BUSINESS').length
      },
      recentActivity: {
        // Completed orders across all businesses (last 30 days)
        totalCompletedOrders: processedData.reduce((sum, b) => sum + b.completedOrderCount, 0),
        // Note: Revenue cannot be summed as businesses use different currencies
        businessesWithOrders: processedData.filter(b => b.completedOrderCount > 0).length,
        // Individual business order activity (with their local currency)
        byBusiness: processedData
          .filter(b => b.completedOrderCount > 0)
          .map(b => ({
            name: b.name,
            orders: b.completedOrderCount,
            revenue: b.completedOrderRevenue,
            currency: b.currency
          }))
      }
    }

    // Generate AI insights using OpenAI
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: `You are Wavemind, an AI financial analyst for WaveOrder.

## What is WaveOrder?
WaveOrder is a B2B SaaS platform that helps businesses sell products and services via WhatsApp. Our customers are:
- Restaurants and bakeries (food ordering)
- Retail stores (product ordering)
- Instagram sellers (social commerce)
- Service businesses

WaveOrder provides: online storefronts, WhatsApp integration, order management, payment processing, and analytics.

## Our Revenue Model
WaveOrder earns subscription revenue from businesses:
- FREE plan: $0/month
- STARTER plan: $19/month or $16/month (yearly)
- PRO plan: $39/month or $32/month (yearly)
- BUSINESS plan: $79/month or $66/month (yearly)
- Trials: 14-day free trial of paid plans

## Important Data Notes
- payingCustomers, MRR, and ARR are from the Financial Dashboard (Stripe): they count only active paid subscriptions. Use these numbers as the source of truth.
- "completedOrderRevenue" = Revenue earned BY our customers' businesses (NOT WaveOrder's revenue)
- Each business may use different currencies (USD, ALL, EUR, etc.) - don't sum revenues across businesses
- Completed orders = DELIVERED or PICKED_UP orders that are PAID

## Your Task
Analyze WaveOrder's SaaS metrics and provide actionable insights for the WaveOrder team.

Rules:
- Be concise and direct
- Focus on actionable recommendations
- Highlight both opportunities and risks
- Use numbers to support your points
- Format with markdown (bold for emphasis, bullet points for lists)
- Keep total response under 400 words
- Don't repeat raw numbers, interpret them
- Don't confuse our customers' revenue with WaveOrder's revenue

Structure your response:
1. **Key Insight** (one sentence summary)
2. **Opportunities** (2-3 bullet points)
3. **Risks to Watch** (1-2 bullet points)
4. **Recommended Actions** (2-3 specific actions)`
        },
        {
          role: 'user',
          content: `Analyze these WaveOrder SaaS metrics and provide insights:

${JSON.stringify(dataContext, null, 2)}

Today's date: ${now.toISOString().split('T')[0]}`
        }
      ],
      temperature: 0.7,
      max_tokens: 600
    })

    const aiInsights = completion.choices[0]?.message?.content || 'Unable to generate insights'

    // Also generate quick stats/alerts (rule-based, not AI)
    const alerts: Array<{ type: 'warning' | 'info' | 'success'; message: string }> = []

    if (trialsExpiringSoon.length > 0) {
      alerts.push({
        type: 'warning',
        message: `${trialsExpiringSoon.length} trial${trialsExpiringSoon.length > 1 ? 's' : ''} expiring within 7 days`
      })
    }

    if (mrr === 0 && activeTrials.length > 0) {
      alerts.push({
        type: 'info',
        message: 'No paying customers yet. Focus on converting active trials.'
      })
    }

    if (payingCustomers > 0) {
      alerts.push({
        type: 'success',
        message: `${payingCustomers} paying customer${payingCustomers > 1 ? 's' : ''} generating $${Math.round(mrr)}/month`
      })
    }

    return NextResponse.json({
      success: true,
      insights: aiInsights,
      alerts,
      metrics: dataContext.overview,
      generatedAt: now.toISOString(),
      model: 'gpt-4o-mini'
    })

  } catch (error) {
    console.error('Error generating Wavemind insights:', error)
    return NextResponse.json(
      { message: 'Failed to generate insights', error: (error as Error).message },
      { status: 500 }
    )
  }
}
