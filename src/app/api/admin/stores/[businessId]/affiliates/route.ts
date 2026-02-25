// src/app/api/admin/stores/[businessId]/affiliates/route.ts
// Affiliates API - List and create affiliates
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

    // Check if affiliate system is enabled for this business
    const business = await prisma.business.findUnique({
      where: { id: businessId },
      select: { enableAffiliateSystem: true, currency: true }
    })

    if (!business?.enableAffiliateSystem) {
      return NextResponse.json({
        enabled: false,
        message: 'Affiliate system is not enabled for this business. Please contact support to enable this feature.'
      })
    }

    const affiliates = await prisma.affiliate.findMany({
      where: { businessId },
      orderBy: { createdAt: 'desc' },
      include: {
        _count: {
          select: {
            earnings: true,
            orders: true
          }
        }
      }
    })

    // Calculate balance and analytics for each affiliate
    const affiliatesWithBalance = await Promise.all(
      affiliates.map(async (affiliate) => {
        const [pendingEarnings, totalEarningsResult, viewsCount] = await Promise.all([
          prisma.affiliateEarning.aggregate({
            where: {
              affiliateId: affiliate.id,
              status: 'PENDING'
            },
            _sum: { amount: true }
          }),
          prisma.affiliateEarning.aggregate({
            where: { affiliateId: affiliate.id },
            _sum: { amount: true }
          }),
          prisma.visitorSession.count({
            where: {
              businessId,
              campaign: affiliate.trackingCode
            }
          })
        ])

        const totalOrders = affiliate._count.orders
        const views = viewsCount
        const conversionRate = views > 0 && totalOrders > 0
          ? Math.round((totalOrders / views) * 1000) / 10
          : 0

        return {
          id: affiliate.id,
          name: affiliate.name,
          email: affiliate.email,
          phone: affiliate.phone,
          notes: affiliate.notes,
          commissionType: affiliate.commissionType,
          commissionValue: affiliate.commissionValue,
          trackingCode: affiliate.trackingCode,
          isActive: affiliate.isActive,
          createdAt: affiliate.createdAt,
          updatedAt: affiliate.updatedAt,
          totalEarnings: totalEarningsResult._sum.amount || 0,
          totalOrders,
          pendingBalance: pendingEarnings._sum.amount || 0,
          views,
          conversionRate
        }
      })
    )

    return NextResponse.json({
      enabled: true,
      currency: business.currency || 'EUR',
      data: {
        affiliates: affiliatesWithBalance
      }
    })

  } catch (error) {
    console.error('Error fetching affiliates:', error)
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ businessId: string }> }
) {
  try {
    const { businessId } = await params

    const access = await checkBusinessAccess(businessId)
    
    if (!access.authorized) {
      return NextResponse.json({ message: access.error }, { status: access.status })
    }

    // Check if affiliate system is enabled
    const business = await prisma.business.findUnique({
      where: { id: businessId },
      select: { enableAffiliateSystem: true }
    })

    if (!business?.enableAffiliateSystem) {
      return NextResponse.json({
        enabled: false,
        message: 'Affiliate system is not enabled for this business.'
      }, { status: 403 })
    }

    const body = await request.json()
    const {
      name,
      email,
      phone,
      notes,
      commissionType,
      commissionValue,
      trackingCode
    } = body

    // Validate required fields
    if (!name || typeof name !== 'string' || !name.trim()) {
      return NextResponse.json({ message: 'Affiliate name is required' }, { status: 400 })
    }

    if (!commissionType || !['PERCENTAGE', 'FIXED'].includes(commissionType)) {
      return NextResponse.json({ message: 'Valid commission type is required (PERCENTAGE or FIXED)' }, { status: 400 })
    }

    if (!commissionValue || typeof commissionValue !== 'number' || commissionValue <= 0) {
      return NextResponse.json({ message: 'Valid commission value is required' }, { status: 400 })
    }

    // Validate commission value ranges
    if (commissionType === 'PERCENTAGE' && commissionValue > 100) {
      return NextResponse.json({ message: 'Percentage commission cannot exceed 100%' }, { status: 400 })
    }

    // Generate tracking code if not provided
    let finalTrackingCode = trackingCode?.trim()
    if (!finalTrackingCode) {
      // Find the highest existing tracking code number
      const existingAffiliates = await prisma.affiliate.findMany({
        where: { businessId },
        select: { trackingCode: true }
      })
      
      const trackingCodeNumbers = existingAffiliates
        .map(a => {
          const match = a.trackingCode.match(/^AFF(\d+)$/)
          return match ? parseInt(match[1]) : 0
        })
        .filter(n => n > 0)
      
      const nextNumber = trackingCodeNumbers.length > 0 
        ? Math.max(...trackingCodeNumbers) + 1 
        : 1
      
      finalTrackingCode = `AFF${nextNumber.toString().padStart(3, '0')}`
    }

    // Check if tracking code already exists for this business
    const existing = await prisma.affiliate.findFirst({
      where: {
        businessId,
        trackingCode: finalTrackingCode
      }
    })

    if (existing) {
      return NextResponse.json({ 
        message: `Tracking code "${finalTrackingCode}" already exists for this business` 
      }, { status: 400 })
    }

    // Create affiliate
    const affiliate = await prisma.affiliate.create({
      data: {
        businessId,
        name: name.trim(),
        email: email?.trim() || null,
        phone: phone?.trim() || null,
        notes: notes?.trim() || null,
        commissionType,
        commissionValue,
        trackingCode: finalTrackingCode,
        isActive: true
      }
    })

    return NextResponse.json({
      success: true,
      message: 'Affiliate created successfully',
      affiliate
    })

  } catch (error) {
    console.error('Error creating affiliate:', error)
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    )
  }
}
