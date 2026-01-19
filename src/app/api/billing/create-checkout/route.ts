// app/api/billing/create-checkout/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { stripe, PLANS, type PlanId, createStripeCustomer, createFreeSubscription } from '@/lib/stripe'
import { prisma } from '@/lib/prisma'

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { message: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { planId, isAnnual = false, businessId } = await req.json()
    
    // businessId is REQUIRED
    if (!businessId) {
      return NextResponse.json(
        { message: 'Business ID is required' },
        { status: 400 }
      )
    }

    // Validate plan - only PRO is allowed for upgrades
    if (!planId || planId !== 'PRO') {
      return NextResponse.json(
        { message: 'Invalid plan selected. Only PRO plan upgrades are available.' },
        { status: 400 }
      )
    }

    // Get user with Stripe customer
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: { subscription: true }
    })

    if (!user) {
      return NextResponse.json(
        { message: 'User not found' },
        { status: 404 }
      )
    }

    // **FIX: Handle old users without Stripe customer**
    let stripeCustomerId = user.stripeCustomerId

    if (!stripeCustomerId) {
      
      try {
        // Create Stripe customer
        const stripeCustomer = await createStripeCustomer(user.email, user.name || 'User')
        stripeCustomerId = stripeCustomer.id
        
        // Create STARTER subscription in Stripe
        const stripeSubscription = await createFreeSubscription(stripeCustomerId)
        
        // Create subscription in database
        const subscription = await prisma.subscription.create({
          data: {
            stripeId: stripeSubscription.id,
            status: stripeSubscription.status,
            priceId: PLANS.STARTER.priceId,
            plan: 'STARTER',
            // @ts-ignore
            currentPeriodStart: new Date(stripeSubscription.current_period_start * 1000),
            // @ts-ignore
            currentPeriodEnd: new Date(stripeSubscription.current_period_end * 1000),
          }
        })
        
        // Update user with Stripe customer ID and subscription
        await prisma.user.update({
          where: { id: user.id },
          data: {
            stripeCustomerId: stripeCustomerId,
            subscriptionId: subscription.id,
            plan: 'STARTER'
          }
        })
        
      } catch (stripeError) {
        console.error('❌ [CHECKOUT] Failed to create Stripe customer:', stripeError)
        return NextResponse.json(
          { message: 'Failed to initialize billing. Please try again or contact support.' },
          { status: 500 }
        )
      }
    }

    // Check if already on PRO
    if (user.plan === 'PRO') {
      return NextResponse.json(
        { message: 'You are already on the PRO plan' },
        { status: 400 }
      )
    }

    const plan = PLANS[planId as PlanId]
    const priceId = isAnnual ? plan.annualPriceId : plan.priceId

    // URLs for this specific business
    const successUrl = `${process.env.NEXTAUTH_URL}/admin/stores/${businessId}/settings/billing?success=true&session_id={CHECKOUT_SESSION_ID}`
    const cancelUrl = `${process.env.NEXTAUTH_URL}/admin/stores/${businessId}/settings/billing?canceled=true`

    // Create Stripe checkout session
    const checkoutSession = await stripe.checkout.sessions.create({
      customer: stripeCustomerId,
      payment_method_types: ['card'],
      billing_address_collection: 'required',
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      mode: 'subscription',
      metadata: {
        userId: user.id,
        planId: planId,
        isAnnual: isAnnual.toString(),
        businessId: businessId,
      },
      subscription_data: {
        metadata: {
          userId: user.id,
          planId: planId,
          businessId: businessId,
          source: 'waveorder_billing'
        }
      },
      success_url: successUrl,
      cancel_url: cancelUrl,
    })

    return NextResponse.json({ 
      checkoutUrl: checkoutSession.url,
      sessionId: checkoutSession.id 
    })

  } catch (error) {
    console.error('❌ Error creating checkout session:', error)
    return NextResponse.json(
      { 
        message: 'Failed to create checkout session',
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  } finally {
    await prisma.$disconnect()
  }
}