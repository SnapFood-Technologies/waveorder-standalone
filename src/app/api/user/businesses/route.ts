import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json(
        { message: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Get user's businesses
    const businessUsers = await prisma.businessUser.findMany({
      where: {
        userId: session.user.id
      },
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
            createdAt: true,
            onboardingCompleted: true
          }
        }
      }
    })

    const businesses = businessUsers.map(bu => ({
      ...bu.business,
      role: bu.role
    }))

    return NextResponse.json(
      { businesses },
      { status: 200 }
    )

  } catch (error) {
    console.error('Get businesses error:', error)
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    )
  }
}