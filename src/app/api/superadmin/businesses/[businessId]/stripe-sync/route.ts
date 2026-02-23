// Per-business Stripe Sync: GET = analyse, POST = fix
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { stripe, mapStripePlanToDb, PLANS, PlanId } from '@/lib/stripe'
import { logSystemEvent } from '@/lib/systemLog'

interface SyncIssue {
  type: 'missing_subscription' | 'plan_mismatch' | 'status_mismatch' | 'price_id_mismatch' | 'duplicate_subs' | 'no_stripe_customer' | 'orphaned_db_record'
  severity: 'critical' | 'warning' | 'info'
  description: string
  stripeData?: any
  dbData?: any
  fix?: string
}

interface SyncAnalysis {
  businessId: string
  businessName: string
  ownerEmail: string | null
  stripeCustomerId: string | null
  status: 'in_sync' | 'issues_found' | 'no_stripe_customer'
  issues: SyncIssue[]
  stripeSubscriptions: Array<{
    id: string
    subscriptionItemId: string | null
    status: string
    plan: string
    priceId: string
    currentPeriodEnd: string
    cancelAtPeriodEnd: boolean
    created: string
  }>
  dbSubscription: {
    id: string
    stripeId: string
    status: string
    plan: string
    priceId: string
  } | null
  dbPlan: string
  dbStatus: string
  hasPaymentMethod: boolean
  lastPayment: { amount: number; currency: string; date: string } | null
}

/**
 * GET — Analyse a business's Stripe data vs DB, return issues
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ businessId: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || session.user.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
    }

    const { businessId } = await params
    const analysis = await analyseBusinessSync(businessId)

    return NextResponse.json(analysis)
  } catch (error: any) {
    console.error('Error analysing business sync:', error)
    return NextResponse.json(
      { message: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * POST — Fix all issues for a specific business
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ businessId: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || session.user.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
    }

    const { businessId } = await params
    const analysis = await analyseBusinessSync(businessId)

    if (analysis.status === 'in_sync') {
      return NextResponse.json({
        success: true,
        message: 'Business is already in sync',
        fixesApplied: 0
      })
    }

    if (analysis.status === 'no_stripe_customer') {
      return NextResponse.json({
        success: false,
        message: 'No Stripe customer found for this business owner. Cannot sync.',
        fixesApplied: 0
      })
    }

    let fixesApplied = 0
    const fixResults: string[] = []

    for (const issue of analysis.issues) {
      try {
        switch (issue.type) {
          case 'duplicate_subs': {
            // Cancel all but the most recent subscription
            const subs = analysis.stripeSubscriptions
            const sorted = [...subs].sort((a, b) => 
              new Date(b.created).getTime() - new Date(a.created).getTime()
            )
            for (let i = 1; i < sorted.length; i++) {
              if (['active', 'trialing', 'paused', 'past_due'].includes(sorted[i].status)) {
                await stripe.subscriptions.cancel(sorted[i].id)
                fixResults.push(`Canceled duplicate subscription ${sorted[i].id}`)
                fixesApplied++
              }
            }
            break
          }

          case 'missing_subscription': {
            // Create DB Subscription record from the most relevant Stripe sub
            const activeSub = analysis.stripeSubscriptions
              .sort((a, b) => new Date(b.created).getTime() - new Date(a.created).getTime())[0]
            
            if (activeSub) {
              const plan = mapStripePlanToDb(activeSub.priceId)
              const newSub = await prisma.subscription.create({
                data: {
                  stripeId: activeSub.id,
                  status: activeSub.status,
                  priceId: activeSub.priceId,
                  plan: plan as any,
                  currentPeriodStart: new Date(),
                  currentPeriodEnd: new Date(activeSub.currentPeriodEnd),
                  cancelAtPeriodEnd: activeSub.cancelAtPeriodEnd,
                }
              })

              // Link to owner
              const business = await prisma.business.findUnique({
                where: { id: businessId },
                include: { users: { where: { role: 'OWNER' }, include: { user: true } } }
              })
              const owner = business?.users[0]?.user
              if (owner) {
                await prisma.user.update({
                  where: { id: owner.id },
                  data: { subscriptionId: newSub.id }
                })
              }

              fixResults.push(`Created Subscription record for ${activeSub.id}`)
              fixesApplied++
            }
            break
          }

          case 'price_id_mismatch': {
            // Update only the Subscription record so priceId/billing (monthly/yearly) matches Stripe
            const primarySub = analysis.stripeSubscriptions
              .filter(s => ['active', 'trialing'].includes(s.status))
              .sort((a, b) => new Date(b.created).getTime() - new Date(a.created).getTime())[0]
            if (primarySub && analysis.dbSubscription) {
              const plan = mapStripePlanToDb(primarySub.priceId)
              await prisma.subscription.update({
                where: { id: analysis.dbSubscription.id },
                data: {
                  stripeId: primarySub.id,
                  status: primarySub.status,
                  priceId: primarySub.priceId,
                  plan: plan as any,
                  currentPeriodEnd: new Date(primarySub.currentPeriodEnd),
                  cancelAtPeriodEnd: primarySub.cancelAtPeriodEnd,
                }
              })
              fixResults.push(`Updated Subscription priceId/period from Stripe (e.g. monthly/yearly)`)
              fixesApplied++
            }
            break
          }

          case 'plan_mismatch':
          case 'status_mismatch': {
            // Sync DB plan/status to match Stripe
            const primarySub = analysis.stripeSubscriptions
              .filter(s => ['active', 'trialing'].includes(s.status))
              .sort((a, b) => new Date(b.created).getTime() - new Date(a.created).getTime())[0]
              || analysis.stripeSubscriptions[0]

            if (primarySub) {
              const plan = mapStripePlanToDb(primarySub.priceId)
              const isActive = ['active', 'trialing'].includes(primarySub.status)
              const isPaused = primarySub.status === 'paused'

              // Update business
              await prisma.business.update({
                where: { id: businessId },
                data: {
                  subscriptionPlan: isActive ? plan as any : 'STARTER',
                  subscriptionStatus: isActive ? 'ACTIVE' : isPaused ? 'INACTIVE' : 'CANCELLED',
                  ...(isActive ? { trialEndsAt: null, graceEndsAt: null } : {})
                } as any
              })

              // Update owner user
              const business = await prisma.business.findUnique({
                where: { id: businessId },
                include: { users: { where: { role: 'OWNER' }, include: { user: true } } }
              })
              const owner = business?.users[0]?.user
              if (owner) {
                await prisma.user.update({
                  where: { id: owner.id },
                  data: {
                    plan: isActive ? plan as any : 'STARTER',
                    ...(isActive ? { trialEndsAt: null, graceEndsAt: null } : {})
                  } as any
                })
              }

              // Update DB subscription record
              if (analysis.dbSubscription) {
                await prisma.subscription.update({
                  where: { id: analysis.dbSubscription.id },
                  data: {
                    stripeId: primarySub.id,
                    status: primarySub.status,
                    priceId: primarySub.priceId,
                    plan: plan as any,
                    currentPeriodEnd: new Date(primarySub.currentPeriodEnd),
                    cancelAtPeriodEnd: primarySub.cancelAtPeriodEnd,
                  }
                })
              }

              fixResults.push(`Synced plan to ${isActive ? plan : 'STARTER'} (Stripe: ${primarySub.status})`)
              fixesApplied++
            }
            break
          }

          case 'orphaned_db_record': {
            // Unlink the orphaned subscription record
            const business = await prisma.business.findUnique({
              where: { id: businessId },
              include: { users: { where: { role: 'OWNER' }, include: { user: true } } }
            })
            const owner = business?.users[0]?.user
            if (owner && analysis.dbSubscription) {
              await prisma.user.update({
                where: { id: owner.id },
                data: { subscriptionId: null }
              })
              try {
                await prisma.subscription.delete({
                  where: { id: analysis.dbSubscription.id }
                })
              } catch { /* may fail if referenced */ }
              fixResults.push('Removed orphaned DB subscription record')
              fixesApplied++
            }
            break
          }
        }
      } catch (fixError: any) {
        fixResults.push(`Failed to fix ${issue.type}: ${fixError.message}`)
      }
    }

    // Update sync status on business
    await prisma.business.update({
      where: { id: businessId },
      data: {
        lastStripeSync: new Date(),
        stripeSyncStatus: fixesApplied > 0 ? 'in_sync' : 'issues_found'
      }
    })

    const host = request.headers.get('host') || request.headers.get('x-forwarded-host')
    const protocol = request.headers.get('x-forwarded-proto') || (process.env.NODE_ENV === 'production' ? 'https' : 'http')
    const actualUrl = host ? `${protocol}://${host}${new URL(request.url).pathname}` : request.url

    await logSystemEvent({
      logType: 'admin_action',
      severity: 'info',
      endpoint: `/api/superadmin/businesses/${businessId}/stripe-sync`,
      method: 'POST',
      url: actualUrl,
      businessId,
      metadata: {
        action: 'stripe_sync_fix',
        fixesApplied,
        fixResults,
        syncedBy: session.user.email
      }
    })

    return NextResponse.json({
      success: true,
      message: `Applied ${fixesApplied} fix(es)`,
      fixesApplied,
      details: fixResults
    })

  } catch (error: any) {
    console.error('Error fixing business sync:', error)
    return NextResponse.json(
      { message: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * Core analysis function — compares Stripe reality with DB state
 */
async function analyseBusinessSync(businessId: string): Promise<SyncAnalysis> {
  const business = await prisma.business.findUnique({
    where: { id: businessId },
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

  if (!business) {
    throw new Error('Business not found')
  }

  const owner = business.users[0]?.user
  const stripeCustomerId = owner?.stripeCustomerId || null
  const dbSubscription = owner?.subscription || null
  const issues: SyncIssue[] = []

  const result: SyncAnalysis = {
    businessId,
    businessName: business.name,
    ownerEmail: owner?.email || null,
    stripeCustomerId,
    status: 'in_sync',
    issues: [],
    stripeSubscriptions: [],
    dbSubscription: dbSubscription ? {
      id: dbSubscription.id,
      stripeId: dbSubscription.stripeId,
      status: dbSubscription.status,
      plan: dbSubscription.plan,
      priceId: dbSubscription.priceId,
    } : null,
    dbPlan: business.subscriptionPlan,
    dbStatus: business.subscriptionStatus,
    hasPaymentMethod: false,
    lastPayment: null,
  }

  if (!stripeCustomerId) {
    result.status = 'no_stripe_customer'
    if (business.subscriptionPlan !== 'STARTER') {
      issues.push({
        type: 'no_stripe_customer',
        severity: 'warning',
        description: `Business is on ${business.subscriptionPlan} but owner has no Stripe customer ID`,
      })
    }
    result.issues = issues
    return result
  }

  // Fetch all Stripe subscriptions for this customer
  let stripeSubs: any[] = []
  try {
    const subsList = await stripe.subscriptions.list({
      customer: stripeCustomerId,
      limit: 20,
      expand: ['data.default_payment_method']
    })
    stripeSubs = subsList.data
  } catch (err: any) {
    if (err?.code === 'resource_missing') {
      result.status = 'issues_found'
      issues.push({
        type: 'no_stripe_customer',
        severity: 'critical',
        description: 'Stripe customer ID in DB does not exist in Stripe',
      })
      result.issues = issues
      return result
    }
    throw err
  }

  // Map Stripe subs for the response (include subscription + item IDs for comparison with DB)
  result.stripeSubscriptions = stripeSubs.map(s => {
    const firstItem = s.items.data[0]
    const priceId = firstItem?.price?.id
    const plan = mapStripePlanToDb(priceId)
    const unitAmount = firstItem?.price?.unit_amount || 0
    const billingLabel = unitAmount === 0 ? `${plan} (Free)` : plan

    return {
      id: s.id,
      subscriptionItemId: firstItem?.id || null,
      status: s.status,
      plan,
      displayPlan: billingLabel,
      priceId: priceId || '',
      currentPeriodEnd: new Date(s.current_period_end * 1000).toISOString(),
      cancelAtPeriodEnd: s.cancel_at_period_end,
      created: new Date(s.created * 1000).toISOString(),
    }
  })

  // Check for payment method
  try {
    const paymentMethods = await stripe.paymentMethods.list({
      customer: stripeCustomerId,
      type: 'card',
      limit: 1
    })
    result.hasPaymentMethod = paymentMethods.data.length > 0
  } catch { /* ignore */ }

  // Check for last payment
  try {
    const charges = await stripe.charges.list({
      customer: stripeCustomerId,
      limit: 1,
    })
    if (charges.data.length > 0) {
      const charge = charges.data[0]
      result.lastPayment = {
        amount: charge.amount / 100,
        currency: charge.currency,
        date: new Date(charge.created * 1000).toISOString(),
      }
    }
  } catch { /* ignore */ }

  // Filter to non-canceled subs
  const activeSubs = stripeSubs.filter(s => !['canceled', 'incomplete_expired'].includes(s.status))

  // Issue: Duplicate subscriptions
  if (activeSubs.length > 1) {
    issues.push({
      type: 'duplicate_subs',
      severity: 'critical',
      description: `${activeSubs.length} active/paused Stripe subscriptions found (should be max 1)`,
      stripeData: activeSubs.map(s => ({ id: s.id, status: s.status, created: new Date(s.created * 1000).toISOString() })),
      fix: 'Cancel duplicates, keep most recent'
    })
  }

  // The "primary" Stripe sub is the most recent non-canceled one
  const primaryStripeSub = activeSubs
    .sort((a, b) => b.created - a.created)[0] || null

  // Issue: No DB subscription record but Stripe sub exists
  if (primaryStripeSub && !dbSubscription) {
    issues.push({
      type: 'missing_subscription',
      severity: 'critical',
      description: 'Stripe subscription exists but no Subscription record in DB',
      stripeData: { id: primaryStripeSub.id, status: primaryStripeSub.status },
      fix: 'Create DB Subscription record from Stripe data'
    })
  }

  // Issue: DB subscription record references a non-existent Stripe sub
  if (dbSubscription && !stripeSubs.find(s => s.id === dbSubscription.stripeId)) {
    issues.push({
      type: 'orphaned_db_record',
      severity: 'warning',
      description: `DB Subscription references Stripe ID ${dbSubscription.stripeId} which no longer exists`,
      dbData: { id: dbSubscription.id, stripeId: dbSubscription.stripeId },
      fix: 'Remove orphaned DB record'
    })
  }

  // Issue: Plan mismatch between Stripe and DB
  if (primaryStripeSub) {
    const stripePlan = mapStripePlanToDb(primaryStripeSub.items.data[0]?.price?.id)
    const unitAmount = primaryStripeSub.items.data[0]?.price?.unit_amount || 0
    const stripeIsActive = ['active', 'trialing'].includes(primaryStripeSub.status)
    const stripeIsPaused = primaryStripeSub.status === 'paused'
    const displayPlan = unitAmount === 0 ? `${stripePlan} (Free)` : stripePlan

    if (stripeIsActive && business.subscriptionPlan !== stripePlan) {
      issues.push({
        type: 'plan_mismatch',
        severity: 'critical',
        description: `Stripe has active ${displayPlan} subscription, but DB shows ${business.subscriptionPlan}`,
        stripeData: { plan: stripePlan, status: primaryStripeSub.status },
        dbData: { plan: business.subscriptionPlan },
        fix: `Update DB to ${stripePlan}`
      })
    }

    if (stripeIsPaused && business.subscriptionPlan !== 'STARTER' && business.subscriptionStatus === 'ACTIVE') {
      issues.push({
        type: 'status_mismatch',
        severity: 'critical',
        description: `Stripe subscription is paused (trial expired), but DB still shows ${business.subscriptionPlan} / ACTIVE`,
        stripeData: { status: 'paused' },
        dbData: { plan: business.subscriptionPlan, status: business.subscriptionStatus },
        fix: 'Downgrade DB to STARTER / INACTIVE'
      })
    }

    if (stripeIsActive && business.subscriptionStatus !== 'ACTIVE') {
      issues.push({
        type: 'status_mismatch',
        severity: 'warning',
        description: `Stripe subscription is ${primaryStripeSub.status}, but DB status is ${business.subscriptionStatus}`,
        fix: 'Update DB status to ACTIVE'
      })
    }
  }

  // No active Stripe subs but DB shows paid plan
  if (!primaryStripeSub && business.subscriptionPlan !== 'STARTER' && !business.trialEndsAt) {
    issues.push({
      type: 'status_mismatch',
      severity: 'warning',
      description: `No active Stripe subscriptions, but DB shows ${business.subscriptionPlan}. May be a free override.`,
    })
  }

  // Issue: DB Subscription priceId differs from Stripe (e.g. switched to monthly/yearly in Stripe)
  const stripePriceId = primaryStripeSub?.items?.data?.[0]?.price?.id ?? null
  if (
    primaryStripeSub &&
    dbSubscription &&
    stripePriceId &&
    ['active', 'trialing'].includes(primaryStripeSub.status) &&
    dbSubscription.priceId !== stripePriceId
  ) {
    issues.push({
      type: 'price_id_mismatch',
      severity: 'warning',
      description: 'Stripe subscription price (e.g. monthly/yearly) changed; DB Subscription still has old priceId',
      stripeData: { priceId: stripePriceId },
      dbData: { priceId: dbSubscription.priceId },
      fix: 'Update DB Subscription priceId and period from Stripe'
    })
  }

  result.issues = issues
  result.status = issues.length > 0 ? 'issues_found' : 'in_sync'

  // Update sync tracking (analysis only, no fixes)
  await prisma.business.update({
    where: { id: businessId },
    data: {
      lastStripeSync: new Date(),
      stripeSyncStatus: result.status
    }
  })

  return result
}
