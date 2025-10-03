// src/app/api/user/subscription/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { cookies } from 'next/headers'
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

    // Check if SuperAdmin is currently impersonating
    const cookieStore = cookies()
    // @ts-ignore
    const impersonatingCookie = cookieStore.get('impersonating')
    const isImpersonating = 
      session.user.role === 'SUPER_ADMIN' && 
      impersonatingCookie?.value

    // If impersonating, return the impersonated business's subscription
    if (isImpersonating) {
      const businessId = impersonatingCookie.value
      
      const business = await prisma.business.findUnique({
        where: { id: businessId },
        select: {
          id: true,
          name: true,
          subscriptionPlan: true,
          subscriptionStatus: true
        }
      })

      if (!business) {
        return NextResponse.json(
          { error: 'Impersonated business not found' },
          { status: 404 }
        )
      }

      return NextResponse.json({
        plan: business.subscriptionPlan,
        isActive: business.subscriptionStatus === 'ACTIVE',
        businesses: [{
          id: business.id,
          name: business.name,
          plan: business.subscriptionPlan,
          status: business.subscriptionStatus
        }]
      })
    }

    // Normal flow: Get user's subscription
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

    if (user.businesses.length === 0) {
      return NextResponse.json({
        plan: 'FREE',
        isActive: true,
        businesses: []
      })
    }

    const businesses = user.businesses.map(ub => ub.business)
    const hasProBusiness = businesses.some(b => b.subscriptionPlan === 'PRO')
    const highestPlan = hasProBusiness ? 'PRO' : 'FREE'
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