// app/api/billing/cancel-subscription/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { cancelUserSubscription } from '@/lib/subscription'
import { sendSubscriptionChangeEmail } from '@/lib/email'
import { prisma } from '@/lib/prisma'
import { logSystemEvent, extractIPAddress } from '@/lib/systemLog'

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { message: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await req.json().catch(() => ({}))
    const { businessId } = body

    // When SuperAdmin impersonates, use business owner's user (not SuperAdmin's)
    let targetUserId = session.user.id
    if (businessId && (session.user as { role?: string })?.role === 'SUPER_ADMIN') {
      const owner = await prisma.businessUser.findFirst({
        where: { businessId, role: 'OWNER' },
        select: { userId: true }
      })
      if (owner) targetUserId = owner.userId
    }

    // Get user with subscription details before canceling
    const user = await prisma.user.findUnique({
      where: { id: targetUserId },
      include: { subscription: true }
    })

    if (!user) {
      return NextResponse.json(
        { message: 'User not found' },
        { status: 404 }
      )
    }

    // Cancel the subscription
    await cancelUserSubscription(targetUserId)

    // Resolve first business for logging (billing panel is per-business context)
    const firstBusiness = await prisma.businessUser.findFirst({
      where: { userId: targetUserId },
      select: { businessId: true },
    })
    const businessIdForLog = firstBusiness?.businessId ?? undefined

    const oldPlan = user.plan || user.subscription?.plan || 'PRO'

    // Log billing panel action for superadmin
    await logSystemEvent({
      logType: 'billing_panel_action',
      severity: 'info',
      endpoint: '/api/billing/cancel-subscription',
      method: 'POST',
      statusCode: 200,
      url: req.url || '/api/billing/cancel-subscription',
      businessId: businessIdForLog,
      errorMessage: `Subscription cancel requested (${oldPlan})`,
      ipAddress: extractIPAddress(req),
      userAgent: req.headers.get('user-agent') || undefined,
      metadata: {
        userId: user.id,
        userEmail: user.email,
        oldPlan,
        action: 'cancel_requested',
        currentPeriodEnd: user.subscription?.currentPeriodEnd?.toISOString() ?? undefined,
      },
    })

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