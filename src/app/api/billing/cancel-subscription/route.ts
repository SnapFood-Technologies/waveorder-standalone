// app/api/billing/cancel-subscription/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { cancelUserSubscription } from '@/lib/subscription'

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { message: 'Unauthorized' },
        { status: 401 }
      )
    }

    console.log('🔄 Canceling subscription for user:', session.user.id)

    await cancelUserSubscription(session.user.id)
    
    console.log('✅ Subscription canceled successfully')

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