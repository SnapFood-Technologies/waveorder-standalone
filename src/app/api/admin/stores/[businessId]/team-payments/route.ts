// src/app/api/admin/stores/[businessId]/team-payments/route.ts
// Team Member Payments API - List and create internal team payments
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { checkBusinessAccess } from '@/lib/api-helpers'

const PAYMENT_METHODS = ['CASH', 'BANK', 'PAYPAL', 'OTHER'] as const

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

    const business = await prisma.business.findUnique({
      where: { id: businessId },
      select: { enableTeamPaymentTracking: true, currency: true }
    })

    if (!business?.enableTeamPaymentTracking) {
      return NextResponse.json({
        enabled: false,
        message: 'Team payment tracking is not enabled for this business.'
      }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')

    const where: { businessId: string; userId?: string; paidAt?: { gte?: Date; lte?: Date } } = { businessId }
    if (userId) where.userId = userId
    if (startDate || endDate) {
      where.paidAt = {}
      if (startDate) where.paidAt.gte = new Date(startDate)
      if (endDate) where.paidAt.lte = new Date(endDate)
    }

    const [payments, total] = await Promise.all([
      prisma.teamMemberPayment.findMany({
        where,
        include: {
          user: { select: { id: true, name: true, email: true } },
          recordedBy: { select: { id: true, name: true, email: true } }
        },
        orderBy: { paidAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit
      }),
      prisma.teamMemberPayment.count({ where })
    ])

    const totalsByMember = await prisma.teamMemberPayment.groupBy({
      by: ['userId'],
      where: { businessId },
      _sum: { amount: true },
      _count: true
    })

    const userIds = [...new Set(totalsByMember.map(t => t.userId))]
    const users = await prisma.user.findMany({
      where: { id: { in: userIds } },
      select: { id: true, name: true, email: true }
    })
    const userMap = new Map(users.map(u => [u.id, u]))

    const totalsByMemberWithNames = totalsByMember.map(t => ({
      userId: t.userId,
      userName: userMap.get(t.userId)?.name || 'Unknown',
      userEmail: userMap.get(t.userId)?.email || null,
      totalPaid: t._sum.amount || 0,
      paymentCount: t._count
    }))

    const grandTotal = totalsByMember.reduce((sum, t) => sum + (t._sum.amount || 0), 0)

    return NextResponse.json({
      enabled: true,
      currency: business.currency || 'EUR',
      data: {
        payments,
        totalsByMember: totalsByMemberWithNames,
        grandTotal,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit) || 1
        }
      }
    })
  } catch (error) {
    console.error('Error fetching team payments:', error)
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

    const business = await prisma.business.findUnique({
      where: { id: businessId },
      select: { enableTeamPaymentTracking: true, currency: true }
    })

    if (!business?.enableTeamPaymentTracking) {
      return NextResponse.json({
        enabled: false,
        message: 'Team payment tracking is not enabled for this business.'
      }, { status: 403 })
    }

    const body = await request.json()
    const { userId, amount, currency, paidFrom, paidAt, notes, paymentMethod } = body

    if (!userId || typeof userId !== 'string') {
      return NextResponse.json({ message: 'User ID (recipient) is required' }, { status: 400 })
    }
    if (!amount || typeof amount !== 'number' || amount <= 0) {
      return NextResponse.json({ message: 'Valid amount is required' }, { status: 400 })
    }
    if (!paymentMethod || !PAYMENT_METHODS.includes(paymentMethod)) {
      return NextResponse.json({ message: `paymentMethod must be one of: ${PAYMENT_METHODS.join(', ')}` }, { status: 400 })
    }

    const teamMember = await prisma.businessUser.findFirst({
      where: { businessId, userId }
    })
    if (!teamMember) {
      return NextResponse.json({ message: 'User is not a team member of this business' }, { status: 400 })
    }

    const session = access.session
    const recordedById = session?.user?.id || null

    const payment = await prisma.teamMemberPayment.create({
      data: {
        businessId,
        userId,
        amount,
        currency: currency || business.currency || 'EUR',
        paidFrom: paidFrom || null,
        paidAt: paidAt ? new Date(paidAt) : new Date(),
        notes: notes || null,
        paymentMethod,
        recordedById
      },
      include: {
        user: { select: { id: true, name: true, email: true } },
        recordedBy: { select: { id: true, name: true } }
      }
    })

    return NextResponse.json({
      success: true,
      message: 'Payment recorded successfully',
      payment
    })
  } catch (error) {
    console.error('Error creating team payment:', error)
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    )
  }
}
