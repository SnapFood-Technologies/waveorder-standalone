// src/app/api/user/subscription/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Find user with their businesses
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: {
        businesses: {
          include: {
            business: {
              select: {
                id: true,
                name: true,
                subscriptionPlan: true,
                subscriptionStatus: true
              }
            }
          }
        }
      }
    })

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    // If user has no businesses, return FREE plan
    if (user.businesses.length === 0) {
      return NextResponse.json({
        plan: 'FREE',
        isActive: true,
        businesses: []
      })
    }

    // Get the highest plan among all businesses (PRO > FREE)
    const businesses = user.businesses.map(ub => ub.business)
    const hasProBusiness = businesses.some(b => b.subscriptionPlan === 'PRO')
    const highestPlan = hasProBusiness ? 'PRO' : 'FREE'
    
    // Check if any business has active subscription
    const hasActiveSubscription = businesses.some(b => b.subscriptionStatus === 'ACTIVE')

    return NextResponse.json({
      plan: highestPlan,
      isActive: hasActiveSubscription,
      businesses: businesses.map(business => ({
        id: business.id,
        name: business.name,
        plan: business.subscriptionPlan,
        status: business.subscriptionStatus
      }))
    })

  } catch (error) {
    console.error('Error fetching user subscription:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}