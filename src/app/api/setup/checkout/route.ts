// app/api/setup/checkout/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { stripe, PLANS } from '@/lib/stripe'
import { createStripeCustomer } from '@/lib/stripe'
import { prisma } from '@/lib/prisma'

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.email) {
      return NextResponse.json(
        { message: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { planId, isAnnual = false } = await req.json()
    
    if (!['STARTER', 'PRO', 'BUSINESS'].includes(planId)) {
      return NextResponse.json(
        { message: 'Invalid plan selected' },
        { status: 400 }
      )
    }

    // Get or create user with Stripe customer
    const user = await prisma.user.findUnique({
      where: { email: session.user.email }
    })

    if (!user) {
      return NextResponse.json(
        { message: 'User not found' },
        { status: 404 }
      )
    }

    let stripeCustomerId = user.stripeCustomerId

    // Create Stripe customer if doesn't exist
    if (!stripeCustomerId) {
      const stripeCustomer = await createStripeCustomer(
        user.email,
        user.name || 'User'
      )
      stripeCustomerId = stripeCustomer.id

      // Update user with Stripe customer ID
      await prisma.user.update({
        where: { id: user.id },
        data: { stripeCustomerId }
      })
    }

    // @ts-ignore
    const plan = PLANS[planId]
    const priceId = isAnnual ? plan.annualPriceId : plan.priceId

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
        setupFlow: 'true' // Flag to indicate this is from setup
      },
      subscription_data: {
        metadata: {
          userId: user.id,
          planId: planId,
          source: 'waveorder_setup'
        }
      },
      success_url: `${process.env.NEXTAUTH_URL}/setup?checkout=success&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.NEXTAUTH_URL}/setup?checkout=cancelled`,
    })

    return NextResponse.json({ 
      checkoutUrl: checkoutSession.url,
      sessionId: checkoutSession.id 
    })

  } catch (error) {
    console.error('Error creating setup checkout session:', error)
    return NextResponse.json(
      { message: 'Failed to create checkout session' },
      { status: 500 }
    )
  }
}