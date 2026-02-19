// app/api/superadmin/businesses/[businessId]/upgrade-plan/route.ts
// Upgrade a business plan with optional trial period
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { logSystemEvent } from '@/lib/systemLog'
import { stripe, createStripeCustomer } from '@/lib/stripe'

// Plan hierarchy for validation
const PLAN_HIERARCHY: Record<string, number> = {
  'STARTER': 1,
  'PRO': 2,
  'BUSINESS': 3
}

// Price IDs mapping
function getPriceIdForPlan(plan: string, billingType: string): string | null {
  const priceIds: Record<string, Record<string, string | undefined>> = {
    'PRO': {
      'monthly': process.env.STRIPE_PRO_PRICE_ID,
      'yearly': process.env.STRIPE_PRO_ANNUAL_PRICE_ID,
      'free': process.env.STRIPE_PRO_FREE_PRICE_ID
    },
    'BUSINESS': {
      'monthly': process.env.STRIPE_BUSINESS_PRICE_ID,
      'yearly': process.env.STRIPE_BUSINESS_ANNUAL_PRICE_ID,
      'free': process.env.STRIPE_BUSINESS_FREE_PRICE_ID
    }
  }
  
  return priceIds[plan]?.[billingType] || null
}

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
    const body = await request.json()
    const { 
      targetPlan, 
      trialDays = 14, 
      sendEmail = true,
      reason 
    } = body

    // Validate targetPlan
    if (!targetPlan || !['PRO', 'BUSINESS'].includes(targetPlan)) {
      return NextResponse.json({ 
        message: 'Target plan must be PRO or BUSINESS' 
      }, { status: 400 })
    }

    // Validate trialDays
    if (![7, 14, 30].includes(trialDays)) {
      return NextResponse.json({ 
        message: 'Trial days must be 7, 14, or 30' 
      }, { status: 400 })
    }

    // Get business with owner
    const business = await prisma.business.findUnique({
      where: { id: businessId },
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

    if (!business) {
      return NextResponse.json({ message: 'Business not found' }, { status: 404 })
    }

    const ownerRelation = business.users.find(u => u.role === 'OWNER')
    if (!ownerRelation?.user) {
      return NextResponse.json({ message: 'Business owner not found' }, { status: 404 })
    }

    const owner = ownerRelation.user
    const currentPlan = business.subscriptionPlan

    // Validation: Can only upgrade, not downgrade
    if (PLAN_HIERARCHY[targetPlan] <= PLAN_HIERARCHY[currentPlan]) {
      return NextResponse.json({ 
        message: `Cannot upgrade from ${currentPlan} to ${targetPlan}. Target plan must be higher than current plan.`,
        currentPlan,
        targetPlan
      }, { status: 400 })
    }

    // Validation: Check if already on trial for the same or higher plan
    if (business.trialEndsAt && new Date(business.trialEndsAt) > new Date()) {
      const trialDaysRemaining = Math.ceil(
        (new Date(business.trialEndsAt).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
      )
      return NextResponse.json({ 
        message: `Business already has an active trial (${trialDaysRemaining} days remaining). Reset trial first if you want to start a new one.`,
        trialEndsAt: business.trialEndsAt,
        trialDaysRemaining
      }, { status: 400 })
    }

    // Validation: Check if onboarding is completed
    if (!business.onboardingCompleted) {
      return NextResponse.json({ 
        message: 'Business has not completed onboarding. They should complete setup first.',
        onboardingCompleted: business.onboardingCompleted
      }, { status: 400 })
    }

    // Get price ID for the plan
    const priceId = getPriceIdForPlan(targetPlan, 'monthly')
    if (!priceId) {
      return NextResponse.json({ 
        message: `Price ID not configured for ${targetPlan} plan. Check Stripe environment variables.` 
      }, { status: 500 })
    }

    // Create or get Stripe customer
    let stripeCustomerId = owner.stripeCustomerId
    if (!stripeCustomerId) {
      try {
        const stripeCustomer = await createStripeCustomer(owner.email, owner.name || undefined)
        stripeCustomerId = stripeCustomer.id
        
        await prisma.user.update({
          where: { id: owner.id },
          data: { stripeCustomerId }
        })
      } catch (error: any) {
        console.error('Error creating Stripe customer:', error)
        return NextResponse.json({ 
          message: `Failed to create Stripe customer: ${error.message}` 
        }, { status: 500 })
      }
    }

    // Cancel ALL existing Stripe subscriptions (both DB-linked and orphaned)
    if (stripeCustomerId) {
      try {
        const existingSubs = await stripe.subscriptions.list({
          customer: stripeCustomerId,
          limit: 20
        })

        for (const existingSub of existingSubs.data) {
          if (['active', 'trialing', 'paused', 'past_due', 'incomplete'].includes(existingSub.status)) {
            try {
              await stripe.subscriptions.cancel(existingSub.id)
            } catch (cancelErr: any) {
              if (cancelErr?.code !== 'resource_missing') {
                console.error(`Error canceling sub ${existingSub.id}:`, cancelErr)
              }
            }
          }
        }
      } catch (listErr) {
        console.error('Error listing Stripe subscriptions:', listErr)
      }
    } else if (owner.subscription?.stripeId) {
      // Fallback: cancel DB-linked sub only if no stripeCustomerId
      try {
        await stripe.subscriptions.cancel(owner.subscription.stripeId)
      } catch (error: any) {
        if (error?.code !== 'resource_missing') {
          console.error('Error canceling existing subscription:', error)
        }
      }
    }

    // Create new subscription with trial
    let stripeSubscription: any
    try {
      stripeSubscription = await stripe.subscriptions.create({
        customer: stripeCustomerId,
        items: [{ price: priceId }],
        trial_period_days: trialDays,
        payment_settings: {
          save_default_payment_method: 'on_subscription'
        },
        trial_settings: {
          end_behavior: {
            missing_payment_method: 'pause'
          }
        },
        metadata: {
          plan: targetPlan,
          billingType: 'trial',
          source: 'superadmin_upgrade',
          upgradedBy: session.user.email || 'superadmin',
          reason: reason || 'SuperAdmin upgrade'
        }
      })
    } catch (error: any) {
      console.error('Error creating Stripe subscription:', error)
      return NextResponse.json({ 
        message: `Failed to create Stripe subscription: ${error.message}` 
      }, { status: 500 })
    }

    // Calculate trial end date
    const trialEndsAt = new Date()
    trialEndsAt.setDate(trialEndsAt.getDate() + trialDays)
    
    // Calculate grace end date (7 days after trial)
    const graceEndsAt = new Date(trialEndsAt)
    graceEndsAt.setDate(graceEndsAt.getDate() + 7)

    // Update database in transaction
    const result = await prisma.$transaction(async (tx) => {
      // Update or create subscription record
      let subscription
      if (owner.subscription) {
        subscription = await tx.subscription.update({
          where: { id: owner.subscription.id },
          data: {
            stripeId: stripeSubscription.id,
            status: stripeSubscription.status,
            priceId: priceId,
            plan: targetPlan as any,
            currentPeriodStart: new Date(stripeSubscription.current_period_start * 1000),
            currentPeriodEnd: new Date(stripeSubscription.current_period_end * 1000),
            cancelAtPeriodEnd: false,
            canceledAt: null
          }
        })
      } else {
        subscription = await tx.subscription.create({
          data: {
            stripeId: stripeSubscription.id,
            status: stripeSubscription.status,
            priceId: priceId,
            plan: targetPlan as any,
            currentPeriodStart: new Date(stripeSubscription.current_period_start * 1000),
            currentPeriodEnd: new Date(stripeSubscription.current_period_end * 1000),
          }
        })
      }

      // Update owner user
      await tx.user.update({
        where: { id: owner.id },
        data: {
          plan: targetPlan as any,
          subscriptionId: subscription.id,
          trialEndsAt,
          graceEndsAt,
          trialUsed: true
        }
      })

      // Update business
      const updatedBusiness = await tx.business.update({
        where: { id: businessId },
        data: {
          subscriptionPlan: targetPlan as any,
          subscriptionStatus: 'ACTIVE',
          trialEndsAt,
          graceEndsAt
        }
      })

      return { business: updatedBusiness, subscription }
    })

    // Construct actual URL from headers
    const host = request.headers.get('host') || request.headers.get('x-forwarded-host')
    const protocol = request.headers.get('x-forwarded-proto') || (process.env.NODE_ENV === 'production' ? 'https' : 'http')
    const actualUrl = host ? `${protocol}://${host}${new URL(request.url).pathname}` : request.url

    // Log the action
    await logSystemEvent({
      logType: 'admin_action',
      severity: 'info',
      endpoint: `/api/superadmin/businesses/${businessId}/upgrade-plan`,
      method: 'POST',
      url: actualUrl,
      businessId,
      metadata: {
        action: 'plan_upgrade_with_trial',
        previousPlan: currentPlan,
        newPlan: targetPlan,
        trialDays,
        trialEndsAt: trialEndsAt.toISOString(),
        stripeSubscriptionId: stripeSubscription.id,
        upgradedBy: session.user.email,
        reason: reason || null,
        emailSent: sendEmail
      }
    })

    // Send email notification if requested
    if (sendEmail && owner.email) {
      try {
        const { sendPlanUpgradeEmail } = await import('@/lib/email')
        await sendPlanUpgradeEmail({
          to: owner.email,
          name: owner.name || 'there',
          businessName: business.name,
          newPlan: targetPlan,
          trialDays,
          trialEndsAt,
          upgradedBy: session.user.name || session.user.email || 'SuperAdmin'
        })
      } catch (emailError) {
        console.error('Error sending upgrade email:', emailError)
        // Don't fail the request if email fails
      }
    }

    return NextResponse.json({
      success: true,
      message: `Successfully upgraded ${business.name} to ${targetPlan} with ${trialDays}-day trial`,
      business: {
        id: result.business.id,
        name: result.business.name,
        subscriptionPlan: result.business.subscriptionPlan,
        trialEndsAt: result.business.trialEndsAt,
        graceEndsAt: result.business.graceEndsAt
      },
      stripeSubscriptionId: stripeSubscription.id,
      emailSent: sendEmail
    })

  } catch (error: any) {
    console.error('Error upgrading business plan:', error)
    return NextResponse.json(
      { message: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}
