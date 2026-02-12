// src/app/api/admin/stores/[businessId]/delivery/payments/route.ts
// Delivery Payments API - List and create payments to delivery persons
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

    // Check if delivery management is enabled for this business
    const business = await prisma.business.findUnique({
      where: { id: businessId },
      select: { enableDeliveryManagement: true, currency: true }
    })

    if (!business?.enableDeliveryManagement) {
      return NextResponse.json({ 
        enabled: false,
        message: 'Delivery management is not enabled for this business. Please contact support to enable this feature.'
      }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const deliveryPersonId = searchParams.get('deliveryPersonId')
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')

    // Build filters
    const where: any = { businessId }
    
    if (deliveryPersonId) {
      where.deliveryPersonId = deliveryPersonId
    }
    
    if (startDate || endDate) {
      where.paidAt = {}
      if (startDate) {
        where.paidAt.gte = new Date(startDate)
      }
      if (endDate) {
        where.paidAt.lte = new Date(endDate)
      }
    }

    // Fetch payments with pagination
    const [payments, total] = await Promise.all([
      prisma.deliveryPayment.findMany({
        where,
        include: {
          deliveryPerson: {
            select: {
              id: true,
              name: true,
              email: true
            }
          }
        },
        orderBy: { paidAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit
      }),
      prisma.deliveryPayment.count({ where })
    ])

    // Get totals by delivery person
    const personTotals = await prisma.deliveryPayment.groupBy({
      by: ['deliveryPersonId'],
      where: { businessId },
      _sum: { amount: true },
      _count: true
    })

    // Get delivery person details
    const personIds = personTotals.map(p => p.deliveryPersonId)
    const deliveryPersons = await prisma.user.findMany({
      where: {
        id: { in: personIds }
      },
      select: {
        id: true,
        name: true,
        email: true
      }
    })

    const totalsByPerson = personTotals.map(pt => {
      const person = deliveryPersons.find(p => p.id === pt.deliveryPersonId)
      return {
        deliveryPersonId: pt.deliveryPersonId,
        deliveryPersonName: person?.name || 'Unknown',
        deliveryPersonEmail: person?.email || '',
        totalPaid: pt._sum.amount || 0,
        paymentCount: pt._count
      }
    }).sort((a, b) => b.totalPaid - a.totalPaid)

    // Get grand total
    const grandTotal = await prisma.deliveryPayment.aggregate({
      where: { businessId },
      _sum: { amount: true },
      _count: true
    })

    return NextResponse.json({
      success: true,
      currency: business?.currency || 'EUR',
      data: {
        payments,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit)
        },
        totalsByPerson,
        grandTotal: grandTotal._sum.amount || 0
      }
    })

  } catch (error) {
    console.error('Error fetching delivery payments:', error)
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

    // Check if delivery management is enabled for this business
    const business = await prisma.business.findUnique({
      where: { id: businessId },
      select: { enableDeliveryManagement: true }
    })

    if (!business?.enableDeliveryManagement) {
      return NextResponse.json({ 
        enabled: false,
        message: 'Delivery management is not enabled for this business. Please contact support to enable this feature.'
      }, { status: 403 })
    }

    const body = await request.json()
    const {
      deliveryPersonId,
      amount,
      currency,
      periodStart,
      periodEnd,
      paymentMethod,
      reference,
      notes,
      paidAt,
      earningsIds // Array of DeliveryEarning IDs to mark as paid
    } = body

    // Validate required fields
    if (!deliveryPersonId || typeof deliveryPersonId !== 'string') {
      return NextResponse.json({ message: 'Delivery person ID is required' }, { status: 400 })
    }

    if (!amount || typeof amount !== 'number' || amount <= 0) {
      return NextResponse.json({ message: 'Valid amount is required' }, { status: 400 })
    }

    // Verify delivery person exists and belongs to this business
    const deliveryPerson = await prisma.businessUser.findFirst({
      where: {
        userId: deliveryPersonId,
        businessId,
        role: 'DELIVERY'
      }
    })

    if (!deliveryPerson) {
      return NextResponse.json({ 
        message: 'Delivery person not found or does not belong to this business' 
      }, { status: 400 })
    }

    // Validate earnings IDs if provided
    if (earningsIds && Array.isArray(earningsIds) && earningsIds.length > 0) {
      const validEarnings = await prisma.deliveryEarning.findMany({
        where: {
          id: { in: earningsIds },
          businessId,
          deliveryPersonId,
          status: 'PENDING'
        }
      })

      if (validEarnings.length !== earningsIds.length) {
        return NextResponse.json({ 
          message: 'Some earnings IDs are invalid or already paid' 
        }, { status: 400 })
      }
    }

    // Create payment record
    const payment = await prisma.deliveryPayment.create({
      data: {
        businessId,
        deliveryPersonId,
        amount,
        currency: currency || 'EUR',
        periodStart: periodStart ? new Date(periodStart) : null,
        periodEnd: periodEnd ? new Date(periodEnd) : null,
        paymentMethod: paymentMethod || null,
        reference: reference || null,
        notes: notes || null,
        earningsIds: earningsIds || [],
        paidAt: paidAt ? new Date(paidAt) : new Date()
      }
    })

    // Mark earnings as paid if provided
    if (earningsIds && Array.isArray(earningsIds) && earningsIds.length > 0) {
      await prisma.deliveryEarning.updateMany({
        where: {
          id: { in: earningsIds }
        },
        data: {
          status: 'PAID'
        }
      })
    }

    return NextResponse.json({
      success: true,
      message: 'Payment recorded successfully',
      payment
    })

  } catch (error) {
    console.error('Error creating delivery payment:', error)
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    )
  }
}
