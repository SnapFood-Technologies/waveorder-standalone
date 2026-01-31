// src/app/api/user/default-store/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

// GET - Get current default store
export async function GET() {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { defaultBusinessId: true }
    })

    return NextResponse.json({ 
      defaultBusinessId: user?.defaultBusinessId || null 
    })

  } catch (error) {
    console.error('Error fetching default store:', error)
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    )
  }
}

// PUT - Set default store
export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
    }

    const { businessId } = await request.json()

    if (!businessId) {
      return NextResponse.json(
        { message: 'Business ID is required' },
        { status: 400 }
      )
    }

    // Verify user has access to this business
    const businessUser = await prisma.businessUser.findFirst({
      where: {
        userId: session.user.id,
        businessId
      }
    })

    if (!businessUser) {
      return NextResponse.json(
        { message: 'You do not have access to this store' },
        { status: 403 }
      )
    }

    // Update user's default business
    await prisma.user.update({
      where: { id: session.user.id },
      data: { defaultBusinessId: businessId }
    })

    return NextResponse.json({ 
      success: true,
      defaultBusinessId: businessId,
      message: 'Default store updated successfully'
    })

  } catch (error) {
    console.error('Error setting default store:', error)
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    )
  }
}

// DELETE - Clear default store (will use first available)
export async function DELETE() {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
    }

    await prisma.user.update({
      where: { id: session.user.id },
      data: { defaultBusinessId: null }
    })

    return NextResponse.json({ 
      success: true,
      message: 'Default store preference cleared'
    })

  } catch (error) {
    console.error('Error clearing default store:', error)
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    )
  }
}
