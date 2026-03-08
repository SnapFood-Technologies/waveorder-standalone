// src/app/api/admin/stores/[businessId]/affiliates/payments/report/route.ts
// GET - Full affiliate payments report data for PDF (all payments, no pagination)
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
        enableAffiliateSystem: true
      }
    })

    if (!business) {
      return NextResponse.json({ error: 'Business not found' }, { status: 404 })
    }

    if (!business.enableAffiliateSystem) {
      return NextResponse.json(
        { error: 'Affiliate system is not enabled for this business' },
        { status: 403 }
      )
    }

    const currency = business.currency || 'EUR'

    const [payments, affiliateTotals] = await Promise.all([
      prisma.affiliatePayment.findMany({
        where: { businessId },
        include: { affiliate: { select: { name: true, email: true } } },
        orderBy: [{ paidAt: 'desc' }, { createdAt: 'desc' }]
      }),
      prisma.affiliatePayment.groupBy({
        by: ['affiliateId'],
        where: { businessId },
        _sum: { amount: true },
        _count: true
      })
    ])

    const affiliateIds = [...new Set(affiliateTotals.map((t) => t.affiliateId))]
    const affiliates = await prisma.affiliate.findMany({
      where: { id: { in: affiliateIds } },
      select: { id: true, name: true, email: true }
    })
    const affiliateMap = new Map(affiliates.map((a) => [a.id, a]))

    const totalsByAffiliate = affiliateTotals
      .map((t) => ({
        affiliateName: affiliateMap.get(t.affiliateId)?.name || 'Unknown',
        affiliateEmail: affiliateMap.get(t.affiliateId)?.email || null,
        totalPaid: t._sum.amount || 0,
        paymentCount: t._count
      }))
      .sort((a, b) => b.totalPaid - a.totalPaid)

    const grandTotal = affiliateTotals.reduce((sum, t) => sum + (t._sum.amount || 0), 0)

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
      totalsByAffiliate: totalsByAffiliate.map((t) => ({
        ...t,
        totalPaid: Math.round(t.totalPaid * 100) / 100
      })),
      payments: payments.map((p) => ({
        affiliateName: p.affiliate?.name || 'Unknown',
        affiliateEmail: p.affiliate?.email || null,
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
    console.error('Error fetching affiliate payments report:', error)
    return NextResponse.json(
      { error: 'Failed to fetch affiliate payments report' },
      { status: 500 }
    )
  }
}
