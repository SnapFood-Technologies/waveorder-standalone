// app/api/superadmin/users/[userId]/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { getPlanLimits } from '@/lib/stripe'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || session.user.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
    }

    const { userId } = await params

    if (!userId) {
      return NextResponse.json({ message: 'User ID is required' }, { status: 400 })
    }

    // Fetch user with all related data
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        accounts: {
          select: {
            provider: true,
            type: true
          }
        },
        subscription: {
          select: {
            id: true,
            stripeId: true,
            status: true,
            priceId: true,
            plan: true,
            currentPeriodStart: true,
            currentPeriodEnd: true,
            cancelAtPeriodEnd: true,
            canceledAt: true
          }
        },
        businesses: {
          include: {
            business: {
              select: {
                id: true,
                name: true,
                slug: true,
                businessType: true,
                subscriptionPlan: true,
                subscriptionStatus: true,
                isActive: true,
                testMode: true,
                createdAt: true,
                _count: {
                  select: {
                    orders: true,
                    products: true
                  }
                }
              }
            }
          }
        }
      }
    })

    if (!user) {
      return NextResponse.json({ message: 'User not found' }, { status: 404 })
    }

    // Determine auth method
    let authMethod: 'google' | 'email' | 'magic-link' | 'oauth' = 'email'
    
    if (user.accounts?.length > 0) {
      const googleAccount = user.accounts.find(acc => acc.provider === 'google')
      if (googleAccount) {
        authMethod = 'google'
      } else {
        authMethod = 'oauth'
      }
    } else if (user.password) {
      authMethod = 'email'
    } else {
      authMethod = 'magic-link'
    }

    // Calculate stats
    const stats = {
      totalBusinesses: user.businesses.length,
      totalOrders: user.businesses.reduce((sum, bu) => sum + (bu.business._count?.orders || 0), 0),
      totalProducts: user.businesses.reduce((sum, bu) => sum + (bu.business._count?.products || 0), 0)
    }

    // Calculate store limits based on plan
    const userPlan = (user.plan as 'STARTER' | 'PRO' | 'BUSINESS') || 'STARTER'
    const planLimits = getPlanLimits(userPlan)
    const storeLimit = {
      current: user.businesses.length,
      limit: planLimits.stores,
      isUnlimited: planLimits.stores === -1,
      atLimit: planLimits.stores !== -1 && user.businesses.length >= planLimits.stores,
      nearLimit: planLimits.stores !== -1 && user.businesses.length >= planLimits.stores - 1
    }

    // Calculate trial info
    let trialInfo = null
    if (user.trialEndsAt) {
      const now = new Date()
      const trialEndsAt = new Date(user.trialEndsAt)
      const graceEndsAt = user.graceEndsAt ? new Date(user.graceEndsAt) : null
      
      let status: 'TRIAL_ACTIVE' | 'GRACE_PERIOD' | 'EXPIRED' | 'PAID' = 'PAID'
      let daysRemaining = 0
      
      if (now < trialEndsAt) {
        status = 'TRIAL_ACTIVE'
        daysRemaining = Math.ceil((trialEndsAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
      } else if (graceEndsAt && now < graceEndsAt) {
        status = 'GRACE_PERIOD'
        daysRemaining = Math.ceil((graceEndsAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
      } else if (user.trialUsed) {
        status = 'EXPIRED'
      }
      
      trialInfo = {
        status,
        trialEndsAt: user.trialEndsAt,
        graceEndsAt: user.graceEndsAt,
        daysRemaining,
        trialUsed: user.trialUsed
      }
    }

    // Format response
    const formattedUser = {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      authMethod,
      createdAt: user.createdAt,
      emailVerified: user.emailVerified,
      // Subscription info
      plan: user.plan,
      stripeCustomerId: user.stripeCustomerId,
      subscription: user.subscription,
      // Trial info
      trialInfo,
      // Businesses
      businesses: user.businesses.map(bu => ({
        id: bu.business.id,
        name: bu.business.name,
        slug: bu.business.slug,
        businessType: bu.business.businessType,
        role: bu.role,
        subscriptionPlan: bu.business.subscriptionPlan,
        subscriptionStatus: bu.business.subscriptionStatus,
        isActive: bu.business.isActive,
        testMode: bu.business.testMode || false,
        createdAt: bu.business.createdAt,
        ordersCount: bu.business._count?.orders || 0,
        productsCount: bu.business._count?.products || 0
      })),
      // Stats
      stats,
      // Store limits
      storeLimit
    }

    return NextResponse.json({ user: formattedUser })

  } catch (error) {
    console.error('Error fetching user details:', error)
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    )
  }
}
