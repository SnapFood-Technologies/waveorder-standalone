import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { checkBusinessAccess } from '@/lib/api-helpers'

// GET - Fetch return fee settings
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
        businessType: true,
        currency: true,
        returnFeePercentage: true
      }
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

    return NextResponse.json({
      businessType: business.businessType,
      currency: business.currency,
      returnFeePercentage: business.returnFeePercentage
    })
  } catch (error) {
    console.error('Error fetching return fee settings:', error)
    return NextResponse.json(
      { error: 'Failed to fetch settings' },
      { status: 500 }
    )
  }
}

// PUT - Update return fee percentage
export async function PUT(
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

    const body = await request.json()
    const { returnFeePercentage } = body

    // Validate returnFeePercentage if provided
    if (returnFeePercentage !== null && returnFeePercentage !== undefined) {
      if (typeof returnFeePercentage !== 'number' || returnFeePercentage < 0 || returnFeePercentage > 100) {
        return NextResponse.json(
          { error: 'Return fee percentage must be between 0 and 100' },
          { status: 400 }
        )
      }
    }

    const updated = await prisma.business.update({
      where: { id: businessId },
      data: {
        returnFeePercentage: returnFeePercentage === null || returnFeePercentage === undefined 
          ? null 
          : returnFeePercentage
      },
      select: {
        returnFeePercentage: true
      }
    })

    return NextResponse.json(updated)
  } catch (error) {
    console.error('Error updating return fee settings:', error)
    return NextResponse.json(
      { error: 'Failed to update settings' },
      { status: 500 }
    )
  }
}
