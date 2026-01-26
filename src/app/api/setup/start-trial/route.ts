// app/api/setup/start-trial/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'


export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
    }

    const { plan } = await request.json()

    if (plan !== 'PRO') {
      return NextResponse.json({ message: 'Invalid plan for trial' }, { status: 400 })
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email }
    })

    if (!user) {
      return NextResponse.json({ message: 'User not found' }, { status: 404 })
    }

    // Calculate trial end date (14 days from now)
    const trialEndDate = new Date()
    trialEndDate.setDate(trialEndDate.getDate() + 14)

    // For now, just return success with trial info
    // In production, you'd integrate with Stripe or your payment processor
    return NextResponse.json({
      success: true,
      trial: {
        plan: 'PRO',
        trialStart: new Date(),
        trialEnd: trialEndDate,
        status: 'TRIAL_ACTIVE'
      },
      message: 'Pro trial started successfully'
    })

  } catch (error) {
    console.error('Start trial error:', error)
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 })
  }
}