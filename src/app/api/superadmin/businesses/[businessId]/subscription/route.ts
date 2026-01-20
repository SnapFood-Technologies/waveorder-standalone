// app/api/superadmin/businesses/[businessId]/subscription/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { PrismaClient } from '@prisma/client'
import { authOptions } from '@/lib/auth'
import Stripe from 'stripe'
import { 
  createSubscriptionByPlan, 
  getPriceId, 
  updateSubscription, 
  cancelSubscription,
  cancelSubscriptionImmediately,
  createPaidSubscription
} from '@/lib/stripe'

const prisma = new PrismaClient()

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ businessId: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || session.user.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
    }

    const { businessId } = await params
    const body = await request.json()
    const { subscriptionPlan, billingType } = body

    if (!businessId) {
      return NextResponse.json({ message: 'Business ID is required' }, { status: 400 })
    }

    if (!subscriptionPlan || !['STARTER', 'PRO'].includes(subscriptionPlan)) {
      return NextResponse.json({ 
        message: 'Valid subscription plan (STARTER or PRO) is required' 
      }, { status: 400 })
    }

    if (!billingType || !['monthly', 'yearly', 'free'].includes(billingType)) {
      return NextResponse.json({ 
        message: 'Valid billing type (monthly, yearly, or free) is required' 
      }, { status: 400 })
    }

    // Find business with owner user and subscription
    const business = await prisma.business.findUnique({
      where: { id: businessId },
      include: {
        users: {
          where: { role: 'OWNER' },
          include: {
            user: {
              include: {
                subscription: true
              }
            }
          }
        }
      }
    })

    if (!business) {
      return NextResponse.json({ message: 'Business not found' }, { status: 404 })
    }

    const ownerRelation = business.users.find(u => u.role === 'OWNER')
    if (!ownerRelation || !ownerRelation.user) {
      return NextResponse.json({ 
        message: 'Business owner not found' 
      }, { status: 404 })
    }

    const owner = ownerRelation.user
    const currentPlan = business.subscriptionPlan as 'STARTER' | 'PRO'

    // Handle Stripe subscription update
    let stripeSubscription: Stripe.Subscription | null = null
    let newPriceId: string
    
    try {
      // Validate price ID exists
      try {
        newPriceId = getPriceId(subscriptionPlan as 'STARTER' | 'PRO', billingType)
        console.log(`Price ID for ${subscriptionPlan} (${billingType}): ${newPriceId ? 'FOUND' : 'MISSING'}`)
      } catch (priceError: any) {
        console.error('Error getting price ID:', priceError)
        return NextResponse.json({ 
          message: `Price ID not configured for ${subscriptionPlan} plan (${billingType}). Please check environment variables.`,
          error: process.env.NODE_ENV === 'development' ? priceError?.message : undefined
        }, { status: 400 })
      }
      
      if (!newPriceId || newPriceId.trim() === '' || newPriceId.includes('undefined')) {
        const envVarName = billingType === 'free' 
          ? `STRIPE_${subscriptionPlan}_FREE_PRICE_ID`
          : billingType === 'yearly'
          ? `STRIPE_${subscriptionPlan}_ANNUAL_PRICE_ID`
          : `STRIPE_${subscriptionPlan}_PRICE_ID`
        
        console.error(`Missing environment variable: ${envVarName}`)
        return NextResponse.json({ 
          message: `Price ID not configured for ${subscriptionPlan} plan (${billingType}). Missing environment variable: ${envVarName}`,
          error: `Environment variable ${envVarName} is not set`
        }, { status: 400 })
      }

      if (!owner.stripeCustomerId || owner.stripeCustomerId.trim() === '') {
        return NextResponse.json({ 
          message: 'Business owner does not have a Stripe customer ID. Cannot update subscription.' 
        }, { status: 400 })
      }

      if (!owner.subscription || !owner.subscription.stripeId) {
        // No existing subscription - create new one
        console.log(`Creating new subscription for business ${businessId}: ${subscriptionPlan} (${billingType})`)
        stripeSubscription = await createSubscriptionByPlan(
          owner.stripeCustomerId,
          subscriptionPlan as 'STARTER' | 'PRO',
          billingType
        )
        console.log('✅ New subscription created:', stripeSubscription.id)
      } else {
        // Existing subscription - update it
        const existingSubscription = owner.subscription
        console.log(`Updating subscription for business ${businessId}: ${existingSubscription.stripeId}`)
        
        // Cancel old subscription immediately (we're replacing it)
        try {
          await cancelSubscriptionImmediately(existingSubscription.stripeId)
          console.log('✅ Old subscription canceled:', existingSubscription.stripeId)
        } catch (error: any) {
          console.error('Error canceling old subscription:', error)
          // If subscription doesn't exist in Stripe, continue anyway
          if (error?.code !== 'resource_missing') {
            throw new Error(`Failed to cancel existing subscription: ${error?.message || 'Unknown error'}`)
          }
          console.log('⚠️ Subscription not found in Stripe, continuing...')
        }

        // Create new subscription with new plan/billing type
        stripeSubscription = await createSubscriptionByPlan(
          owner.stripeCustomerId,
          subscriptionPlan as 'STARTER' | 'PRO',
          billingType
        )
        console.log('✅ New subscription created:', stripeSubscription.id)
      }

      if (!stripeSubscription) {
        throw new Error('Failed to create Stripe subscription')
      }

      // TypeScript type guard - stripeSubscription is guaranteed to be non-null here
      const subscriptionData = stripeSubscription

      // Update database in transaction
      console.log('Updating database records...')
      const result = await prisma.$transaction(async (tx) => {
        // Update or create subscription record
        let subscription
        if (owner.subscription) {
          subscription = await tx.subscription.update({
            where: { id: owner.subscription.id },
            data: {
              stripeId: subscriptionData.id,
              status: subscriptionData.status,
              priceId: newPriceId,
              plan: subscriptionPlan as any,
              // @ts-ignore
              currentPeriodStart: new Date(subscriptionData.current_period_start * 1000),
              // @ts-ignore
              currentPeriodEnd: new Date(subscriptionData.current_period_end * 1000),
              cancelAtPeriodEnd: false,
              canceledAt: null
            }
          })
        } else {
          subscription = await tx.subscription.create({
            data: {
              stripeId: subscriptionData.id,
              status: subscriptionData.status,
              priceId: newPriceId,
              plan: subscriptionPlan as any,
              // @ts-ignore
              currentPeriodStart: new Date(subscriptionData.current_period_start * 1000),
              // @ts-ignore
              currentPeriodEnd: new Date(subscriptionData.current_period_end * 1000),
            }
          })
        }

        // Update owner user plan
        const updatedUser = await tx.user.update({
          where: { id: owner.id },
          data: {
            plan: subscriptionPlan as any,
            subscriptionId: subscription.id
          }
        })

        // Update business subscription plan
        const updatedBusiness = await tx.business.update({
          where: { id: businessId },
          data: {
            subscriptionPlan: subscriptionPlan as any,
            subscriptionStatus: subscriptionData.status === 'active' ? 'ACTIVE' : 'INACTIVE'
          }
        })

        return { user: updatedUser, business: updatedBusiness, subscription }
      })

      console.log('✅ Database updated successfully')

      return NextResponse.json({
        success: true,
        message: `Business subscription updated to ${subscriptionPlan} (${billingType}) successfully`,
        business: {
          id: result.business.id,
          name: result.business.name,
          subscriptionPlan: result.business.subscriptionPlan,
          subscriptionStatus: result.business.subscriptionStatus
        }
      })

    } catch (stripeError: any) {
      console.error('❌ Stripe error updating subscription:', stripeError)
      return NextResponse.json({
        message: `Failed to update Stripe subscription: ${stripeError.message || 'Unknown error'}`,
        error: stripeError.message
      }, { status: 500 })
    }

  } catch (error: any) {
    console.error('Error updating business subscription:', error)
    console.error('Error details:', {
      message: error?.message,
      stack: error?.stack,
      name: error?.name,
      code: error?.code
    })
    return NextResponse.json(
      { 
        message: 'Internal server error',
        error: process.env.NODE_ENV === 'development' ? error?.message : undefined
      },
      { status: 500 }
    )
  } finally {
    await prisma.$disconnect()
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ businessId: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || session.user.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
    }

    const { businessId } = await params

    if (!businessId) {
      return NextResponse.json({ message: 'Business ID is required' }, { status: 400 })
    }

    // Get business subscription info
    const business = await prisma.business.findUnique({
      where: { id: businessId },
      select: {
        id: true,
        name: true,
        subscriptionPlan: true,
        subscriptionStatus: true,
        users: {
          where: { role: 'OWNER' },
          include: {
            user: {
              select: {
                id: true,
                email: true,
                plan: true,
                subscription: {
                  select: {
                    id: true,
                    stripeId: true,
                    status: true,
                    priceId: true,
                    plan: true
                  }
                }
              }
            }
          }
        }
      }
    })

    if (!business) {
      return NextResponse.json({ message: 'Business not found' }, { status: 404 })
    }

    const ownerRelation = business.users.find(u => u.role === 'OWNER')
    const owner = ownerRelation?.user

    return NextResponse.json({
      business: {
        id: business.id,
        name: business.name,
        subscriptionPlan: business.subscriptionPlan,
        subscriptionStatus: business.subscriptionStatus,
        owner: owner ? {
          email: owner.email,
          plan: owner.plan,
          subscription: owner.subscription
        } : null
      }
    })

  } catch (error: any) {
    console.error('Error fetching business subscription:', error)
    console.error('Error details:', {
      message: error?.message,
      stack: error?.stack,
      name: error?.name
    })
    return NextResponse.json(
      { 
        message: 'Internal server error',
        error: process.env.NODE_ENV === 'development' ? error?.message : undefined
      },
      { status: 500 }
    )
  } finally {
    await prisma.$disconnect()
  }
}