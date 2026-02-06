// src/app/api/superadmin/wavemind/insights/route.ts
// Wavemind AI Engine - Financial Insights
import { NextResponse } from 'next/server'
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

export async function GET() {
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

    // Gather financial data for AI analysis
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
            }
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

      // Orders summary
      const orderCount = business.orders.length
      const totalRevenue = business.orders.reduce((sum, o) => sum + o.total, 0)

      return {
        name: business.name,
        plan,
        billingType,
        trialDaysRemaining,
        monthlyRevenue,
        businessType: business.businessType,
        orderCount,
        totalRevenue,
        createdAt: business.createdAt
      }
    })

    // Calculate summary metrics
    const totalBusinesses = processedData.length
    const activeTrials = processedData.filter(b => b.billingType === 'trial')
    const freeBusinesses = processedData.filter(b => b.billingType === 'free')
    const payingBusinesses = processedData.filter(b => b.billingType === 'monthly' || b.billingType === 'yearly')
    
    const mrr = payingBusinesses.reduce((sum, b) => sum + b.monthlyRevenue, 0)
    
    const trialsExpiringSoon = activeTrials.filter(b => 
      b.trialDaysRemaining !== null && b.trialDaysRemaining <= 7
    )

    // Build context for AI
    const dataContext = {
      overview: {
        totalBusinesses,
        activeTrials: activeTrials.length,
        freeBusinesses: freeBusinesses.length,
        payingCustomers: payingBusinesses.length,
        mrr,
        arr: mrr * 12
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
        totalOrders: processedData.reduce((sum, b) => sum + b.orderCount, 0),
        totalOrderRevenue: processedData.reduce((sum, b) => sum + b.totalRevenue, 0)
      }
    }

    // Generate AI insights using OpenAI
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: `You are Wavemind, an AI financial analyst for WaveOrder, a SaaS platform for WhatsApp ordering.
Your task is to analyze the business metrics and provide actionable insights.

Rules:
- Be concise and direct
- Focus on actionable recommendations
- Highlight both opportunities and risks
- Use numbers to support your points
- Format with markdown (bold for emphasis, bullet points for lists)
- Keep total response under 400 words
- Don't repeat the raw numbers, interpret them

Structure your response with these sections:
1. **Key Insight** (one sentence summary)
2. **Opportunities** (2-3 bullet points)
3. **Risks to Watch** (1-2 bullet points)
4. **Recommended Actions** (2-3 specific actions)`
        },
        {
          role: 'user',
          content: `Analyze these SaaS metrics and provide insights:

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

    if (payingBusinesses.length > 0) {
      alerts.push({
        type: 'success',
        message: `${payingBusinesses.length} paying customer${payingBusinesses.length > 1 ? 's' : ''} generating $${mrr}/month`
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
