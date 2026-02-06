import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// GET - Fetch production planning settings for a business
export async function GET(
  request: Request,
  { params }: { params: Promise<{ businessId: string }> }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if user is superadmin
    const user = await prisma.user.findUnique({
      where: { email: session.user.email }
    })

    if (!user || user.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Forbidden - SuperAdmin access required' }, { status: 403 })
    }

    const { businessId } = await params

    // Fetch business with production planning settings
    const business = await prisma.business.findUnique({
      where: { id: businessId },
      select: {
        id: true,
        name: true,
        showProductionPlanning: true
      }
    })

    if (!business) {
      return NextResponse.json({ error: 'Business not found' }, { status: 404 })
    }

    return NextResponse.json({
      success: true,
      business: {
        id: business.id,
        name: business.name
      },
      settings: {
        showProductionPlanning: business.showProductionPlanning
      }
    })
  } catch (error) {
    console.error('Error fetching production planning settings:', error)
    return NextResponse.json(
      { error: 'Failed to fetch production planning settings' },
      { status: 500 }
    )
  }
}

// PATCH - Update production planning settings for a business
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ businessId: string }> }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if user is superadmin
    const user = await prisma.user.findUnique({
      where: { email: session.user.email }
    })

    if (!user || user.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Forbidden - SuperAdmin access required' }, { status: 403 })
    }

    const { businessId } = await params
    const body = await request.json()

    const { showProductionPlanning } = body

    // Validate business exists
    const business = await prisma.business.findUnique({
      where: { id: businessId }
    })

    if (!business) {
      return NextResponse.json({ error: 'Business not found' }, { status: 404 })
    }

    // Update business
    const updatedBusiness = await prisma.business.update({
      where: { id: businessId },
      data: {
        showProductionPlanning: showProductionPlanning === true
      },
      select: {
        id: true,
        name: true,
        showProductionPlanning: true
      }
    })

    return NextResponse.json({
      success: true,
      message: `Production Planning ${updatedBusiness.showProductionPlanning ? 'enabled' : 'disabled'} for ${updatedBusiness.name}`,
      settings: {
        showProductionPlanning: updatedBusiness.showProductionPlanning
      }
    })
  } catch (error) {
    console.error('Error updating production planning settings:', error)
    return NextResponse.json(
      { error: 'Failed to update production planning settings' },
      { status: 500 }
    )
  }
}
