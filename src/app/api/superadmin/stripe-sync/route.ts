// Global Stripe Sync: GET = analyse all businesses, POST = fix all
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { stripe, mapStripePlanToDb } from '@/lib/stripe'
import { logSystemEvent } from '@/lib/systemLog'

interface BusinessSyncSummary {
  businessId: string
  businessName: string
  ownerEmail: string | null
  status: 'in_sync' | 'issues_found' | 'no_stripe_customer'
  issueCount: number
  issues: string[]
}

/**
 * GET — Analyse all businesses and compare Stripe vs DB
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || session.user.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
    }

    // Get all businesses with owners
    const businesses = await prisma.business.findMany({
      where: { isActive: true },
      include: {
        users: {
          where: { role: 'OWNER' },
          include: {
            user: {
              include: { subscription: true }
            }
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    })

    const results: BusinessSyncSummary[] = []
    let totalInSync = 0
    let totalWithIssues = 0
    let totalNoStripe = 0

    for (const business of businesses) {
      const owner = business.users[0]?.user
      const stripeCustomerId = owner?.stripeCustomerId
      const dbSubscription = owner?.subscription

      const summary: BusinessSyncSummary = {
        businessId: business.id,
        businessName: business.name,
        ownerEmail: owner?.email || null,
        status: 'in_sync',
        issueCount: 0,
        issues: []
      }

      if (!stripeCustomerId) {
        // Only flag as issue if they're not on STARTER
        if (business.subscriptionPlan !== 'STARTER') {
          summary.status = 'no_stripe_customer'
          summary.issues.push(`On ${business.subscriptionPlan} but no Stripe customer`)
          summary.issueCount = 1
          totalNoStripe++
        } else {
          summary.status = 'in_sync'
          totalInSync++
        }
        results.push(summary)
        continue
      }

      // Fetch Stripe subscriptions
      try {
        const stripeSubs = await stripe.subscriptions.list({
          customer: stripeCustomerId,
          limit: 10
        })

        const activeSubs = stripeSubs.data.filter(
          s => !['canceled', 'incomplete_expired'].includes(s.status)
        )

        // Check for duplicates
        if (activeSubs.length > 1) {
          summary.issues.push(`${activeSubs.length} active/paused subscriptions (should be 1)`)
        }

        const primarySub = activeSubs
          .sort((a, b) => b.created - a.created)[0]

        // Check for missing DB record
        if (primarySub && !dbSubscription) {
          summary.issues.push('No Subscription record in DB')
        }

        // Check for orphaned DB record
        if (dbSubscription && !stripeSubs.data.find(s => s.id === dbSubscription.stripeId)) {
          summary.issues.push('DB references non-existent Stripe subscription')
        }

        // Check plan/status mismatch
        if (primarySub) {
          const stripePlan = primarySub.metadata?.plan || mapStripePlanToDb(primarySub.items.data[0]?.price?.id)
          const stripeIsActive = ['active', 'trialing'].includes(primarySub.status)
          const stripeIsPaused = primarySub.status === 'paused'

          if (stripeIsActive && business.subscriptionPlan !== stripePlan) {
            summary.issues.push(`Stripe: ${stripePlan} (active), DB: ${business.subscriptionPlan}`)
          }

          if (stripeIsPaused && business.subscriptionPlan !== 'STARTER' && business.subscriptionStatus === 'ACTIVE') {
            summary.issues.push(`Stripe: paused, DB: ${business.subscriptionPlan}/ACTIVE`)
          }
        }

        // No stripe subs but DB says paid
        if (!primarySub && business.subscriptionPlan !== 'STARTER' && !business.trialEndsAt) {
          summary.issues.push(`No Stripe sub, DB: ${business.subscriptionPlan}`)
        }

      } catch (err: any) {
        if (err?.code === 'resource_missing') {
          summary.issues.push('Stripe customer ID does not exist in Stripe')
        } else {
          summary.issues.push(`Stripe API error: ${err.message}`)
        }
      }

      summary.issueCount = summary.issues.length
      summary.status = summary.issues.length > 0 ? 'issues_found' : 'in_sync'

      if (summary.status === 'in_sync') totalInSync++
      else totalWithIssues++

      results.push(summary)
    }

    return NextResponse.json({
      totalBusinesses: businesses.length,
      inSync: totalInSync,
      withIssues: totalWithIssues,
      noStripeCustomer: totalNoStripe,
      businesses: results
    })

  } catch (error: any) {
    console.error('Error in global stripe sync:', error)
    return NextResponse.json(
      { message: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * POST — Fix all businesses that have issues by calling per-business sync
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || session.user.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json().catch(() => ({}))
    const { businessIds } = body // Optional: only fix specific businesses

    // First get the analysis
    const businesses = await prisma.business.findMany({
      where: {
        isActive: true,
        ...(businessIds?.length ? { id: { in: businessIds } } : {})
      },
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
    })

    let totalFixed = 0
    let totalFailed = 0
    const fixResults: Array<{ businessId: string; businessName: string; success: boolean; fixes: number; details: string[] }> = []

    for (const business of businesses) {
      const owner = business.users[0]?.user
      if (!owner?.stripeCustomerId) continue

      try {
        // Call the per-business sync endpoint logic directly
        const host = request.headers.get('host') || 'localhost'
        const protocol = request.headers.get('x-forwarded-proto') || 'https'
        const syncUrl = `${protocol}://${host}/api/superadmin/businesses/${business.id}/stripe-sync`

        const syncResponse = await fetch(syncUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Cookie': request.headers.get('cookie') || ''
          }
        })

        const syncData = await syncResponse.json()

        if (syncData.fixesApplied > 0) {
          totalFixed++
          fixResults.push({
            businessId: business.id,
            businessName: business.name,
            success: true,
            fixes: syncData.fixesApplied,
            details: syncData.details || []
          })
        }
      } catch (err: any) {
        totalFailed++
        fixResults.push({
          businessId: business.id,
          businessName: business.name,
          success: false,
          fixes: 0,
          details: [err.message]
        })
      }
    }

    const host = request.headers.get('host') || request.headers.get('x-forwarded-host')
    const protocol = request.headers.get('x-forwarded-proto') || (process.env.NODE_ENV === 'production' ? 'https' : 'http')
    const actualUrl = host ? `${protocol}://${host}${new URL(request.url).pathname}` : request.url

    await logSystemEvent({
      logType: 'admin_action',
      severity: 'info',
      endpoint: '/api/superadmin/stripe-sync',
      method: 'POST',
      url: actualUrl,
      metadata: {
        action: 'global_stripe_sync',
        totalBusinesses: businesses.length,
        totalFixed,
        totalFailed,
        syncedBy: session.user.email
      }
    })

    return NextResponse.json({
      success: true,
      totalBusinesses: businesses.length,
      totalFixed,
      totalFailed,
      results: fixResults
    })

  } catch (error: any) {
    console.error('Error in global stripe sync fix:', error)
    return NextResponse.json(
      { message: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}
