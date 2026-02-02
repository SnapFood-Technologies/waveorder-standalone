// app/api/superadmin/team/[memberId]/businesses/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

// Get businesses assigned to a team member
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ memberId: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || session.user.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
    }

    const { memberId } = await params

    // Get assigned businesses
    const assignedBusinesses = await prisma.business.findMany({
      where: { accountManagerId: memberId },
      select: {
        id: true,
        name: true,
        slug: true,
        businessType: true,
        subscriptionPlan: true,
        subscriptionStatus: true,
        currency: true,
        createdAt: true,
        isActive: true,
        _count: {
          select: {
            orders: true,
            products: true
          }
        }
      },
      orderBy: { name: 'asc' }
    })

    // Get unassigned businesses (for assignment dropdown)
    const unassignedBusinesses = await prisma.business.findMany({
      where: { 
        accountManagerId: null,
        isActive: true
      },
      select: {
        id: true,
        name: true,
        slug: true,
        subscriptionPlan: true
      },
      orderBy: { name: 'asc' },
      take: 100
    })

    return NextResponse.json({
      assignedBusinesses,
      unassignedBusinesses,
      totalAssigned: assignedBusinesses.length
    })

  } catch (error) {
    console.error('Error fetching businesses:', error)
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    )
  }
}

// Assign businesses to a team member
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ memberId: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || session.user.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
    }

    const { memberId } = await params
    const { businessIds } = await request.json()

    if (!businessIds || !Array.isArray(businessIds)) {
      return NextResponse.json(
        { message: 'businessIds array is required' },
        { status: 400 }
      )
    }

    // Verify team member exists and is an Account Manager type
    const teamMember = await prisma.teamMember.findUnique({
      where: { id: memberId }
    })

    if (!teamMember) {
      return NextResponse.json({ message: 'Team member not found' }, { status: 404 })
    }

    // Update businesses to assign account manager
    const result = await prisma.business.updateMany({
      where: { id: { in: businessIds } },
      data: { accountManagerId: memberId }
    })

    // Update team member metrics
    const totalAssigned = await prisma.business.count({
      where: { accountManagerId: memberId }
    })

    return NextResponse.json({
      success: true,
      assignedCount: result.count,
      totalAssigned
    })

  } catch (error) {
    console.error('Error assigning businesses:', error)
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    )
  }
}

// Unassign a business from team member
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ memberId: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || session.user.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
    }

    const { memberId } = await params
    const { searchParams } = new URL(request.url)
    const businessId = searchParams.get('businessId')

    if (!businessId) {
      return NextResponse.json(
        { message: 'businessId is required' },
        { status: 400 }
      )
    }

    // Unassign business
    await prisma.business.update({
      where: { id: businessId },
      data: { accountManagerId: null }
    })

    return NextResponse.json({
      success: true,
      message: 'Business unassigned successfully'
    })

  } catch (error) {
    console.error('Error unassigning business:', error)
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    )
  }
}
