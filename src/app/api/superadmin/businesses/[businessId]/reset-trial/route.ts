// app/api/superadmin/businesses/[businessId]/reset-trial/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { stripe } from '@/lib/stripe'
import { logSystemEvent } from '@/lib/systemLog'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ businessId: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || session.user.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
    }

    const { businessId } = await params

    const business = await prisma.business.findUnique({
      where: { id: businessId },
      include: {
        users: {
          where: { role: 'OWNER' },
          include: {
            user: {
              include: { subscription: true }
            }
          }
        }
      }
    })

    if (!business) {
      return NextResponse.json({ message: 'Business not found' }, { status: 404 })
    }

    const owner = business.users[0]?.user
    let canceledStripeSubs = 0

    // Cancel all existing Stripe subscriptions for this customer to prevent orphans
    if (owner?.stripeCustomerId) {
      try {
        const stripeSubs = await stripe.subscriptions.list({
          customer: owner.stripeCustomerId,
          limit: 20
        })

        for (const sub of stripeSubs.data) {
          if (['active', 'trialing', 'paused', 'past_due'].includes(sub.status)) {
            try {
              await stripe.subscriptions.cancel(sub.id)
              canceledStripeSubs++
            } catch (cancelErr) {
              console.error(`Failed to cancel Stripe sub ${sub.id}:`, cancelErr)
            }
          }
        }
      } catch (stripeErr) {
        console.error('Error listing Stripe subscriptions:', stripeErr)
      }
    }

    // Clean up DB: unlink subscription from user, delete orphaned record
    if (owner?.subscription) {
      await prisma.user.update({
        where: { id: owner.id },
        data: { subscriptionId: null }
      })

      try {
        await prisma.subscription.delete({
          where: { id: owner.subscription.id }
        })
      } catch {
        // May fail if other users reference it — that's ok, just unlink
      }
    }

    await prisma.business.update({
      where: { id: businessId },
      data: {
        trialEndsAt: null,
        graceEndsAt: null
      }
    })

    if (owner) {
      await prisma.user.update({
        where: { id: owner.id },
        data: {
          trialUsed: false,
          trialEndsAt: null,
          graceEndsAt: null
        }
      })
    }

    const host = request.headers.get('host') || request.headers.get('x-forwarded-host')
    const protocol = request.headers.get('x-forwarded-proto') || (process.env.NODE_ENV === 'production' ? 'https' : 'http')
    const actualUrl = host ? `${protocol}://${host}${new URL(request.url).pathname}` : request.url

    await logSystemEvent({
      logType: 'admin_action',
      severity: 'info',
      endpoint: `/api/superadmin/businesses/${businessId}/reset-trial`,
      method: 'POST',
      url: actualUrl,
      businessId,
      errorMessage: `Trial reset for business: ${business.name} by ${session.user.email}`,
      metadata: {
        action: 'reset_trial',
        businessName: business.name,
        businessSlug: business.slug,
        resetBy: session.user.email,
        ownerId: owner?.id,
        ownerEmail: owner?.email,
        canceledStripeSubs
      }
    })

    return NextResponse.json({ 
      success: true, 
      message: `Trial reset successfully. ${canceledStripeSubs > 0 ? `${canceledStripeSubs} Stripe subscription(s) canceled.` : ''} User can now start a new trial.`
    })

  } catch (error) {
    console.error('Error resetting trial:', error)
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    )
  }
}
