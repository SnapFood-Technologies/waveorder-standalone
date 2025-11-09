// app/api/superadmin/businesses/[businessId]/status/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { PrismaClient } from '@prisma/client'
import { authOptions } from '@/lib/auth'

const prisma = new PrismaClient()

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ businessId: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || session.user.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
    }

    const { businessId } = await params
    const body = await request.json()
    const { isActive, deactivationReason } = body

    if (!businessId) {
      return NextResponse.json({ message: 'Business ID is required' }, { status: 400 })
    }

    if (typeof isActive !== 'boolean') {
      return NextResponse.json({ message: 'isActive must be a boolean value' }, { status: 400 })
    }

    // Check if business exists
    const existingBusiness = await prisma.business.findUnique({
      where: { id: businessId },
      select: { 
        id: true, 
        name: true, 
        isActive: true 
      }
    })

    if (!existingBusiness) {
      return NextResponse.json({ message: 'Business not found' }, { status: 404 })
    }

    // Check if the status is actually changing
    if (existingBusiness.isActive === isActive) {
      return NextResponse.json({ 
        message: `Business is already ${isActive ? 'active' : 'inactive'}` 
      }, { status: 400 })
    }

    // Prepare update data
    const updateData: any = {
      isActive,
      updatedAt: new Date()
    }

    // If deactivating, set deactivation timestamp and reason
    if (!isActive) {
      updateData.deactivatedAt = new Date()
      if (deactivationReason && deactivationReason.trim() !== '') {
        updateData.deactivationReason = deactivationReason.trim()
      }
    } else {
      // If reactivating, clear deactivation data
      updateData.deactivatedAt = null
      updateData.deactivationReason = null
    }

    // Update business status
    const updatedBusiness = await prisma.business.update({
      where: { id: businessId },
      data: updateData,
      select: {
        id: true,
        name: true,
        isActive: true,
        deactivatedAt: true,
        deactivationReason: true,
        updatedAt: true
      }
    })

    return NextResponse.json({
      success: true,
      message: `Business "${updatedBusiness.name}" has been ${isActive ? 'activated' : 'deactivated'} successfully`,
      business: updatedBusiness
    })

  } catch (error) {
    console.error('Error updating business status:', error)
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ businessId: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || session.user.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
    }

    const { businessId } = await params

    if (!businessId) {
      return NextResponse.json({ message: 'Business ID is required' }, { status: 400 })
    }

    // Get business status
    const business = await prisma.business.findUnique({
      where: { id: businessId },
      select: {
        id: true,
        name: true,
        isActive: true,
        updatedAt: true,
        createdAt: true
      }
    })

    if (!business) {
      return NextResponse.json({ message: 'Business not found' }, { status: 404 })
    }

    return NextResponse.json({
      business: {
        id: business.id,
        name: business.name,
        isActive: business.isActive,
        lastStatusUpdate: business.updatedAt,
        createdAt: business.createdAt
      }
    })

  } catch (error) {
    console.error('Error fetching business status:', error)
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    )
  }
}