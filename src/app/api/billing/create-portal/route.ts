// app/api/billing/create-portal/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { stripe } from '@/lib/stripe'
import { prisma } from '@/lib/prisma'

export async function POST(req: NextRequest) {
  try {
    // 1. Environment check
    if (!process.env.STRIPE_SECRET_KEY) {
      console.error('❌ [BILLING PORTAL] STRIPE_SECRET_KEY is not configured')
      return NextResponse.json(
        { message: 'Billing service not configured' },
        { status: 500 }
      )
    }

    if (!process.env.NEXTAUTH_URL) {
      console.error('❌ [BILLING PORTAL] NEXTAUTH_URL is not configured')
      return NextResponse.json(
        { message: 'Base URL not configured' },
        { status: 500 }
      )
    }

    // 2. Session authentication
    const session = await getServerSession(authOptions)
    
    if (!session) {
      console.error('❌ [BILLING PORTAL] No session found')
      return NextResponse.json(
        { message: 'No session found' },
        { status: 401 }
      )
    }
    
    if (!session.user?.id) {
      console.error('❌ [BILLING PORTAL] No user ID in session')
      return NextResponse.json(
        { message: 'No user ID in session' },
        { status: 401 }
      )
    }

    console.log('✅ [BILLING PORTAL] Authenticated user:', session.user.id)

    // 3. Get businessId from request body
    const body = await req.json()
    const { businessId } = body

    if (!businessId) {
      return NextResponse.json(
        { message: 'Business ID is required' },
        { status: 400 }
      )
    }

    // 4. Database user lookup
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        id: true,
        email: true,
        stripeCustomerId: true,
        plan: true
      }
    })

    if (!user) {
      console.error('❌ [BILLING PORTAL] User not found in database:', session.user.id)
      return NextResponse.json(
        { message: 'User not found' },
        { status: 404 }
      )
    }

    console.log('✅ [BILLING PORTAL] User found:', user.email, 'Plan:', user.plan)

    // 5. Stripe customer handling
    let stripeCustomerId = user.stripeCustomerId

    if (!stripeCustomerId) {
      console.log('⚠️ [BILLING PORTAL] No Stripe customer ID found, creating new customer')
      
      try {
        const customer = await stripe.customers.create({
          email: user.email,
          metadata: {
            userId: user.id,
          },
        })

        stripeCustomerId = customer.id
        console.log('✅ [BILLING PORTAL] Created new Stripe customer:', stripeCustomerId)

        // Update user with Stripe customer ID
        await prisma.user.update({
          where: { id: user.id },
          data: { stripeCustomerId }
        })

        console.log('✅ [BILLING PORTAL] Updated user with Stripe customer ID')

      } catch (stripeError) {
        console.error('❌ [BILLING PORTAL] Error creating Stripe customer:', stripeError)
        return NextResponse.json(
          { 
            message: 'Failed to create Stripe customer',
            error: stripeError instanceof Error ? stripeError.message : 'Unknown error'
          },
          { status: 500 }
        )
      }
    } else {
      console.log('✅ [BILLING PORTAL] Using existing Stripe customer:', stripeCustomerId)
    }

    // 6. Return URL for this specific business
    const returnUrl = `${process.env.NEXTAUTH_URL}/admin/stores/${businessId}/settings/billing`

    console.log('🔗 [BILLING PORTAL] Return URL:', returnUrl)

    // 7. Portal session creation
    try {
      const portalSession = await stripe.billingPortal.sessions.create({
        customer: stripeCustomerId,
        return_url: returnUrl,
      })

      console.log('✅ [BILLING PORTAL] Portal session created:', portalSession.id)

      return NextResponse.json({ 
        portalUrl: portalSession.url 
      })

    } catch (stripePortalError) {
      console.error('❌ [BILLING PORTAL] Error creating portal session:', stripePortalError)
      return NextResponse.json(
        { 
          message: 'Failed to create billing portal session',
          error: stripePortalError instanceof Error ? stripePortalError.message : 'Unknown error'
        },
        { status: 500 }
      )
    }

  } catch (error) {
    console.error('❌ [BILLING PORTAL] Unexpected error:', error)
    return NextResponse.json(
      { 
        message: 'An unexpected error occurred',
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    )
  } finally {
  }
}