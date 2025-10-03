// src/app/api/admin/stores/[businessId]/business/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { checkBusinessAccess } from '@/lib/api-helpers'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ businessId: string }> }
) {
  try {
    const { businessId } = await params

    const access = await checkBusinessAccess(businessId)
    
    if (!access.authorized) {
      return NextResponse.json({ message: access.error }, { status: access.status })
    }

    const business = await prisma.business.findUnique({
      where: { id: businessId },
      select: {
        name: true,
        slug: true,
        phone: true,
        address: true,
        currency: true,
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