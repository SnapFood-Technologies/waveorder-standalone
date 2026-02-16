// src/app/api/admin/stores/[businessId]/affiliates/[affiliateId]/route.ts
// Affiliate API - Get, update, delete single affiliate
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { checkBusinessAccess } from '@/lib/api-helpers'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ businessId: string; affiliateId: string }> }
) {
  try {
    const { businessId, affiliateId } = await params

    const access = await checkBusinessAccess(businessId)
    
    if (!access.authorized) {
      return NextResponse.json({ message: access.error }, { status: access.status })
    }

    const affiliate = await prisma.affiliate.findFirst({
      where: {
        id: affiliateId,
        businessId
      },
      include: {
        _count: {
          select: {
            earnings: true,
            orders: true
          }
        }
      }
    })

    if (!affiliate) {
      return NextResponse.json({ message: 'Affiliate not found' }, { status: 404 })
    }

    // Calculate unpaid balance
    const pendingEarnings = await prisma.affiliateEarning.aggregate({
      where: {
        affiliateId: affiliate.id,
        status: 'PENDING'
      },
      _sum: {
        amount: true
      }
    })

    return NextResponse.json({
      affiliate: {
        ...affiliate,
        pendingBalance: pendingEarnings._sum.amount || 0
      }
    })

  } catch (error) {
    console.error('Error fetching affiliate:', error)
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ businessId: string; affiliateId: string }> }
) {
  try {
    const { businessId, affiliateId } = await params

    const access = await checkBusinessAccess(businessId)
    
    if (!access.authorized) {
      return NextResponse.json({ message: access.error }, { status: access.status })
    }

    const body = await request.json()
    const {
      name,
      email,
      phone,
      notes,
      commissionType,
      commissionValue,
      trackingCode,
      isActive
    } = body

    // Verify affiliate exists and belongs to business
    const existing = await prisma.affiliate.findFirst({
      where: {
        id: affiliateId,
        businessId
      }
    })

    if (!existing) {
      return NextResponse.json({ message: 'Affiliate not found' }, { status: 404 })
    }

    // Validate commission if provided
    if (commissionType && !['PERCENTAGE', 'FIXED'].includes(commissionType)) {
      return NextResponse.json({ message: 'Invalid commission type' }, { status: 400 })
    }

    if (commissionValue !== undefined && (typeof commissionValue !== 'number' || commissionValue <= 0)) {
      return NextResponse.json({ message: 'Valid commission value is required' }, { status: 400 })
    }

    if (commissionType === 'PERCENTAGE' && commissionValue > 100) {
      return NextResponse.json({ message: 'Percentage commission cannot exceed 100%' }, { status: 400 })
    }

    // Check tracking code uniqueness if changed
    if (trackingCode && trackingCode !== existing.trackingCode) {
      const codeExists = await prisma.affiliate.findFirst({
        where: {
          businessId,
          trackingCode: trackingCode.trim(),
          id: { not: affiliateId }
        }
      })

      if (codeExists) {
        return NextResponse.json({ 
          message: `Tracking code "${trackingCode}" already exists` 
        }, { status: 400 })
      }
    }

    // Update affiliate
    const affiliate = await prisma.affiliate.update({
      where: { id: affiliateId },
      data: {
        ...(name !== undefined && { name: name.trim() }),
        ...(email !== undefined && { email: email?.trim() || null }),
        ...(phone !== undefined && { phone: phone?.trim() || null }),
        ...(notes !== undefined && { notes: notes?.trim() || null }),
        ...(commissionType && { commissionType }),
        ...(commissionValue !== undefined && { commissionValue }),
        ...(trackingCode && { trackingCode: trackingCode.trim() }),
        ...(isActive !== undefined && { isActive })
      }
    })

    return NextResponse.json({
      success: true,
      message: 'Affiliate updated successfully',
      affiliate
    })

  } catch (error) {
    console.error('Error updating affiliate:', error)
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ businessId: string; affiliateId: string }> }
) {
  try {
    const { businessId, affiliateId } = await params

    const access = await checkBusinessAccess(businessId)
    
    if (!access.authorized) {
      return NextResponse.json({ message: access.error }, { status: access.status })
    }

    // Verify affiliate exists and belongs to business
    const affiliate = await prisma.affiliate.findFirst({
      where: {
        id: affiliateId,
        businessId
      }
    })

    if (!affiliate) {
      return NextResponse.json({ message: 'Affiliate not found' }, { status: 404 })
    }

    // Check if affiliate has pending earnings
    const pendingEarnings = await prisma.affiliateEarning.count({
      where: {
        affiliateId,
        status: 'PENDING'
      }
    })

    if (pendingEarnings > 0) {
      return NextResponse.json({ 
        message: `Cannot delete affiliate with ${pendingEarnings} pending earnings. Please pay or cancel earnings first.` 
      }, { status: 400 })
    }

    // Delete affiliate (cascade will handle earnings and payments)
    await prisma.affiliate.delete({
      where: { id: affiliateId }
    })

    return NextResponse.json({
      success: true,
      message: 'Affiliate deleted successfully'
    })

  } catch (error) {
    console.error('Error deleting affiliate:', error)
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    )
  }
}
