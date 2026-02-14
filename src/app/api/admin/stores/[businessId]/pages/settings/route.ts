import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// GET - Get settings
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ businessId: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { businessId } = await params

    // Verify user has access
    const businessUser = await prisma.businessUser.findFirst({
      where: {
        businessId,
        userId: session.user.id,
        role: { in: ['OWNER', 'MANAGER'] },
      },
    })

    if (!businessUser) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const business = await prisma.business.findUnique({
      where: { id: businessId },
      select: {
        legalPagesEnabled: true,
        legalPagesCtaEnabled: true,
        legalPagesCtaText: true,
      },
    })

    if (!business) {
      return NextResponse.json({ error: 'Business not found' }, { status: 404 })
    }

    return NextResponse.json({
      ctaEnabled: business.legalPagesCtaEnabled || false,
      ctaText: business.legalPagesCtaText || 'Privacy & Policies',
    })
  } catch (error) {
    console.error('Error fetching settings:', error)
    return NextResponse.json(
      { error: 'Failed to fetch settings' },
      { status: 500 }
    )
  }
}

// PUT - Update settings
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ businessId: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { businessId } = await params

    // Verify user has access
    const businessUser = await prisma.businessUser.findFirst({
      where: {
        businessId,
        userId: session.user.id,
        role: { in: ['OWNER', 'MANAGER'] },
      },
    })

    if (!businessUser) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Check if feature is enabled
    const business = await prisma.business.findUnique({
      where: { id: businessId },
      select: { legalPagesEnabled: true },
    })

    if (!business?.legalPagesEnabled) {
      return NextResponse.json({ error: 'Feature not enabled' }, { status: 403 })
    }

    const body = await request.json()
    const { ctaEnabled, ctaText } = body

    const updated = await prisma.business.update({
      where: { id: businessId },
      data: {
        legalPagesCtaEnabled: ctaEnabled !== undefined ? ctaEnabled : false,
        legalPagesCtaText: ctaText || null,
      },
      select: {
        legalPagesCtaEnabled: true,
        legalPagesCtaText: true,
      },
    })

    return NextResponse.json(updated)
  } catch (error) {
    console.error('Error updating settings:', error)
    return NextResponse.json(
      { error: 'Failed to update settings' },
      { status: 500 }
    )
  }
}
