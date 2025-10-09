// src/app/api/user/subscription/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { getUserSubscriptionStatus } from '@/lib/subscription'

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { message: 'Unauthorized' },
        { status: 401 }
      )
    }

    const subscriptionStatus = await getUserSubscriptionStatus(session.user.id)
    
    return NextResponse.json(subscriptionStatus)
  } catch (error) {
    console.error('Error fetching subscription status:', error)
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    )
  }
}