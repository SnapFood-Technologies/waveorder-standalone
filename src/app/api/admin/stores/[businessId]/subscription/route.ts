// app/api/businesses/[businessId]/subscription/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { checkBusinessAccess } from '@/lib/api-helpers'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

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
        { message: 'Business not found' },
        { status: 404 }
      )
    }

    // Get user role
    const businessUser = await prisma.businessUser.findFirst({
      where: {
        userId: access.session.user.id,
        businessId: businessId
      },
      select: {
        role: true
      }
    })

    return NextResponse.json({
      businessId: business.id,
      businessName: business.name,
      subscriptionPlan: business.subscriptionPlan,
      subscriptionStatus: business.subscriptionStatus,
      hasProAccess: business.subscriptionPlan === 'PRO' && business.subscriptionStatus === 'ACTIVE',
      userRole: businessUser?.role || 'OWNER'
    })

  } catch (error) {
    console.error('Subscription check error:', error)
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    )
  }
}