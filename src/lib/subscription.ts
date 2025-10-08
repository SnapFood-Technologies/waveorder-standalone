// lib/subscription.ts
import { PrismaClient } from '@prisma/client'
import { 
  createStripeCustomer, 
  createFreeSubscription, 
  createPaidSubscription,
  updateSubscription,
  cancelSubscription,
  PLANS,
  type PlanId 
} from './stripe'

const prisma = new PrismaClient()

export interface CreateUserWithSubscriptionParams {
  name: string
  email: string
  password?: string
  plan?: PlanId
  provider?: 'credentials' | 'google' | 'email'
}

export async function createUserWithSubscription({
  name,
  email,
  password,
  plan = 'FREE',
  provider = 'credentials'
}: CreateUserWithSubscriptionParams) {
  try {
    // Create Stripe customer first
    const stripeCustomer = await createStripeCustomer(email, name)
    
    // Create free subscription in Stripe for tracking
    const stripeSubscription = await createFreeSubscription(stripeCustomer.id)
    
    // Create user and subscription in database
    const result = await prisma.$transaction(async (tx) => {
      // Create subscription record
      const subscription = await tx.subscription.create({
        data: {
          stripeId: stripeSubscription.id,
          status: stripeSubscription.status,
          priceId: PLANS.FREE.priceId,
          plan: 'FREE',
          currentPeriodStart: new Date(stripeSubscription.current_period_start * 1000),
          currentPeriodEnd: new Date(stripeSubscription.current_period_end * 1000),
        }
      })

      // Create user
      const user = await tx.user.create({
        data: {
          name,
          email: email.toLowerCase(),
          password,
          plan: 'FREE',
          stripeCustomerId: stripeCustomer.id,
          subscriptionId: subscription.id,
          emailVerified: provider !== 'credentials' ? new Date() : null,
        }
      })

      return { user, subscription }
    })

    return result
  } catch (error) {
    console.error('Error creating user with subscription:', error)
    throw error
  }
}

export async function upgradeUserSubscription(
  userId: string,
  newPlan: PlanId,
  isAnnual: boolean = false
) {
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { subscription: true }
    })

    if (!user || !user.subscription || !user.stripeCustomerId) {
      throw new Error('User or subscription not found')
    }

    const planData = PLANS[newPlan]
    const priceId = isAnnual ? planData.annualPriceId : planData.priceId

    let stripeSubscription

    if (newPlan === 'FREE') {
      // Downgrade to free - cancel current subscription and create free one
      await cancelSubscription(user.subscription.stripeId)
      stripeSubscription = await createFreeSubscription(user.stripeCustomerId)
    } else {
      // Upgrade/change to paid plan
      if (user.subscription.plan === 'FREE') {
        // From free to paid - create new paid subscription
        await cancelSubscription(user.subscription.stripeId)
        stripeSubscription = await createPaidSubscription(
          user.stripeCustomerId,
          priceId,
          newPlan
        )
      } else {
        // From paid to paid - update existing subscription
        stripeSubscription = await updateSubscription(
          user.subscription.stripeId,
          priceId,
          newPlan
        )
      }
    }

    // Update database
    const result = await prisma.$transaction(async (tx) => {
      // Update subscription
      const updatedSubscription = await tx.subscription.update({
        where: { id: user.subscription!.id },
        data: {
          stripeId: stripeSubscription.id,
          status: stripeSubscription.status,
          priceId: priceId,
          plan: newPlan,
          currentPeriodStart: new Date(stripeSubscription.current_period_start * 1000),
          currentPeriodEnd: new Date(stripeSubscription.current_period_end * 1000),
        }
      })

      // Update user plan
      const updatedUser = await tx.user.update({
        where: { id: userId },
        data: {
          plan: newPlan,
        }
      })

      return { user: updatedUser, subscription: updatedSubscription }
    })

    return result
  } catch (error) {
    console.error('Error upgrading subscription:', error)
    throw error
  }
}

export async function cancelUserSubscription(userId: string) {
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { subscription: true }
    })

    if (!user || !user.subscription) {
      throw new Error('User or subscription not found')
    }

    // Cancel in Stripe (at period end)
    await cancelSubscription(user.subscription.stripeId)

    // Update database - mark as canceling at period end
    await prisma.subscription.update({
      where: { id: user.subscription.id },
      data: {
        cancelAtPeriodEnd: true,
        canceledAt: new Date()
      }
    })

    return { success: true }
  } catch (error) {
    console.error('Error canceling subscription:', error)
    throw error
  }
}

export async function getUserSubscriptionStatus(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: { subscription: true }
  })

  if (!user) {
    throw new Error('User not found')
  }

  return {
    plan: user.plan,
    isActive: user.subscription?.status === 'active',
    status: user.subscription?.status || 'inactive',
    currentPeriodEnd: user.subscription?.currentPeriodEnd,
    cancelAtPeriodEnd: user.subscription?.cancelAtPeriodEnd || false,
    stripeCustomerId: user.stripeCustomerId,
    subscriptionId: user.subscription?.stripeId
  }
}

export async function syncSubscriptionFromStripe(stripeSubscriptionId: string) {
  try {
    const stripe = require('./stripe').stripe
    const stripeSubscription = await stripe.subscriptions.retrieve(stripeSubscriptionId)
    
    const subscription = await prisma.subscription.findUnique({
      where: { stripeId: stripeSubscriptionId },
      include: { users: true }
    })

    if (!subscription) {
      throw new Error('Subscription not found in database')
    }

    // Map Stripe price to our plan
    const { mapStripePlanToDb } = require('./stripe')
    const plan = mapStripePlanToDb(stripeSubscription.items.data[0].price.id)

    // Update subscription and user
    await prisma.$transaction(async (tx) => {
      await tx.subscription.update({
        where: { id: subscription.id },
        data: {
          status: stripeSubscription.status,
          plan,
          currentPeriodStart: new Date(stripeSubscription.current_period_start * 1000),
          currentPeriodEnd: new Date(stripeSubscription.current_period_end * 1000),
          cancelAtPeriodEnd: stripeSubscription.cancel_at_period_end,
        }
      })

      // Update all users on this subscription
      await tx.user.updateMany({
        where: { subscriptionId: subscription.id },
        data: { plan }
      })
    })

    return { success: true }
  } catch (error) {
    console.error('Error syncing subscription from Stripe:', error)
    throw error
  }
}