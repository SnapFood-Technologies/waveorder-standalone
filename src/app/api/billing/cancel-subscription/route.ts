// app/api/billing/cancel-subscription/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { cancelUserSubscription } from '@/lib/subscription'
import { sendSubscriptionChangeEmail } from '@/lib/email'
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

    // Get user with subscription details before canceling
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

    // Cancel the subscription
    await cancelUserSubscription(session.user.id)
    

    // 📧 SEND CANCELLATION CONFIRMATION EMAIL
    if (user.subscription) {
      try {
        await sendSubscriptionChangeEmail({
          to: user.email,
          name: user.name || 'there',
          changeType: 'canceled',
          oldPlan: 'PRO',
          newPlan: 'STARTER',
          nextBillingDate: user.subscription.currentPeriodEnd || undefined
        })
      } catch (emailError) {
        console.error('❌ Failed to send cancellation email:', emailError)
        // Don't fail the API call if email fails
      }
    }

    return NextResponse.json({ 
      message: 'Subscription canceled successfully. You will keep access to PRO features until the end of your billing period.' 
    })

  } catch (error) {
    console.error('❌ Error canceling subscription:', error)
    return NextResponse.json(
      { 
        message: 'Failed to cancel subscription',
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}