// src/app/api/user/subscription/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { getUserSubscriptionStatus } from '@/lib/subscription'
import { prisma } from '@/lib/prisma'

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json(
        { message: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(req.url)
    const businessId = searchParams.get('businessId')

    // When Super Admin impersonates, return the business owner's subscription (by businessId)
    let userId = session.user.id
    if (
      businessId &&
      (session.user as { role?: string })?.role === 'SUPER_ADMIN'
    ) {
      const owner = await prisma.businessUser.findFirst({
        where: { businessId, role: 'OWNER' },
        select: { userId: true }
      })
      if (owner) {
        userId = owner.userId
      }
    }

    const subscriptionStatus = await getUserSubscriptionStatus(userId)

    return NextResponse.json(subscriptionStatus)
  } catch (error) {
    console.error('Error fetching subscription status:', error)
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    )
  }
}