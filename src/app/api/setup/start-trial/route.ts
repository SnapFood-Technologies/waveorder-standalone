// app/api/setup/start-trial/route.ts
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { createStripeCustomer, createTrialSubscription } from '@/lib/stripe'
import { TRIAL_DAYS, calculateTrialEndDate, calculateGraceEndDate } from '@/lib/trial'
import { logSystemEvent } from '@/lib/systemLog'

export async function POST(request: Request) {
  let currentStep = 'init'
  let userId: string | undefined
  let userEmail: string | undefined
  
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

    // Check if user has already used their trial
    if ((user as any).trialUsed) {
      return NextResponse.json({ 
        message: 'You have already used your free trial. Please select a paid plan.' 
      }, { status: 400 })
    }

    // Create Stripe customer if doesn't exist
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

    // Create Pro subscription with 14-day trial in Stripe
    currentStep = 'stripe_subscription'
    const subscription = await createTrialSubscription(stripeCustomerId)

    // Calculate trial dates
    currentStep = 'calculate_dates'
    const trialEndsAt = calculateTrialEndDate()
    const graceEndsAt = calculateGraceEndDate(trialEndsAt)

    // Update user with trial info
    currentStep = 'update_user'
    await prisma.user.update({
      where: { id: user.id },
      data: {
        plan: 'PRO',
        trialEndsAt,
        graceEndsAt,
        trialUsed: true
      } as any
    })

    // Update all user's businesses with trial info
    currentStep = 'update_businesses'
    if (user.businesses && user.businesses.length > 0) {
      for (const bu of user.businesses) {
        await prisma.business.update({
          where: { id: bu.businessId },
          data: {
            subscriptionPlan: 'PRO',
            subscriptionStatus: 'ACTIVE',
            trialEndsAt,
            graceEndsAt
          } as any
        })
      }
    }

    // Log successful trial start
    await logSystemEvent({
      logType: 'trial_started',
      severity: 'info',
      endpoint: '/api/setup/start-trial',
      method: 'POST',
      statusCode: 200,
      url: request.url,
      metadata: {
        userId,
        userEmail,
        plan: 'PRO',
        trialEndsAt: trialEndsAt.toISOString(),
        stripeSubscriptionId: subscription.id,
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
        stripeSubscriptionId: subscription.id
      },
      message: `Pro trial started successfully. You have ${TRIAL_DAYS} days to explore all Pro features.`
    })

  } catch (error: any) {
    // Log to system logs for SuperAdmin visibility
    await logSystemEvent({
      logType: 'trial_error',
      severity: 'error',
      endpoint: '/api/setup/start-trial',
      method: 'POST',
      statusCode: 500,
      url: request.url,
      errorMessage: error.message || 'Unknown error',
      errorStack: error.stack?.split('\n').slice(0, 5).join('\n'),
      metadata: {
        step: currentStep,
        userId,
        userEmail,
        errorType: error.type || error.name,
        errorCode: error.code,
        stripeError: error.raw?.message || null
      }
    })
    
    // Return more specific error messages
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