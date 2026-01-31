// app/api/setup/start-trial/route.ts
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { createStripeCustomer, createTrialSubscription } from '@/lib/stripe'
import { TRIAL_DAYS, calculateTrialEndDate, calculateGraceEndDate } from '@/lib/trial'

export async function POST() {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
    }

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

    // Check if user has already used their trial
    if ((user as any).trialUsed) {
      return NextResponse.json({ 
        message: 'You have already used your free trial. Please select a paid plan.' 
      }, { status: 400 })
    }

    // Create Stripe customer if doesn't exist
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
    const subscription = await createTrialSubscription(stripeCustomerId)

    // Calculate trial dates
    const trialEndsAt = calculateTrialEndDate()
    const graceEndsAt = calculateGraceEndDate(trialEndsAt)

    // Update user with trial info
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
    if (user.businesses && user.businesses.length > 0) {
      for (const bu of user.businesses) {
        await prisma.business.update({
          where: { id: bu.businessId },
          data: {
            subscriptionPlan: 'PRO',
            subscriptionStatus: 'TRIALING',
            trialEndsAt,
            graceEndsAt
          } as any
        })
      }
    }

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

  } catch (error) {
    console.error('Start trial error:', error)
    return NextResponse.json({ 
      message: 'Failed to start trial. Please try again.' 
    }, { status: 500 })
  }
}