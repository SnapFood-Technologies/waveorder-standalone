// Subscription status API — verifies against Stripe for accuracy
import { NextRequest, NextResponse } from 'next/server'
import { checkBusinessAccess } from '@/lib/api-helpers'
import { prisma } from '@/lib/prisma'
import { getBusinessTrialInfo } from '@/lib/trial'
import { PLAN_HIERARCHY, stripe, mapStripePlanToDb } from '@/lib/stripe'

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ businessId: string }> }
) {
  try {
    const { businessId } = await context.params

    const access = await checkBusinessAccess(businessId)
    
    if (!access.authorized) {
      return NextResponse.json({ message: access.error }, { status: access.status })
    }

    const business = await prisma.business.findUnique({
      where: { id: businessId },
      include: {
        users: {
          where: { userId: access.session.user.id },
          select: { role: true }
        }
      }
    })

    if (!business) {
      return NextResponse.json({ message: 'Business not found' }, { status: 404 })
    }

    // Get the business owner to check Stripe subscription
    const owner = await prisma.user.findFirst({
      where: {
        businesses: { some: { businessId, role: 'OWNER' } }
      },
      include: { subscription: true }
    })

    // Verify against Stripe if the owner has a Stripe customer ID
    let stripeVerified = false
    let stripeSubscriptionActive = false
    let stripePlan: string | null = null
    let stripeTrialing = false

    if (owner?.stripeCustomerId) {
      try {
        const subscriptions = await stripe.subscriptions.list({
          customer: owner.stripeCustomerId,
          status: 'all',
          limit: 10,
        })

        // Find the most relevant subscription (active > trialing > others)
        const activeSub = subscriptions.data.find(s => s.status === 'active')
        const trialSub = subscriptions.data.find(s => s.status === 'trialing')
        const relevantSub = activeSub || trialSub

        if (relevantSub) {
          stripeVerified = true
          stripeSubscriptionActive = relevantSub.status === 'active'
          stripeTrialing = relevantSub.status === 'trialing'
          const priceId = relevantSub.items.data[0]?.price?.id
          if (priceId) {
            stripePlan = mapStripePlanToDb(priceId)
          }
        } else {
          stripeVerified = true
          // No active/trialing subscription in Stripe
        }
      } catch {
        // Stripe call failed — fall back to DB-only
      }
    }

    // Build trial info from DB
    const trialInfo = getBusinessTrialInfo({
      trialEndsAt: (business as any).trialEndsAt,
      graceEndsAt: (business as any).graceEndsAt,
      subscriptionPlan: business.subscriptionPlan
    })

    // If Stripe verification succeeded, use Stripe as source of truth for paid status
    let effectiveStatus = trialInfo.status
    let effectivePlan = trialInfo.effectivePlan

    if (stripeVerified) {
      if (stripeSubscriptionActive && stripePlan) {
        effectiveStatus = 'PAID'
        effectivePlan = stripePlan as any
      } else if (stripeTrialing) {
        effectiveStatus = 'TRIAL_ACTIVE'
        // Keep the plan from DB or Stripe
        if (stripePlan) effectivePlan = stripePlan as any
      }
      // If no Stripe subscription and DB says PAID, the DB might be stale
      // but we don't want to lock users out unexpectedly, so keep DB status
    }

    const isActive = business.subscriptionStatus === 'ACTIVE' ||
      effectiveStatus === 'PAID' ||
      trialInfo.canAccessFeatures
    const planLevel = PLAN_HIERARCHY[effectivePlan as keyof typeof PLAN_HIERARCHY] || 0

    const hasProAccess = isActive && planLevel >= PLAN_HIERARCHY.PRO
    const hasBusinessAccess = isActive && planLevel >= PLAN_HIERARCHY.BUSINESS

    return NextResponse.json({
      businessId: business.id,
      businessName: business.name,
      subscriptionPlan: effectivePlan,
      subscriptionStatus: business.subscriptionStatus,
      hasProAccess,
      hasBusinessAccess,
      userRole: business.users[0]?.role || 'OWNER',
      // Trial info
      trialStatus: effectiveStatus,
      trialDaysRemaining: trialInfo.trialDaysRemaining,
      graceDaysRemaining: trialInfo.graceDaysRemaining,
      isTrialActive: effectiveStatus === 'TRIAL_ACTIVE' || trialInfo.isTrialActive,
      isGracePeriod: trialInfo.isGracePeriod,
      isExpired: trialInfo.isExpired && !stripeSubscriptionActive,
      isStarterLimited: trialInfo.isStarterLimited && !stripeSubscriptionActive,
      isPaid: effectiveStatus === 'PAID' || stripeSubscriptionActive,
      canAccessFeatures: trialInfo.canAccessFeatures || stripeSubscriptionActive || stripeTrialing,
      effectivePlan,
      showTrialWarning: trialInfo.showTrialWarning,
      showGraceWarning: trialInfo.showGraceWarning && !stripeSubscriptionActive,
      showExpiredWarning: trialInfo.showExpiredWarning && !stripeSubscriptionActive,
      stripeVerified,
    })

  } catch (error) {
    console.error('Subscription check error:', error)
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    )
  }
}
