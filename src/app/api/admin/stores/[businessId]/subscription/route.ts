// app/api/businesses/[businessId]/subscription/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ businessId: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    const { businessId } = await context.params

    if (!session?.user?.id) {
      return NextResponse.json(
        { message: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Check if user has access to this business
    const businessUser = await prisma.businessUser.findFirst({
      where: {
        userId: session.user.id,
        businessId: businessId
      },
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
    })

    if (!businessUser) {
      return NextResponse.json(
        { message: 'Business not found or access denied' },
        { status: 404 }
      )
    }

    const business = businessUser.business

    return NextResponse.json({
      businessId: business.id,
      businessName: business.name,
      subscriptionPlan: business.subscriptionPlan,
      subscriptionStatus: business.subscriptionStatus,
      hasProAccess: business.subscriptionPlan === 'PRO' && business.subscriptionStatus === 'ACTIVE',
      userRole: businessUser.role
    })

  } catch (error) {
    console.error('Subscription check error:', error)
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    )
  }
}