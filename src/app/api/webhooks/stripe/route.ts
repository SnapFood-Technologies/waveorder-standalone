// src/app/api/webhooks/stripe/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { headers } from 'next/headers'
import { stripe, mapStripePlanToDb, PLANS, PLAN_HIERARCHY, PlanId, cancelSubscriptionImmediately, isWaveOrderSubscription } from '@/lib/stripe'
import { sendSubscriptionChangeEmail, sendPaymentFailedEmail } from '@/lib/email'
import { logSystemEvent } from '@/lib/systemLog'
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

        case 'customer.subscription.trial_will_end':
          await handleTrialWillEnd(event.data.object as Stripe.Subscription)
          break

        case 'customer.subscription.paused':
          await handleSubscriptionPaused(event.data.object as Stripe.Subscription)
          break

        case 'customer.subscription.resumed':
          await handleSubscriptionResumed(event.data.object as Stripe.Subscription)
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
    
    const user = await prisma.user.findFirst({
      where: { stripeCustomerId: customerId },
      include: { subscription: true }
    })
    
    if (!user) {
      throw new Error(`User not found for Stripe customer: ${customerId}`)
    }

    // Skip if DB already has a Subscription record for this stripeId
    // (created by start-trial or upgrade-plan before webhook fired)
    const existingDbSub = await prisma.subscription.findUnique({
      where: { stripeId: sub.id }
    })
    if (existingDbSub) {
      // Ensure user is linked to it (in case of race condition)
      if (user.subscriptionId !== existingDbSub.id) {
        await prisma.user.update({
          where: { id: user.id },
          data: { subscriptionId: existingDbSub.id }
        })
      }
      console.log(`ℹ️ Subscription ${sub.id} already in DB, skipping duplicate creation`)
      return
    }

    const oldPlan = user.plan || 'STARTER'
    const wasOnTrial = !!(user as any).trialEndsAt
    const isTrialing = sub.status === 'trialing'
    const isReplacingExistingSub = !!user.subscription && user.subscription.stripeId !== sub.id
    const oldStripeSubId = isReplacingExistingSub ? user.subscription!.stripeId : null

    await prisma.$transaction(async (tx) => {
      // Create or update subscription record
      let subscription
      if (user.subscription) {
        subscription = await tx.subscription.update({
          where: { id: user.subscription.id },
          data: {
            stripeId: sub.id,
            status: sub.status,
            priceId: priceId,
            plan: plan as any,
            // @ts-ignore
            currentPeriodStart: new Date(sub.current_period_start * 1000),
            // @ts-ignore
            currentPeriodEnd: new Date(sub.current_period_end * 1000),
            cancelAtPeriodEnd: false,
            canceledAt: null
          }
        })
      } else {
        subscription = await tx.subscription.create({
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
      }

      // For trialing subs, preserve trial dates. For paid, clear them.
      const userUpdate: any = {
        subscriptionId: subscription.id,
        plan: plan as any,
      }
      if (!isTrialing) {
        userUpdate.trialEndsAt = null
        userUpdate.graceEndsAt = null
      }

      await tx.user.update({
        where: { id: user.id },
        data: userUpdate
      })

      const userBusinesses = await tx.businessUser.findMany({
        where: { userId: user.id },
        select: { businessId: true }
      })
      
      const businessUpdate: any = {
        subscriptionPlan: plan as any,
        subscriptionStatus: 'ACTIVE',
      }
      if (!isTrialing) {
        businessUpdate.trialEndsAt = null
        businessUpdate.graceEndsAt = null
      }

      for (const bu of userBusinesses) {
        await tx.business.update({
          where: { id: bu.businessId },
          data: businessUpdate
        })
      }
    })

    // When switching to a new plan (e.g. downgrade to Starter), cancel the old Stripe subscription so we don't have two active
    if (oldStripeSubId) {
      try {
        await cancelSubscriptionImmediately(oldStripeSubId)
        console.log(`✅ Canceled previous Stripe subscription ${oldStripeSubId} (replaced by ${sub.id})`)
      } catch (cancelErr) {
        console.error('❌ Failed to cancel previous Stripe subscription:', cancelErr)
        // Don't throw - DB is already updated; Stripe may still show old sub until manual cleanup
      }
    }

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
    } else if (newPlanLevel < oldPlanLevel) {
      try {
        const isAnnual = priceId === planData.annualPriceId
        await sendSubscriptionChangeEmail({
          to: user.email,
          name: user.name || 'there',
          changeType: 'downgraded',
          oldPlan: oldPlan as 'STARTER' | 'PRO' | 'BUSINESS',
          newPlan: plan as 'STARTER' | 'PRO' | 'BUSINESS',
          billingInterval: isAnnual ? 'annual' : 'monthly',
          // @ts-ignore
          nextBillingDate: new Date(sub.current_period_end * 1000)
        })
        console.log('✅ Sent downgrade email to:', user.email)
      } catch (emailError) {
        console.error('❌ Failed to send downgrade email:', emailError)
      }
    }

    // Log subscription created
    const changeType = wasOnTrial ? 'trial_converted' : 'created'
    logSystemEvent({
      logType: 'subscription_changed',
      severity: 'info',
      endpoint: '/api/webhooks/stripe',
      method: 'POST',
      statusCode: 200,
      url: '/api/webhooks/stripe',
      errorMessage: `Subscription ${changeType}: ${plan} for ${user.email}`,
      metadata: {
        userId: user.id,
        email: user.email,
        oldPlan,
        newPlan: plan,
        changeType,
        stripeSubscriptionId: sub.id,
        wasOnTrial
      }
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
    const customerId = sub.customer as string

    let subscription = await prisma.subscription.findUnique({
      where: { stripeId: sub.id },
      include: { users: true }
    })

    // If not found by stripeId, try to find user by customer ID and create the record
    if (!subscription) {
      const user = await prisma.user.findFirst({
        where: { stripeCustomerId: customerId },
        include: { subscription: true }
      })

      if (!user) {
        console.error(`❌ No user found for subscription update: ${sub.id} (customer: ${customerId})`)
        return
      }

      // Create the missing Subscription record
      if (user.subscription) {
        subscription = await prisma.subscription.update({
          where: { id: user.subscription.id },
          data: {
            stripeId: sub.id,
            status: sub.status,
            priceId,
            plan: plan as any,
            // @ts-ignore
            currentPeriodStart: new Date(sub.current_period_start * 1000),
            // @ts-ignore
            currentPeriodEnd: new Date(sub.current_period_end * 1000),
            cancelAtPeriodEnd: sub.cancel_at_period_end
          },
          include: { users: true }
        })
      } else {
        const newSub = await prisma.subscription.create({
          data: {
            stripeId: sub.id,
            status: sub.status,
            priceId,
            plan: plan as any,
            // @ts-ignore
            currentPeriodStart: new Date(sub.current_period_start * 1000),
            // @ts-ignore
            currentPeriodEnd: new Date(sub.current_period_end * 1000),
            cancelAtPeriodEnd: sub.cancel_at_period_end
          }
        })
        await prisma.user.update({
          where: { id: user.id },
          data: { subscriptionId: newSub.id }
        })
        subscription = { ...newSub, users: [user] } as any
      }

      console.log(`ℹ️ Created missing Subscription record for ${sub.id} (user: ${user.email})`)
    }

    if (!subscription) {
      console.error(`❌ Subscription record still null after creation attempt: ${sub.id}`)
      return
    }

    const oldPlan = subscription.plan
    const user = subscription.users[0]

    await prisma.$transaction(async (tx) => {
      await tx.subscription.update({
        where: { id: subscription!.id },
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

      await tx.user.updateMany({
        where: { subscriptionId: subscription!.id },
        data: { plan: plan as any }
      })

      const userIds = subscription!.users.map(u => u.id)
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
      const planData = PLANS[plan]
      const isAnnual = priceId === planData.annualPriceId
      const oldPlanLevel = PLAN_HIERARCHY[oldPlan as PlanId] || 1
      const newPlanLevel = PLAN_HIERARCHY[plan] || 1
      const changeType = newPlanLevel > oldPlanLevel ? 'upgraded' : 'downgraded'

      try {
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

      // Log subscription change event
      logSystemEvent({
        logType: 'subscription_changed',
        severity: 'info',
        endpoint: '/api/webhooks/stripe',
        method: 'POST',
        statusCode: 200,
        url: '/api/webhooks/stripe',
        errorMessage: `Subscription ${changeType}: ${oldPlan} → ${plan} for ${user.email}`,
        metadata: {
          userId: user.id,
          email: user.email,
          oldPlan,
          newPlan: plan,
          changeType,
          stripeSubscriptionId: sub.id,
          billingInterval: isAnnual ? 'annual' : 'monthly'
        }
      })
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

    // Log subscription cancellation
    if (user) {
      logSystemEvent({
        logType: 'subscription_changed',
        severity: 'warning',
        endpoint: '/api/webhooks/stripe',
        method: 'POST',
        statusCode: 200,
        url: '/api/webhooks/stripe',
        errorMessage: `Subscription cancelled: ${oldPlan} → STARTER for ${user.email}`,
        metadata: {
          userId: user.id,
          email: user.email,
          oldPlan,
          newPlan: 'STARTER',
          changeType: 'cancelled',
          stripeSubscriptionId: sub.id
        }
      })
    }

  } catch (error) {
    console.error('❌ Error handling subscription deleted:', error)
    throw error
  }
}

async function handlePaymentSucceeded(invoice: Stripe.Invoice) {
  try {
    const customerId = invoice.customer as string

    // Record the transaction in our DB
    await recordStripeTransaction(invoice, 'succeeded')

    // @ts-ignore
    if (invoice.subscription) {
      // @ts-ignore
      const sub = await stripe.subscriptions.retrieve(invoice.subscription as string)
      
      if (invoice.billing_reason === 'subscription_cycle') {
        const user = await prisma.user.findFirst({
          where: { stripeCustomerId: customerId }
        })

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

    // Record the failed transaction
    await recordStripeTransaction(invoice, 'failed')

    const user = await prisma.user.findFirst({
      where: { stripeCustomerId: customerId }
    })

    if (user) {
      try {
        const portalSession = await stripe.billingPortal.sessions.create({
          customer: customerId,
          return_url: `${process.env.NEXTAUTH_URL}/admin/stores`,
        })

        await sendPaymentFailedEmail({
          to: user.email,
          name: user.name || 'there',
          amount: invoice.amount_due / 100,
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

/**
 * Records a Stripe invoice event as a StripeTransaction in the DB.
 * Only records WaveOrder product subscriptions — skips invoices for other
 * products (e.g. lighthouseartscentre) that may share the same Stripe account.
 * Deduplicates by stripeId so the same event isn't recorded twice.
 */
async function recordStripeTransaction(invoice: Stripe.Invoice, status: string) {
  try {
    const customerId = invoice.customer as string
    const stripeId = invoice.id
    const amount = invoice.amount_paid || invoice.amount_due || 0
    const currency = invoice.currency || 'usd'

    // Resolve subscription ID — Stripe API structure varies (top-level or parent.subscription_details)
    const inv = invoice as any
    const subscriptionId =
      (typeof inv.subscription === 'string' ? inv.subscription : null) ||
      inv.parent?.subscription_details?.subscription ||
      null
    if (!subscriptionId) return null // No subscription = one-off invoice, skip

    let sub: Stripe.Subscription
    try {
      sub = await stripe.subscriptions.retrieve(subscriptionId)
      if (!isWaveOrderSubscription(sub)) return null // Skip non-WaveOrder product invoices
    } catch {
      return null // Subscription may not exist; skip to avoid recording unknown products
    }

    // Avoid duplicates
    const existing = await prisma.stripeTransaction.findUnique({
      where: { stripeId }
    })
    if (existing) return existing

    // Resolve user and business for linking
    const user = await prisma.user.findFirst({
      where: { stripeCustomerId: customerId },
      include: {
        businesses: {
          select: { businessId: true },
          take: 1
        }
      }
    })

    // Determine plan from subscription metadata or price
    let plan: string | null = (sub.metadata?.plan as string) || null
    let billingType: string | null = (sub.metadata?.billingType as string) || null
    if (!plan && sub.items.data[0]?.price?.id) {
      plan = mapStripePlanToDb(sub.items.data[0].price.id)
    }

    return await prisma.stripeTransaction.create({
      data: {
        stripeId,
        type: 'invoice',
        status,
        amount,
        currency,
        customerId,
        subscriptionId,
        customerEmail: (invoice as any).customer_email || user?.email || null,
        customerName: (invoice as any).customer_name || user?.name || null,
        description: invoice.billing_reason || 'Subscription payment',
        plan,
        billingType,
        businessId: user?.businesses?.[0]?.businessId || null,
        userId: user?.id || null,
        stripeCreatedAt: new Date(invoice.created * 1000),
      }
    })
  } catch (error) {
    console.error('❌ Error recording Stripe transaction:', error)
    // Don't throw — transaction recording is non-critical
  }
}

/**
 * Handle trial ending in 3 days - send reminder email
 */
async function handleTrialWillEnd(sub: Stripe.Subscription) {
  try {
    const customerId = sub.customer as string
    const user = await prisma.user.findFirst({
      where: { stripeCustomerId: customerId }
    })

    if (!user) {
      console.error(`❌ User not found for trial_will_end: ${customerId}`)
      return
    }

    // Calculate trial end date
    const trialEndDate = sub.trial_end ? new Date(sub.trial_end * 1000) : null

    // 📧 SEND TRIAL ENDING REMINDER EMAIL
    try {
      // Create portal session for adding payment method
      const portalSession = await stripe.billingPortal.sessions.create({
        customer: customerId,
        return_url: `${process.env.NEXTAUTH_URL}/admin/stores`,
      })

      await sendSubscriptionChangeEmail({
        to: user.email,
        name: user.name || 'there',
        changeType: 'trial_ending',
        oldPlan: 'PRO',
        newPlan: 'PRO',
        nextBillingDate: trialEndDate || undefined,
        updatePaymentUrl: portalSession.url
      })
      console.log('✅ Sent trial ending reminder email to:', user.email)
    } catch (emailError) {
      console.error('❌ Failed to send trial ending email:', emailError)
    }
  } catch (error) {
    console.error('❌ Error handling trial_will_end:', error)
    throw error
  }
}

/**
 * Handle subscription paused (trial ended without payment method)
 * Downgrade user to Starter limits but keep account active
 */
async function handleSubscriptionPaused(sub: Stripe.Subscription) {
  try {
    const customerId = sub.customer as string
    const priceId = sub.items.data[0]?.price?.id
    const user = await prisma.user.findFirst({
      where: { stripeCustomerId: customerId },
      include: {
        subscription: true,
        businesses: {
          include: { business: true }
        }
      }
    })

    if (!user) {
      console.error(`❌ User not found for subscription paused: ${customerId}`)
      return
    }

    const graceEndsAt = new Date()
    graceEndsAt.setDate(graceEndsAt.getDate() + 7)

    await prisma.$transaction(async (tx) => {
      // Update or create Subscription record to track the paused state
      if (user.subscription) {
        await tx.subscription.update({
          where: { id: user.subscription.id },
          data: {
            stripeId: sub.id,
            status: 'paused',
            ...(priceId ? { priceId } : {}),
            // @ts-ignore
            currentPeriodStart: new Date(sub.current_period_start * 1000),
            // @ts-ignore
            currentPeriodEnd: new Date(sub.current_period_end * 1000),
          }
        })
      } else {
        const existingDbSub = await tx.subscription.findUnique({
          where: { stripeId: sub.id }
        })
        if (existingDbSub) {
          await tx.subscription.update({
            where: { id: existingDbSub.id },
            data: { status: 'paused' }
          })
          await tx.user.update({
            where: { id: user.id },
            data: { subscriptionId: existingDbSub.id }
          })
        } else {
          const newSub = await tx.subscription.create({
            data: {
              stripeId: sub.id,
              status: 'paused',
              priceId: priceId || '',
              plan: 'PRO' as any,
              // @ts-ignore
              currentPeriodStart: new Date(sub.current_period_start * 1000),
              // @ts-ignore
              currentPeriodEnd: new Date(sub.current_period_end * 1000),
            }
          })
          await tx.user.update({
            where: { id: user.id },
            data: { subscriptionId: newSub.id }
          })
        }
      }

      await tx.user.update({
        where: { id: user.id },
        data: {
          plan: 'STARTER',
          graceEndsAt
        } as any
      })

      if (user.businesses) {
        for (const bu of user.businesses) {
          await tx.business.update({
            where: { id: bu.businessId },
            data: {
              subscriptionPlan: 'STARTER',
              subscriptionStatus: 'TRIAL_EXPIRED',
              graceEndsAt
            } as any
          })
        }
      }
    })

    try {
      const portalSession = await stripe.billingPortal.sessions.create({
        customer: customerId,
        return_url: `${process.env.NEXTAUTH_URL}/admin/stores`,
      })

      await sendSubscriptionChangeEmail({
        to: user.email,
        name: user.name || 'there',
        changeType: 'trial_expired',
        oldPlan: 'PRO',
        newPlan: 'STARTER',
        nextBillingDate: graceEndsAt,
        updatePaymentUrl: portalSession.url
      })
      console.log('✅ Sent trial expired email to:', user.email)
    } catch (emailError) {
      console.error('❌ Failed to send trial expired email:', emailError)
    }

    console.log(`✅ User ${user.email} downgraded to Starter after trial expired`)
  } catch (error) {
    console.error('❌ Error handling subscription paused:', error)
    throw error
  }
}

/**
 * Handle subscription resumed (user added payment method after pause).
 * Restore their plan and clear grace period.
 */
async function handleSubscriptionResumed(sub: Stripe.Subscription) {
  try {
    const customerId = sub.customer as string
    const priceId = sub.items.data[0]?.price?.id
    const plan = priceId ? mapStripePlanToDb(priceId) : 'PRO'

    const user = await prisma.user.findFirst({
      where: { stripeCustomerId: customerId },
      include: {
        subscription: true,
        businesses: {
          include: { business: true }
        }
      }
    })

    if (!user) {
      console.error(`❌ User not found for subscription resumed: ${customerId}`)
      return
    }

    await prisma.$transaction(async (tx) => {
      // Update or create Subscription record
      if (user.subscription) {
        await tx.subscription.update({
          where: { id: user.subscription.id },
          data: {
            stripeId: sub.id,
            status: sub.status,
            ...(priceId ? { priceId } : {}),
            plan: plan as any,
            // @ts-ignore
            currentPeriodStart: new Date(sub.current_period_start * 1000),
            // @ts-ignore
            currentPeriodEnd: new Date(sub.current_period_end * 1000),
            cancelAtPeriodEnd: false,
            canceledAt: null
          }
        })
      } else {
        const newSub = await tx.subscription.create({
          data: {
            stripeId: sub.id,
            status: sub.status,
            priceId: priceId || '',
            plan: plan as any,
            // @ts-ignore
            currentPeriodStart: new Date(sub.current_period_start * 1000),
            // @ts-ignore
            currentPeriodEnd: new Date(sub.current_period_end * 1000),
          }
        })
        await tx.user.update({
          where: { id: user.id },
          data: { subscriptionId: newSub.id }
        })
      }

      // Restore plan and clear trial/grace dates
      await tx.user.update({
        where: { id: user.id },
        data: {
          plan: plan as any,
          trialEndsAt: null,
          graceEndsAt: null
        } as any
      })

      if (user.businesses) {
        for (const bu of user.businesses) {
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
      }
    })

    // Send reactivation email
    if (user.email) {
      try {
        const planData = PLANS[plan]
        const isAnnual = priceId === planData?.annualPriceId
        await sendSubscriptionChangeEmail({
          to: user.email,
          name: user.name || 'there',
          changeType: 'upgraded',
          oldPlan: 'STARTER',
          newPlan: plan as 'STARTER' | 'PRO' | 'BUSINESS',
          billingInterval: isAnnual ? 'annual' : 'monthly',
          amount: isAnnual ? planData?.annualPrice : planData?.price,
          // @ts-ignore
          nextBillingDate: new Date(sub.current_period_end * 1000)
        })
        console.log('✅ Sent subscription resumed email to:', user.email)
      } catch (emailError) {
        console.error('❌ Failed to send resumed email:', emailError)
      }
    }

    logSystemEvent({
      logType: 'subscription_changed',
      severity: 'info',
      endpoint: '/api/webhooks/stripe',
      method: 'POST',
      statusCode: 200,
      url: '/api/webhooks/stripe',
      errorMessage: `Subscription resumed: ${plan} for ${user.email}`,
      metadata: {
        userId: user.id,
        email: user.email,
        plan,
        changeType: 'resumed',
        stripeSubscriptionId: sub.id
      }
    })

    console.log(`✅ User ${user.email} subscription resumed to ${plan}`)
  } catch (error) {
    console.error('❌ Error handling subscription resumed:', error)
    throw error
  }
}