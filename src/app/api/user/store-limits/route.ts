// app/api/user/store-limits/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { checkStoreLimit, getPlanStoreInfo } from '@/lib/store-limits'
import { PlanId } from '@/lib/stripe'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
    }

    // Get user's plan
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { plan: true }
    })

    const plan = (user?.plan as PlanId) || 'STARTER'
    
    // Check store limits
    const limitCheck = await checkStoreLimit(session.user.id)
    const planInfo = getPlanStoreInfo(plan)

    return NextResponse.json({
      ...limitCheck,
      planName: planInfo.name,
      isUnlimited: planInfo.isUnlimited
    })

  } catch (error) {
    console.error('Error checking store limits:', error)
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    )
  }
}
