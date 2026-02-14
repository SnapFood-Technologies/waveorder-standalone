// src/app/api/superadmin/businesses/[businessId]/feature-flags/route.ts
// SuperAdmin API for managing feature flags (Manual Team Creation & Delivery Management)
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// GET - Fetch feature flags for a business
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

    // Fetch business with feature flags
    const business = await prisma.business.findUnique({
      where: { id: businessId },
      select: {
        id: true,
        name: true,
        enableManualTeamCreation: true,
        enableDeliveryManagement: true,
        legalPagesEnabled: true,
        currency: true
      }
    })

    if (!business) {
      return NextResponse.json({ error: 'Business not found' }, { status: 404 })
    }

    // Get summary data for delivery management if enabled
    let deliverySummary = null
    if (business.enableDeliveryManagement) {
      const [
        totalEarnings,
        pendingEarnings,
        totalPayments,
        deliveryPersonsCount
      ] = await Promise.all([
        prisma.deliveryEarning.aggregate({
          where: { businessId },
          _sum: { amount: true },
          _count: true
        }),
        prisma.deliveryEarning.aggregate({
          where: {
            businessId,
            status: 'PENDING'
          },
          _sum: { amount: true },
          _count: true
        }),
        prisma.deliveryPayment.aggregate({
          where: { businessId },
          _sum: { amount: true },
          _count: true
        }),
        prisma.businessUser.count({
          where: {
            businessId,
            role: 'DELIVERY'
          }
        })
      ])

      deliverySummary = {
        totalEarnings: totalEarnings._sum.amount || 0,
        totalEarningsCount: totalEarnings._count,
        pendingEarnings: pendingEarnings._sum.amount || 0,
        pendingEarningsCount: pendingEarnings._count,
        totalPayments: totalPayments._sum.amount || 0,
        totalPaymentsCount: totalPayments._count,
        deliveryPersonsCount
      }
    }

    // Get summary for manual team creation
    let teamSummary = null
    if (business.enableManualTeamCreation) {
      const teamMembersCount = await prisma.businessUser.count({
        where: {
          businessId,
          role: { not: 'OWNER' }
        }
      })

      teamSummary = {
        totalTeamMembers: teamMembersCount
      }
    }

    return NextResponse.json({
      success: true,
      business: {
        id: business.id,
        name: business.name,
        currency: business.currency
      },
      settings: {
        enableManualTeamCreation: business.enableManualTeamCreation,
        enableDeliveryManagement: business.enableDeliveryManagement,
        legalPagesEnabled: business.legalPagesEnabled
      },
      summary: {
        delivery: deliverySummary,
        team: teamSummary
      }
    })
  } catch (error) {
    console.error('Error fetching feature flags:', error)
    return NextResponse.json(
      { error: 'Failed to fetch feature flags' },
      { status: 500 }
    )
  }
}

// PATCH - Update feature flags for a business
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

    const { enableManualTeamCreation, enableDeliveryManagement, legalPagesEnabled } = body

    // Validate business exists
    const business = await prisma.business.findUnique({
      where: { id: businessId }
    })

    if (!business) {
      return NextResponse.json({ error: 'Business not found' }, { status: 404 })
    }

    // Build update data
    const updateData: any = {}
    if (enableManualTeamCreation !== undefined) {
      updateData.enableManualTeamCreation = enableManualTeamCreation === true
    }
    if (enableDeliveryManagement !== undefined) {
      updateData.enableDeliveryManagement = enableDeliveryManagement === true
    }
    if (legalPagesEnabled !== undefined) {
      updateData.legalPagesEnabled = legalPagesEnabled === true
    }

    // Update business
    const updatedBusiness = await prisma.business.update({
      where: { id: businessId },
      data: updateData,
      select: {
        id: true,
        name: true,
        enableManualTeamCreation: true,
        enableDeliveryManagement: true,
        legalPagesEnabled: true
      }
    })

    const messages = []
    if (enableManualTeamCreation !== undefined) {
      messages.push(`Manual Team Creation ${updatedBusiness.enableManualTeamCreation ? 'enabled' : 'disabled'}`)
    }
    if (enableDeliveryManagement !== undefined) {
      messages.push(`Delivery Management ${updatedBusiness.enableDeliveryManagement ? 'enabled' : 'disabled'}`)
    }
    if (legalPagesEnabled !== undefined) {
      messages.push(`Legal Pages ${updatedBusiness.legalPagesEnabled ? 'enabled' : 'disabled'}`)
    }

    return NextResponse.json({
      success: true,
      message: messages.join(' and ') + ` for ${updatedBusiness.name}`,
      settings: {
        enableManualTeamCreation: updatedBusiness.enableManualTeamCreation,
        enableDeliveryManagement: updatedBusiness.enableDeliveryManagement,
        legalPagesEnabled: updatedBusiness.legalPagesEnabled
      }
    })
  } catch (error) {
    console.error('Error updating feature flags:', error)
    return NextResponse.json(
      { error: 'Failed to update feature flags' },
      { status: 500 }
    )
  }
}
