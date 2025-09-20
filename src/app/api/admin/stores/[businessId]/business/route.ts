// src/app/api/admin/stores/[businessId]/business/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export async function GET(
  request: NextRequest,
  { params }: { params: { businessId: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
    }

    // Verify user has access to this business
    const businessUser = await prisma.businessUser.findFirst({
      where: {
        businessId: params.businessId,
        userId: session.user.id
      }
    })

    if (!businessUser) {
      return NextResponse.json({ message: 'Access denied' }, { status: 403 })
    }

    // Get business data with all fields needed for the widget
    const business = await prisma.business.findUnique({
      where: { id: params.businessId },
      select: {
        name: true,
        slug: true,
        phone: true,
        address: true,
        email: true,
        website: true,
        whatsappNumber: true,
        businessHours: true,
        businessType: true,
        subscriptionPlan: true,
        isActive: true
      }
    })

    if (!business) {
      return NextResponse.json({ message: 'Business not found' }, { status: 404 })
    }

    return NextResponse.json({ business })

  } catch (error) {
    console.error('Error fetching business data:', error)
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 })
  }
}