// src/app/api/webhooks/stripe/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { headers } from 'next/headers'
import { stripe, mapStripePlanToDb } from '@/lib/stripe'
import { prisma } from '@/lib/prisma'
import Stripe from 'stripe'

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!

export async function POST(req: NextRequest) {
  try {
    const body = await req.text()
    // @ts-ignore
    const signature = headers().get('stripe-signature')!

    let event: Stripe.Event

    try {
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret)
    } catch (err) {
      console.error('❌ Webhook signature verification failed:', err)
      return NextResponse.json(
        { message: 'Webhook signature verification failed' },
        { status: 400 }
      )
    }

    // Log webhook event
    const webhookLog = await prisma.webhookLog.create({
      data: {
        eventType: event.type,
        stripeId: (event.data.object as any).id,
        data: event.data.object as any,
        processed: false
      }
    })

    try {
      switch (event.type) {
        case 'checkout.session.completed':
          await handleCheckoutSessionCompleted(event.data.object as Stripe.Checkout.Session)
          break

        case 'customer.subscription.created':
          await handleSubscriptionCreated(event.data.object as Stripe.Subscription)
          break

        case 'customer.subscription.updated':
          await handleSubscriptionUpdated(event.data.object as Stripe.Subscription)
          break

        case 'customer.subscription.deleted':
          await handleSubscriptionDeleted(event.data.object as Stripe.Subscription)
          break

        case 'invoice.payment_succeeded':
          await handlePaymentSucceeded(event.data.object as Stripe.Invoice)
          break

        case 'invoice.payment_failed':
          await handlePaymentFailed(event.data.object as Stripe.Invoice)
          break

        default:
       
      }

      // Mark as processed
      await prisma.webhookLog.update({
        where: { id: webhookLog.id },
        data: { processed: true }
      })

    } catch (error) {
      // Log error
      await prisma.webhookLog.update({
        where: { id: webhookLog.id },
        data: { 
          error: error instanceof Error ? error.message : 'Unknown error',
          processed: false 
        }
      })
      throw error
    }

    return NextResponse.json({ received: true })

  } catch (error) {
    console.error('❌ Webhook error:', error)
    return NextResponse.json(
      { message: 'Webhook handler failed' },
      { status: 500 }
    )
  } finally {
    await prisma.$disconnect()
  }
}

async function handleCheckoutSessionCompleted(session: Stripe.Checkout.Session) {
  try {
    if (session.mode === 'subscription' && session.subscription) {
      const sub = await stripe.subscriptions.retrieve(session.subscription as string)
      await handleSubscriptionCreated(sub)
    }
  } catch (error) {
    console.error('❌ Error handling checkout session completed:', error)
    throw error
  }
}

async function handleSubscriptionCreated(sub: Stripe.Subscription) {
  try {
    const customerId = sub.customer as string
    const priceId = sub.items.data[0].price.id
    const plan = mapStripePlanToDb(priceId)
    
    // Find user by Stripe customer ID
    const user = await prisma.user.findFirst({
      where: { stripeCustomerId: customerId },
      include: { subscription: true }
    })
    
    if (!user) {
      throw new Error(`User not found for Stripe customer: ${customerId}`)
    }

    await prisma.$transaction(async (tx) => {
      // Create subscription record
      const subscription = await tx.subscription.create({
        data: {
          stripeId: sub.id,
          status: sub.status,
          priceId: priceId,
          plan: plan,
          // @ts-ignore
          currentPeriodStart: new Date(sub.current_period_start * 1000),
            // @ts-ignore
          currentPeriodEnd: new Date(sub.current_period_end * 1000),
        }
      })

      // Update user with subscription
      await tx.user.update({
        where: { id: user.id },
        data: {
          subscriptionId: subscription.id,
          plan: plan
        }
      })

      // Sync all user's businesses with the new plan
      await tx.business.updateMany({
        where: {
          users: {
            some: {
              userId: user.id
            }
          }
        },
        data: {
          subscriptionPlan: plan,
          subscriptionStatus: 'ACTIVE'
        }
      })
    })


  } catch (error) {
    console.error('❌ Error handling subscription created:', error)
    throw error
  }
}

async function handleSubscriptionUpdated(sub: Stripe.Subscription) {
  try {
    const priceId = sub.items.data[0].price.id
    const plan = mapStripePlanToDb(priceId)

    const subscription = await prisma.subscription.findUnique({
      where: { stripeId: sub.id },
      include: { users: true }
    })

    if (!subscription) {
      console.error(`❌ Subscription not found in database: ${sub.id}`)
      return
    }

    await prisma.$transaction(async (tx) => {
      // Update subscription
      await tx.subscription.update({
        where: { id: subscription.id },
        data: {
          status: sub.status,
          priceId: priceId,
          plan: plan,
          // @ts-ignore
          currentPeriodStart: new Date(sub.current_period_start * 1000),
          // @ts-ignore
          currentPeriodEnd: new Date(sub.current_period_end * 1000),
          cancelAtPeriodEnd: sub.cancel_at_period_end
        }
      })

      // Update all users on this subscription
      await tx.user.updateMany({
        where: { subscriptionId: subscription.id },
        data: { plan: plan }
      })

      // Sync all businesses owned by these users
      const userIds = subscription.users.map(u => u.id)
      await tx.business.updateMany({
        where: {
          users: {
            some: {
              userId: { in: userIds }
            }
          }
        },
        data: {
          subscriptionPlan: plan,
          subscriptionStatus: sub.status === 'active' ? 'ACTIVE' : 'INACTIVE'
        }
      })
    })

  } catch (error) {
    console.error('❌ Error handling subscription updated:', error)
    throw error
  }
}

async function handleSubscriptionDeleted(sub: Stripe.Subscription) {
  try {
    const subscription = await prisma.subscription.findUnique({
      where: { stripeId: sub.id },
      include: { users: true }
    })

    if (!subscription) {
      console.error(`❌ Subscription not found in database: ${sub.id}`)
      return
    }


    await prisma.$transaction(async (tx) => {
      // Update subscription status
      await tx.subscription.update({
        where: { id: subscription.id },
        data: {
          status: 'canceled',
          canceledAt: new Date()
        }
      })

      // Downgrade all users to FREE plan
      await tx.user.updateMany({
        where: { subscriptionId: subscription.id },
        data: { plan: 'FREE' }
      })

      // Sync all businesses to FREE plan
      const userIds = subscription.users.map(u => u.id)
      await tx.business.updateMany({
        where: {
          users: {
            some: {
              userId: { in: userIds }
            }
          }
        },
        data: {
          subscriptionPlan: 'FREE',
          subscriptionStatus: 'CANCELLED'
        }
      })
    })

  } catch (error) {
    console.error('❌ Error handling subscription deleted:', error)
    throw error
  }
}

async function handlePaymentSucceeded(invoice: Stripe.Invoice) {
  try {
    // @ts-ignore
    if (invoice.subscription) {
        // @ts-ignore
      const sub = await stripe.subscriptions.retrieve(invoice.subscription as string)
      await handleSubscriptionUpdated(sub)
    }
  } catch (error) {
    console.error('❌ Error handling payment succeeded:', error)
    throw error
  }
}

async function handlePaymentFailed(invoice: Stripe.Invoice) {
  try {
    const customerId = invoice.customer as string
    const user = await prisma.user.findFirst({
      where: { stripeCustomerId: customerId }
    })

    if (user) {
      // TODO: Send payment failed email notification
    }
  } catch (error) {
    console.error('❌ Error handling payment failed:', error)
    throw error
  }
}