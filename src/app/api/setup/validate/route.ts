import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'


export async function POST(request: NextRequest) {
  try {
    const { token } = await request.json()

    if (!token) {
      return NextResponse.json(
        { message: 'Setup token is required' },
        { status: 400 }
      )
    }

    // Find user with valid setup token
    const user = await prisma.user.findFirst({
      where: {
        setupToken: token,
        setupExpiry: {
          gt: new Date() // Token not expired
        }
      },
      select: {
        id: true,
        email: true,
        name: true,
        businesses: {
          include: {
            business: true
          }
        }
      }
    })

    if (!user) {
      return NextResponse.json(
        { message: 'Invalid or expired setup token' },
        { status: 400 }
      )
    }

    // Check if user already has completed businesses
    if (user.businesses?.length > 0) {
      const business = user.businesses[0].business
      if (business.setupWizardCompleted) {
        return NextResponse.json(
          { 
            message: 'User already has businesses',
            redirectTo: `/admin/stores/${business.id}/dashboard`
          },
          { status: 400 }
        )
      }
    }

    return NextResponse.json(
      { 
        message: 'Token is valid',
        user: {
          id: user.id,
          email: user.email,
          name: user.name
        }
      },
      { status: 200 }
    )

  } catch (error) {
    console.error('Setup token validation error:', error)
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    )
  }
}