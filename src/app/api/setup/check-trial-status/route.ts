// app/api/setup/check-trial-status/route.ts
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: {
        trialUsed: true,
        trialEndsAt: true,
        plan: true
      }
    })

    if (!user) {
      return NextResponse.json({ message: 'User not found' }, { status: 404 })
    }

    // Check if trial was used or if there's an active trial
    const trialUsed = (user as any).trialUsed === true
    const hasActiveTrial = user.trialEndsAt && new Date(user.trialEndsAt) > new Date()

    return NextResponse.json({
      trialUsed,
      hasActiveTrial,
      plan: user.plan,
      trialEndsAt: user.trialEndsAt
    })

  } catch (error) {
    console.error('Error checking trial status:', error)
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    )
  }
}
