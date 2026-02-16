// app/api/admin/stores/[businessId]/staff/availability/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { checkBusinessAccess } from '@/lib/api-helpers'

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

    // Verify business is a salon
    const business = await prisma.business.findUnique({
      where: { id: businessId },
      select: { businessType: true, staffAvailability: true }
    })

    if (business?.businessType !== 'SALON') {
      return NextResponse.json({ message: 'This endpoint is only for salon businesses' }, { status: 403 })
    }

    // Return stored availability or empty object
    const availability = (business.staffAvailability as any) || {}

    return NextResponse.json({ availability })

  } catch (error) {
    console.error('Error fetching staff availability:', error)
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 })
  }
}

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

    // Verify business is a salon
    const business = await prisma.business.findUnique({
      where: { id: businessId },
      select: { businessType: true, staffAvailability: true }
    })

    if (business?.businessType !== 'SALON') {
      return NextResponse.json({ message: 'This endpoint is only for salon businesses' }, { status: 403 })
    }

    const { staffId, availability } = await request.json()

    if (!staffId || !availability) {
      return NextResponse.json({ message: 'staffId and availability are required' }, { status: 400 })
    }

    // Get current availability
    const currentAvailability = (business.staffAvailability as any) || {}

    // Update availability for this staff member
    const updatedAvailability = {
      ...currentAvailability,
      [staffId]: availability
    }

    // Save to business model
    await prisma.business.update({
      where: { id: businessId },
      data: {
        staffAvailability: updatedAvailability as any
      }
    })

    return NextResponse.json({ 
      message: 'Staff availability updated successfully',
      availability: updatedAvailability
    })

  } catch (error) {
    console.error('Error updating staff availability:', error)
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 })
  }
}
