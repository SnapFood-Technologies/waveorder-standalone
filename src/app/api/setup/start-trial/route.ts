// app/api/setup/start-trial/route.ts
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { stripe, createStripeCustomer, createTrialSubscription, PLANS } from '@/lib/stripe'
import { TRIAL_DAYS, calculateTrialEndDate, calculateGraceEndDate } from '@/lib/trial'
import { logSystemEvent } from '@/lib/systemLog'

export async function POST(request: Request) {
  let currentStep = 'init'
  let userId: string | undefined
  let userEmail: string | undefined
  
  const host = request.headers.get('host') || request.headers.get('x-forwarded-host')
  const protocol = request.headers.get('x-forwarded-proto') || (process.env.NODE_ENV === 'production' ? 'https' : 'http')
  const actualUrl = host ? `${protocol}://${host}${new URL(request.url).pathname}` : request.url
  
  try {
    currentStep = 'session'
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
    }
    userEmail = session.user.email

    currentStep = 'find_user'
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: {
        subscription: true,
        businesses: {
          include: {
            business: true
          }
        }
      }
    })

    if (!user) {
      return NextResponse.json({ message: 'User not found' }, { status: 404 })
    }
    userId = user.id

    if ((user as any).trialUsed) {
      return NextResponse.json({ 
        message: 'You have already used your free trial. Please select a paid plan.' 
      }, { status: 400 })
    }

    currentStep = 'stripe_customer'
    let stripeCustomerId = user.stripeCustomerId
    
    if (!stripeCustomerId) {
      const stripeCustomer = await createStripeCustomer(user.email, user.name || undefined)
      stripeCustomerId = stripeCustomer.id
      
      await prisma.user.update({
        where: { id: user.id },
        data: { stripeCustomerId }
      })
    }

    // Check for existing Stripe subscriptions and clean up orphans
    currentStep = 'check_existing_subs'
    const existingStripeSubs = await stripe.subscriptions.list({
      customer: stripeCustomerId,
      limit: 10
    })

    for (const existingSub of existingStripeSubs.data) {
      if (existingSub.status === 'trialing' || existingSub.status === 'active') {
        // Already has an active/trialing sub — reuse it instead of creating a new one
        const trialEndsAt = calculateTrialEndDate()
        const graceEndsAt = calculateGraceEndDate(trialEndsAt)
        const priceId = existingSub.items.data[0]?.price?.id || PLANS.PRO.priceId

        const dbSubscription = await saveSubscriptionToDB(
          existingSub, priceId, 'PRO', user
        )
        await updateUserAndBusinesses(
          user, dbSubscription.id, 'PRO', trialEndsAt, graceEndsAt
        )

        await logSystemEvent({
          logType: 'trial_started',
          severity: 'info',
          endpoint: '/api/setup/start-trial',
          method: 'POST',
          statusCode: 200,
          url: actualUrl,
          metadata: {
            userId, userEmail, plan: 'PRO',
            trialEndsAt: trialEndsAt.toISOString(),
            stripeSubscriptionId: existingSub.id,
            action: 'trial_start_reused_existing'
          }
        })

        return NextResponse.json({
          success: true,
          trial: {
            plan: 'PRO',
            trialStart: new Date(),
            trialEnd: trialEndsAt,
            status: 'TRIAL_ACTIVE',
            stripeSubscriptionId: existingSub.id
          },
          message: `Pro trial started successfully. You have ${TRIAL_DAYS} days to explore all Pro features.`
        })
      }

      // Cancel paused/past_due/incomplete subs to avoid duplicates
      if (['paused', 'past_due', 'incomplete'].includes(existingSub.status)) {
        try {
          await stripe.subscriptions.cancel(existingSub.id)
        } catch (cancelError) {
          console.error(`Failed to cancel orphaned sub ${existingSub.id}:`, cancelError)
        }
      }
    }

    // Clean up any orphaned DB Subscription record that no longer exists in Stripe
    if (user.subscription) {
      try {
        await stripe.subscriptions.retrieve(user.subscription.stripeId)
      } catch {
        // Stripe sub doesn't exist anymore — unlink from user
        await prisma.user.update({
          where: { id: user.id },
          data: { subscriptionId: null }
        })
      }
    }

    currentStep = 'stripe_subscription'
    const stripeSubscription = await createTrialSubscription(stripeCustomerId)

    currentStep = 'save_subscription'
    const trialEndsAt = calculateTrialEndDate()
    const graceEndsAt = calculateGraceEndDate(trialEndsAt)

    const dbSubscription = await saveSubscriptionToDB(
      stripeSubscription, PLANS.PRO.priceId, 'PRO', user
    )

    currentStep = 'update_user_and_businesses'
    await updateUserAndBusinesses(
      user, dbSubscription.id, 'PRO', trialEndsAt, graceEndsAt
    )

    await logSystemEvent({
      logType: 'trial_started',
      severity: 'info',
      endpoint: '/api/setup/start-trial',
      method: 'POST',
      statusCode: 200,
      url: actualUrl,
      metadata: {
        userId, userEmail, plan: 'PRO',
        trialEndsAt: trialEndsAt.toISOString(),
        stripeSubscriptionId: stripeSubscription.id,
        action: 'trial_start_success'
      }
    })

    return NextResponse.json({
      success: true,
      trial: {
        plan: 'PRO',
        trialStart: new Date(),
        trialEnd: trialEndsAt,
        status: 'TRIAL_ACTIVE',
        stripeSubscriptionId: stripeSubscription.id
      },
      message: `Pro trial started successfully. You have ${TRIAL_DAYS} days to explore all Pro features.`
    })

  } catch (error: any) {
    await logSystemEvent({
      logType: 'trial_error',
      severity: 'error',
      endpoint: '/api/setup/start-trial',
      method: 'POST',
      statusCode: 500,
      url: actualUrl,
      errorMessage: error.message || 'Unknown error',
      errorStack: error.stack?.split('\n').slice(0, 5).join('\n'),
      metadata: {
        step: currentStep,
        userId, userEmail,
        errorType: error.type || error.name,
        errorCode: error.code,
        stripeError: error.raw?.message || null
      }
    })
    
    if (error.type === 'StripeInvalidRequestError') {
      return NextResponse.json({ 
        message: `Payment system error: ${error.message}` 
      }, { status: 500 })
    }
    
    if (error.code === 'resource_missing') {
      return NextResponse.json({ 
        message: 'Payment plan not configured. Please contact support.' 
      }, { status: 500 })
    }
    
    return NextResponse.json({ 
      message: 'Failed to start trial. Please try again.' 
    }, { status: 500 })
  }
}

/**
 * Creates or updates the Subscription record in DB and links it to the user.
 * Prevents duplicates by checking for existing record with the same stripeId.
 */
async function saveSubscriptionToDB(
  stripeSub: { id: string; status: string; current_period_start: number; current_period_end: number },
  priceId: string,
  plan: string,
  user: { id: string; subscription?: { id: string; stripeId: string } | null }
) {
  // Check if a DB record already exists for this Stripe subscription
  const existing = await prisma.subscription.findUnique({
    where: { stripeId: stripeSub.id }
  })

  if (existing) {
    return await prisma.subscription.update({
      where: { id: existing.id },
      data: {
        status: stripeSub.status,
        priceId,
        plan: plan as any,
        currentPeriodStart: new Date(stripeSub.current_period_start * 1000),
        currentPeriodEnd: new Date(stripeSub.current_period_end * 1000),
        cancelAtPeriodEnd: false,
        canceledAt: null
      }
    })
  }

  // If user already has a different subscription record, update it
  if (user.subscription) {
    return await prisma.subscription.update({
      where: { id: user.subscription.id },
      data: {
        stripeId: stripeSub.id,
        status: stripeSub.status,
        priceId,
        plan: plan as any,
        currentPeriodStart: new Date(stripeSub.current_period_start * 1000),
        currentPeriodEnd: new Date(stripeSub.current_period_end * 1000),
        cancelAtPeriodEnd: false,
        canceledAt: null
      }
    })
  }

  return await prisma.subscription.create({
    data: {
      stripeId: stripeSub.id,
      status: stripeSub.status,
      priceId,
      plan: plan as any,
      currentPeriodStart: new Date(stripeSub.current_period_start * 1000),
      currentPeriodEnd: new Date(stripeSub.current_period_end * 1000),
    }
  })
}

/**
 * Updates User plan/trial fields and syncs all associated businesses.
 */
async function updateUserAndBusinesses(
  user: { id: string; businesses?: { businessId: string }[] },
  subscriptionId: string,
  plan: string,
  trialEndsAt: Date,
  graceEndsAt: Date
) {
  await prisma.user.update({
    where: { id: user.id },
    data: {
      plan,
      subscriptionId,
      trialEndsAt,
      graceEndsAt,
      trialUsed: true
    } as any
  })

  if (user.businesses && user.businesses.length > 0) {
    for (const bu of user.businesses) {
      await prisma.business.update({
        where: { id: bu.businessId },
        data: {
          subscriptionPlan: plan,
          subscriptionStatus: 'ACTIVE',
          trialEndsAt,
          graceEndsAt
        } as any
      })
    }
  }
}