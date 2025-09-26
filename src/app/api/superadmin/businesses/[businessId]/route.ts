// app/api/superadmin/businesses/[businessId]/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { PrismaClient } from '@prisma/client'
import { authOptions } from '@/lib/auth'

const prisma = new PrismaClient()

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ businessId: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || session.user.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
    }

    const { businessId } = await params
    const data = await request.json()

    const business = await prisma.business.update({
      where: { id: businessId },
      data: {
        name: data.name,
        businessType: data.businessType,
        subscriptionPlan: data.subscriptionPlan,
        isActive: data.isActive,
        whatsappNumber: data.whatsappNumber
      }
    })

    return NextResponse.json({ success: true, business })

  } catch (error) {
    console.error('Error updating business:', error)
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ businessId: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || session.user.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
    }

    const { businessId } = await params

    // Delete business (this will cascade delete related records)
    await prisma.business.delete({
      where: { id: businessId }
    })

    return NextResponse.json({ success: true })

  } catch (error) {
    console.error('Error deleting business:', error)
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    )
  }
}