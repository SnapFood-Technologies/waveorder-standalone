import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { cookies } from 'next/headers'


export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json(
        { message: 'Unauthorized' },
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

    // If impersonating, return only the impersonated business
    if (isImpersonating) {
      const businessId = impersonatingCookie.value
      
      const business = await prisma.business.findUnique({
        where: { id: businessId },
        select: {
          id: true,
          name: true,
          slug: true,
          businessType: true,
          subscriptionPlan: true,
          subscriptionStatus: true,
          isActive: true,
          createdAt: true,
          onboardingCompleted: true,
          setupWizardCompleted: true
        }
      })

      if (!business) {
        return NextResponse.json(
          { message: 'Impersonated business not found' },
          { status: 404 }
        )
      }

      // Return as array with OWNER role for consistency
      return NextResponse.json(
        { businesses: [{ ...business, role: 'OWNER' }] },
        { status: 200 }
      )
    }

    // Normal flow: Get user's own businesses
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
            onboardingCompleted: true,
            setupWizardCompleted: true
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