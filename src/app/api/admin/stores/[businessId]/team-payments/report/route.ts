// src/app/api/admin/stores/[businessId]/team-payments/report/route.ts
// GET - Full team payments report data for PDF (all payments, no pagination)
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
        enableTeamPaymentTracking: true
      }
    })

    if (!business) {
      return NextResponse.json({ error: 'Business not found' }, { status: 404 })
    }

    if (!business.enableTeamPaymentTracking) {
      return NextResponse.json(
        { error: 'Team payment tracking is not enabled for this business' },
        { status: 403 }
      )
    }

    const currency = business.currency || 'EUR'

    const [payments, totalsByMember] = await Promise.all([
      prisma.teamMemberPayment.findMany({
        where: { businessId },
        include: { user: { select: { name: true, email: true } } },
        orderBy: [{ paidAt: 'desc' }, { createdAt: 'desc' }]
      }),
      prisma.teamMemberPayment.groupBy({
        by: ['userId'],
        where: { businessId },
        _sum: { amount: true },
        _count: true
      })
    ])

    const userIds = [...new Set(totalsByMember.map((t) => t.userId))]
    const users = await prisma.user.findMany({
      where: { id: { in: userIds } },
      select: { id: true, name: true, email: true }
    })
    const userMap = new Map(users.map((u) => [u.id, u]))

    const totalsByMemberWithNames = totalsByMember.map((t) => ({
      userId: t.userId,
      userName: userMap.get(t.userId)?.name || 'Unknown',
      userEmail: userMap.get(t.userId)?.email || null,
      totalPaid: t._sum.amount || 0,
      paymentCount: t._count
    }))

    const grandTotal = totalsByMember.reduce((sum, t) => sum + (t._sum.amount || 0), 0)

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
      totalsByMember: totalsByMemberWithNames.map((t) => ({
        ...t,
        totalPaid: Math.round(t.totalPaid * 100) / 100
      })),
      payments: payments.map((p) => ({
        recipientName: p.user?.name || 'Unknown',
        recipientEmail: p.user?.email || null,
        amount: p.amount,
        paidAt: p.paidAt?.toISOString() ?? null,
        paymentMethod: p.paymentMethod,
        paidFrom: p.paidFrom,
        notes: p.notes
      })),
      generatedAt: new Date().toISOString()
    })
  } catch (error) {
    console.error('Error fetching team payments report:', error)
    return NextResponse.json(
      { error: 'Failed to fetch team payments report' },
      { status: 500 }
    )
  }
}
