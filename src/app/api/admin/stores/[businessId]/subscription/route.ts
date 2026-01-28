// app/api/businesses/[businessId]/subscription/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { checkBusinessAccess } from '@/lib/api-helpers'
import { prisma } from '@/lib/prisma'
import { getBusinessTrialInfo } from '@/lib/trial'
import { PLAN_HIERARCHY } from '@/lib/stripe'

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ businessId: string }> }
) {
  try {
    const { businessId } = await context.params

    const access = await checkBusinessAccess(businessId)
    
    if (!access.authorized) {
      return NextResponse.json({ message: access.error }, { status: access.status })
    }

    // Get business with user relationship and trial fields
    const business = await prisma.business.findUnique({
      where: { id: businessId },
      include: {
        users: {
          where: {
            userId: access.session.user.id
          },
          select: {
            role: true
          }
        }
      }
    })

    if (!business) {
      return NextResponse.json(
        { message: 'Business not found' },
        { status: 404 }
      )
    }

    // Get trial info (cast to include new fields)
    const trialInfo = getBusinessTrialInfo({
      trialEndsAt: (business as any).trialEndsAt,
      graceEndsAt: (business as any).graceEndsAt,
      subscriptionPlan: business.subscriptionPlan
    })

    // Check plan access - user has access if they're paid OR in trial/grace period
    const isActive = business.subscriptionStatus === 'ACTIVE' || trialInfo.canAccessFeatures
    const planLevel = PLAN_HIERARCHY[business.subscriptionPlan]
    
    const hasProAccess = isActive && planLevel >= PLAN_HIERARCHY.PRO
    const hasBusinessAccess = isActive && planLevel >= PLAN_HIERARCHY.BUSINESS

    return NextResponse.json({
      businessId: business.id,
      businessName: business.name,
      subscriptionPlan: business.subscriptionPlan,
      subscriptionStatus: business.subscriptionStatus,
      hasProAccess,
      hasBusinessAccess,
      userRole: business.users[0]?.role || 'OWNER',
      // Trial info
      trialStatus: trialInfo.status,
      trialDaysRemaining: trialInfo.trialDaysRemaining,
      graceDaysRemaining: trialInfo.graceDaysRemaining,
      isTrialActive: trialInfo.isTrialActive,
      isGracePeriod: trialInfo.isGracePeriod,
      isExpired: trialInfo.isExpired,
      isPaid: trialInfo.isPaid,
      canAccessFeatures: trialInfo.canAccessFeatures,
      showTrialWarning: trialInfo.showTrialWarning,
      showGraceWarning: trialInfo.showGraceWarning,
      showExpiredWarning: trialInfo.showExpiredWarning
    })

  } catch (error) {
    console.error('Subscription check error:', error)
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    )
  }
}