// app/api/admin/stores/[businessId]/happy-hour/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

// GET - Fetch happy hour settings
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ businessId: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
    }

    const { businessId } = await params

    // Check user has access to this business
    if (session.user.role !== 'SUPER_ADMIN') {
      const hasAccess = await prisma.businessUser.findFirst({
        where: {
          userId: session.user.id,
          businessId: businessId
        }
      })
      
      if (!hasAccess) {
        return NextResponse.json({ message: 'Forbidden' }, { status: 403 })
      }
    }

    const business = await prisma.business.findUnique({
      where: { id: businessId },
      select: {
        happyHourEnabled: true,
        happyHourActive: true,
        happyHourStartTime: true,
        happyHourEndTime: true,
        happyHourDiscountPercent: true,
        happyHourProductIds: true
      }
    })

    if (!business) {
      return NextResponse.json({ message: 'Business not found' }, { status: 404 })
    }

    return NextResponse.json(business)

  } catch (error) {
    console.error('Error fetching happy hour settings:', error)
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    )
  }
}

// PATCH - Update happy hour settings (business admin)
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ businessId: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
    }

    const { businessId } = await params

    // Check user has access to this business
    if (session.user.role !== 'SUPER_ADMIN') {
      const hasAccess = await prisma.businessUser.findFirst({
        where: {
          userId: session.user.id,
          businessId: businessId,
          role: { in: ['OWNER', 'ADMIN', 'MANAGER'] }
        }
      })
      
      if (!hasAccess) {
        return NextResponse.json({ message: 'Forbidden' }, { status: 403 })
      }
    }

    // Check if happy hour is enabled for this business by SuperAdmin
    const existingBusiness = await prisma.business.findUnique({
      where: { id: businessId },
      select: { happyHourEnabled: true, name: true }
    })

    if (!existingBusiness) {
      return NextResponse.json({ message: 'Business not found' }, { status: 404 })
    }

    if (!existingBusiness.happyHourEnabled) {
      return NextResponse.json(
        { message: 'Happy Hour feature is not enabled for this business' },
        { status: 403 }
      )
    }

    const data = await request.json()

    // Validate time format (HH:mm)
    const timeRegex = /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/
    if (data.happyHourStartTime && !timeRegex.test(data.happyHourStartTime)) {
      return NextResponse.json({ message: 'Invalid start time format' }, { status: 400 })
    }
    if (data.happyHourEndTime && !timeRegex.test(data.happyHourEndTime)) {
      return NextResponse.json({ message: 'Invalid end time format' }, { status: 400 })
    }

    // Validate discount percentage
    if (data.happyHourDiscountPercent !== undefined) {
      const discount = parseFloat(data.happyHourDiscountPercent)
      if (isNaN(discount) || discount < 1 || discount > 99) {
        return NextResponse.json(
          { message: 'Discount must be between 1% and 99%' },
          { status: 400 }
        )
      }
    }

    // Validate product IDs if provided
    if (data.happyHourProductIds && Array.isArray(data.happyHourProductIds)) {
      // Verify all product IDs belong to this business
      const validProducts = await prisma.product.count({
        where: {
          id: { in: data.happyHourProductIds },
          businessId: businessId
        }
      })
      
      if (validProducts !== data.happyHourProductIds.length) {
        return NextResponse.json(
          { message: 'Some product IDs are invalid' },
          { status: 400 }
        )
      }
    }

    // Build update data
    const updateData: Record<string, unknown> = {}
    
    if (typeof data.happyHourActive === 'boolean') {
      updateData.happyHourActive = data.happyHourActive
    }
    if (data.happyHourStartTime !== undefined) {
      updateData.happyHourStartTime = data.happyHourStartTime
    }
    if (data.happyHourEndTime !== undefined) {
      updateData.happyHourEndTime = data.happyHourEndTime
    }
    if (data.happyHourDiscountPercent !== undefined) {
      updateData.happyHourDiscountPercent = parseFloat(data.happyHourDiscountPercent)
    }
    if (data.happyHourProductIds !== undefined) {
      updateData.happyHourProductIds = data.happyHourProductIds
    }

    const updatedBusiness = await prisma.business.update({
      where: { id: businessId },
      data: updateData,
      select: {
        happyHourEnabled: true,
        happyHourActive: true,
        happyHourStartTime: true,
        happyHourEndTime: true,
        happyHourDiscountPercent: true,
        happyHourProductIds: true
      }
    })

    return NextResponse.json({
      success: true,
      ...updatedBusiness
    })

  } catch (error) {
    console.error('Error updating happy hour settings:', error)
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    )
  }
}
