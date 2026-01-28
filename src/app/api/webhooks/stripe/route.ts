// src/app/api/webhooks/stripe/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { headers } from 'next/headers'
import { stripe, mapStripePlanToDb, PLANS, PLAN_HIERARCHY, PlanId } from '@/lib/stripe'
import { sendSubscriptionChangeEmail, sendPaymentFailedEmail } from '@/lib/email'
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
          console.log(`ℹ️ Unhandled event type: ${event.type}`)
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
    throw error  }
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

    const oldPlan = user.plan || 'STARTER'
    const wasOnTrial = !!(user as any).trialEndsAt

    await prisma.$transaction(async (tx) => {
      // Create subscription record
      const subscription = await tx.subscription.create({
        data: {
          stripeId: sub.id,
          status: sub.status,
          priceId: priceId,
          plan: plan as any,
          // @ts-ignore
          currentPeriodStart: new Date(sub.current_period_start * 1000),
          // @ts-ignore
          currentPeriodEnd: new Date(sub.current_period_end * 1000),
        }
      })

      // Update user with subscription and clear trial dates (converting to paid)
      await tx.user.update({
        where: { id: user.id },
        data: {
          subscriptionId: subscription.id,
          plan: plan as any,
          // Clear trial dates since user is now paying
          trialEndsAt: null,
          graceEndsAt: null
        } as any
      })

      // Sync all user's businesses with the new plan and clear trial dates
      const userBusinesses = await tx.businessUser.findMany({
        where: { userId: user.id },
        select: { businessId: true }
      })
      
      for (const bu of userBusinesses) {
        await tx.business.update({
          where: { id: bu.businessId },
          data: {
            subscriptionPlan: plan as any,
            subscriptionStatus: 'ACTIVE',
            trialEndsAt: null,
            graceEndsAt: null
          } as any
        })
      }
    })

    // 📧 SEND EMAIL
    const planData = PLANS[plan]
    const oldPlanLevel = PLAN_HIERARCHY[oldPlan as PlanId] || 1
    const newPlanLevel = PLAN_HIERARCHY[plan] || 1
    
    if (newPlanLevel > oldPlanLevel || wasOnTrial) {
      try {
        const isAnnual = priceId === planData.annualPriceId
        await sendSubscriptionChangeEmail({
          to: user.email,
          name: user.name || 'there',
          changeType: wasOnTrial ? 'trial_converted' : 'upgraded',
          oldPlan: oldPlan as 'STARTER' | 'PRO' | 'BUSINESS',
          newPlan: plan as 'STARTER' | 'PRO' | 'BUSINESS',
          billingInterval: isAnnual ? 'annual' : 'monthly',
          amount: isAnnual ? planData.annualPrice : planData.price,
          // @ts-ignore
          nextBillingDate: new Date(sub.current_period_end * 1000)
        })
        console.log('✅ Sent upgrade/conversion email to:', user.email)
      } catch (emailError) {
        console.error('❌ Failed to send upgrade email:', emailError)
        // Don't fail the webhook if email fails
      }
    }

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

    const oldPlan = subscription.plan
    const user = subscription.users[0] // Get first user for email

    await prisma.$transaction(async (tx) => {
      // Update subscription
      await tx.subscription.update({
        where: { id: subscription.id },
        data: {
          status: sub.status,
          priceId: priceId,
          plan: plan as any,
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
        data: { plan: plan as any }
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
          subscriptionPlan: plan as any,
          subscriptionStatus: sub.status === 'active' ? 'ACTIVE' : 'INACTIVE'
        }
      })
    })

    // 📧 SEND EMAIL IF PLAN CHANGED
    if (user && oldPlan !== plan) {
      try {
        const planData = PLANS[plan]
        const isAnnual = priceId === planData.annualPriceId
        const oldPlanLevel = PLAN_HIERARCHY[oldPlan as PlanId] || 1
        const newPlanLevel = PLAN_HIERARCHY[plan] || 1
        const changeType = newPlanLevel > oldPlanLevel ? 'upgraded' : 'downgraded'
        
        await sendSubscriptionChangeEmail({
          to: user.email,
          name: user.name || 'there',
          changeType: changeType,
          oldPlan: oldPlan as 'STARTER' | 'PRO' | 'BUSINESS',
          newPlan: plan as 'STARTER' | 'PRO' | 'BUSINESS',
          billingInterval: isAnnual ? 'annual' : 'monthly',
          amount: changeType === 'upgraded' ? (isAnnual ? planData.annualPrice : planData.price) : undefined,
          // @ts-ignore
          nextBillingDate: new Date(sub.current_period_end * 1000)
        })
        console.log(`✅ Sent ${changeType} email to:`, user.email)
      } catch (emailError) {
        console.error('❌ Failed to send subscription update email:', emailError)
      }
    }

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

    const oldPlan = subscription.plan
    const user = subscription.users[0] // Get first user for email

    await prisma.$transaction(async (tx) => {
      // Update subscription status
      await tx.subscription.update({
        where: { id: subscription.id },
        data: {
          status: 'canceled',
          canceledAt: new Date()
        }
      })

      // Downgrade all users to Starter plan
      await tx.user.updateMany({
        where: { subscriptionId: subscription.id },
        data: { plan: 'STARTER' }
      })

      // Sync all businesses to Starter plan
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
          subscriptionPlan: 'STARTER',
          subscriptionStatus: 'CANCELLED'
        }
      })
    })

    // 📧 SEND CANCELLATION EMAIL
    if (user && oldPlan === 'PRO') {
      try {
        await sendSubscriptionChangeEmail({
          to: user.email,
          name: user.name || 'there',
          changeType: 'canceled',
          oldPlan: 'PRO',
          newPlan: 'STARTER',
          // @ts-ignore
          nextBillingDate: new Date(sub.current_period_end * 1000)
        })
        console.log('✅ Sent cancellation email to:', user.email)
      } catch (emailError) {
        console.error('❌ Failed to send cancellation email:', emailError)
      }
    }

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
      
      // Check if this is a renewal (not first payment)
      if (invoice.billing_reason === 'subscription_cycle') {
        const customerId = sub.customer as string
        const user = await prisma.user.findFirst({
          where: { stripeCustomerId: customerId }
        })

        // 📧 SEND RENEWAL EMAIL for any paid plan
        if (user && user.plan && PLAN_HIERARCHY[user.plan as PlanId] > 0) {
          try {
            const priceId = sub.items.data[0].price.id
            const plan = mapStripePlanToDb(priceId)
            const planData = PLANS[plan]
            const isAnnual = priceId === planData.annualPriceId
            
            await sendSubscriptionChangeEmail({
              to: user.email,
              name: user.name || 'there',
              changeType: 'renewed',
              oldPlan: plan as 'STARTER' | 'PRO' | 'BUSINESS',
              newPlan: plan as 'STARTER' | 'PRO' | 'BUSINESS',
              billingInterval: isAnnual ? 'annual' : 'monthly',
              amount: isAnnual ? planData.annualPrice : planData.price,
              // @ts-ignore
              nextBillingDate: new Date(sub.current_period_end * 1000)
            })
            console.log('✅ Sent renewal email to:', user.email)
          } catch (emailError) {
            console.error('❌ Failed to send renewal email:', emailError)
          }
        }
      }
      
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

    // 📧 SEND PAYMENT FAILED EMAIL
    if (user) {
      try {
        // Create portal session for updating payment method
        const portalSession = await stripe.billingPortal.sessions.create({
          customer: customerId,
          return_url: `${process.env.NEXTAUTH_URL}/admin/stores`,
        })

        await sendPaymentFailedEmail({
          to: user.email,
          name: user.name || 'there',
          amount: invoice.amount_due / 100, // Convert cents to dollars
          nextRetryDate: invoice.next_payment_attempt 
            ? new Date(invoice.next_payment_attempt * 1000) 
            : undefined,
          updatePaymentUrl: portalSession.url
        })
        console.log('✅ Sent payment failed email to:', user.email)
      } catch (emailError) {
        console.error('❌ Failed to send payment failed email:', emailError)
      }
    }
  } catch (error) {
    console.error('❌ Error handling payment failed:', error)
    throw error
  }
}