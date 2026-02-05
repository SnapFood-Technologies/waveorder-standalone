// src/app/api/admin/stores/[businessId]/cost-margins/supplier-payments/route.ts
// Supplier Payments API - List and create supplier payments
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

    // Check if cost price feature is enabled
    const business = await prisma.business.findUnique({
      where: { id: businessId },
      select: { showCostPrice: true, currency: true }
    })

    if (!business?.showCostPrice) {
      return NextResponse.json({
        enabled: false,
        message: 'Cost & Margins is not enabled for this business.'
      })
    }

    const { searchParams } = new URL(request.url)
    const supplierName = searchParams.get('supplier')
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')

    // Build filters
    const where: any = { businessId }
    
    if (supplierName) {
      where.supplierName = { contains: supplierName, mode: 'insensitive' }
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
      prisma.supplierPayment.findMany({
        where,
        orderBy: { paidAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit
      }),
      prisma.supplierPayment.count({ where })
    ])

    // Get totals by supplier
    const supplierTotals = await prisma.supplierPayment.groupBy({
      by: ['supplierName'],
      where: { businessId },
      _sum: { amount: true },
      _count: true
    })

    const totalsBySupplier = supplierTotals.map(s => ({
      supplierName: s.supplierName,
      totalPaid: s._sum.amount || 0,
      paymentCount: s._count
    })).sort((a, b) => b.totalPaid - a.totalPaid)

    // Get grand total
    const grandTotal = await prisma.supplierPayment.aggregate({
      where: { businessId },
      _sum: { amount: true }
    })

    return NextResponse.json({
      enabled: true,
      currency: business.currency || 'EUR',
      data: {
        payments,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit)
        },
        totalsBySupplier,
        grandTotal: grandTotal._sum.amount || 0
      }
    })

  } catch (error) {
    console.error('Error fetching supplier payments:', error)
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

    // Check if cost price feature is enabled
    const business = await prisma.business.findUnique({
      where: { id: businessId },
      select: { showCostPrice: true, currency: true }
    })

    if (!business?.showCostPrice) {
      return NextResponse.json({
        enabled: false,
        message: 'Cost & Margins is not enabled for this business.'
      }, { status: 403 })
    }

    const body = await request.json()
    const {
      supplierName,
      amount,
      currency,
      periodStart,
      periodEnd,
      paymentMethod,
      reference,
      notes,
      paidAt
    } = body

    // Validate required fields
    if (!supplierName || typeof supplierName !== 'string' || !supplierName.trim()) {
      return NextResponse.json({ message: 'Supplier name is required' }, { status: 400 })
    }

    if (!amount || typeof amount !== 'number' || amount <= 0) {
      return NextResponse.json({ message: 'Valid amount is required' }, { status: 400 })
    }

    // Create payment record
    const payment = await prisma.supplierPayment.create({
      data: {
        businessId,
        supplierName: supplierName.trim(),
        amount,
        currency: currency || business.currency || 'EUR',
        periodStart: periodStart ? new Date(periodStart) : null,
        periodEnd: periodEnd ? new Date(periodEnd) : null,
        paymentMethod: paymentMethod || null,
        reference: reference || null,
        notes: notes || null,
        paidAt: paidAt ? new Date(paidAt) : new Date()
      }
    })

    return NextResponse.json({
      success: true,
      message: 'Payment recorded successfully',
      payment
    })

  } catch (error) {
    console.error('Error creating supplier payment:', error)
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    )
  }
}
