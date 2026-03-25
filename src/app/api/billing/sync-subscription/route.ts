// POST — Pull latest subscription (incl. billing periods) from Stripe into DB.
// Call after Customer Portal return or when UI needs fresh period dates.
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { syncSubscriptionFromStripeForBusinessOwner } from '@/lib/subscription'

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json().catch(() => ({}))
    const businessId = body.businessId as string | undefined
    if (!businessId) {
      return NextResponse.json({ message: 'businessId is required' }, { status: 400 })
    }

    const isSuper = (session.user as { role?: string })?.role === 'SUPER_ADMIN'
    const member = await prisma.businessUser.findFirst({
      where: { businessId, userId: session.user.id }
    })
    const allowed =
      isSuper ||
      (member && ['OWNER', 'ADMIN'].includes(member.role))
    if (!allowed) {
      return NextResponse.json({ message: 'Forbidden' }, { status: 403 })
    }

    const result = await syncSubscriptionFromStripeForBusinessOwner(businessId)
    return NextResponse.json({
      success: true,
      skipped: result.skipped,
      reason: result.reason
    })
  } catch (error) {
    console.error('[sync-subscription]', error)
    return NextResponse.json(
      { message: error instanceof Error ? error.message : 'Sync failed' },
      { status: 500 }
    )
  }
}
