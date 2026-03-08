// src/app/api/admin/stores/[businessId]/cost-margins/supplier-payments/report/route.ts
// GET - Full supplier payments report data for PDF (all payments, no pagination)
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
      return NextResponse.json({ error: access.error }, { status: access.status })
    }

    const business = await prisma.business.findUnique({
      where: { id: businessId },
      select: {
        name: true,
        logo: true,
        address: true,
        phone: true,
        email: true,
        currency: true,
        showCostPrice: true
      }
    })

    if (!business) {
      return NextResponse.json({ error: 'Business not found' }, { status: 404 })
    }

    if (!business.showCostPrice) {
      return NextResponse.json(
        { error: 'Cost & Margins is not enabled for this business' },
        { status: 403 }
      )
    }

    const currency = business.currency || 'EUR'

    const [payments, supplierTotals] = await Promise.all([
      prisma.supplierPayment.findMany({
        where: { businessId },
        orderBy: [{ paidAt: 'desc' }, { createdAt: 'desc' }]
      }),
      prisma.supplierPayment.groupBy({
        by: ['supplierName'],
        where: { businessId },
        _sum: { amount: true },
        _count: true
      })
    ])

    const totalsBySupplier = supplierTotals
      .map((s) => ({
        supplierName: s.supplierName,
        totalPaid: s._sum.amount || 0,
        paymentCount: s._count
      }))
      .sort((a, b) => b.totalPaid - a.totalPaid)

    const grandTotal = supplierTotals.reduce((sum, s) => sum + (s._sum.amount || 0), 0)

    return NextResponse.json({
      business: {
        name: business.name,
        logo: business.logo,
        address: business.address,
        phone: business.phone,
        email: business.email,
        currency
      },
      grandTotal: Math.round(grandTotal * 100) / 100,
      totalsBySupplier: totalsBySupplier.map((t) => ({
        ...t,
        totalPaid: Math.round(t.totalPaid * 100) / 100
      })),
      payments: payments.map((p) => ({
        supplierName: p.supplierName,
        amount: p.amount,
        paidAt: p.paidAt?.toISOString() ?? null,
        paymentMethod: p.paymentMethod,
        reference: p.reference,
        notes: p.notes,
        periodStart: p.periodStart?.toISOString() ?? null,
        periodEnd: p.periodEnd?.toISOString() ?? null
      })),
      generatedAt: new Date().toISOString()
    })
  } catch (error) {
    console.error('Error fetching supplier payments report:', error)
    return NextResponse.json(
      { error: 'Failed to fetch supplier payments report' },
      { status: 500 }
    )
  }
}
