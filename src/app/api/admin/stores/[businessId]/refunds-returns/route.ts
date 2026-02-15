import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { checkBusinessAccess } from '@/lib/api-helpers'

// GET - Fetch refunded/returned orders
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

    // Verify business type is RETAIL
    const business = await prisma.business.findUnique({
      where: { id: businessId },
      select: { businessType: true }
    })

    if (!business) {
      return NextResponse.json({ message: 'Business not found' }, { status: 404 })
    }

    if (business.businessType !== 'RETAIL') {
      return NextResponse.json(
        { message: 'This feature is only available for RETAIL businesses' },
        { status: 403 }
      )
    }

    // Fetch orders with REFUNDED status or orders that have returnFee/refundAmount set
    const orders = await prisma.order.findMany({
      where: {
        businessId: businessId,
        OR: [
          { status: 'REFUNDED' },
          { returnFee: { not: null } },
          { refundAmount: { not: null } }
        ]
      },
      select: {
        id: true,
        orderNumber: true,
        status: true,
        total: true,
        returnFee: true,
        refundAmount: true,
        createdAt: true,
        updatedAt: true,
        customer: {
          select: {
            id: true,
            name: true,
            phone: true
          }
        }
      },
      orderBy: {
        updatedAt: 'desc'
      }
    })

    return NextResponse.json({ orders })
  } catch (error) {
    console.error('Error fetching refunds and returns:', error)
    return NextResponse.json(
      { error: 'Failed to fetch refunds and returns' },
      { status: 500 }
    )
  }
}
