// src/app/api/admin/stores/[businessId]/internal-expenses/route.ts
// Internal Expenses API - List and create expenses (when internalExpensesEnabled)
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
      select: { internalExpensesEnabled: true, currency: true }
    })
    if (!business || !business.internalExpensesEnabled) {
      return NextResponse.json(
        { enabled: false, message: 'Internal Expenses is not enabled for this business. Contact support to enable this feature.' },
        { status: 403 }
      )
    }

    const { searchParams } = new URL(request.url)
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10))
    const limit = Math.min(50, Math.max(1, parseInt(searchParams.get('limit') || '20', 10)))
    const skip = (page - 1) * limit
    const category = searchParams.get('category') || undefined

    const where = { businessId } as { businessId: string; category?: string }
    if (category) {
      where.category = category
    }

    const [expenses, total, stats] = await Promise.all([
      prisma.internalExpense.findMany({
        where,
        orderBy: [{ date: 'desc' }, { createdAt: 'desc' }],
        skip,
        take: limit,
        select: {
          id: true,
          amount: true,
          date: true,
          category: true,
          notes: true,
          createdAt: true,
          updatedAt: true
        }
      }),
      prisma.internalExpense.count({ where }),
      prisma.internalExpense.aggregate({
        where: { businessId },
        _sum: { amount: true },
        _count: true
      })
    ])

    // Stats by category
    const byCategory = await prisma.internalExpense.groupBy({
      by: ['category'],
      where: { businessId },
      _sum: { amount: true },
      _count: true
    })

    return NextResponse.json({
      enabled: true,
      currency: business.currency || 'EUR',
      data: {
        expenses: expenses.map((e) => ({
          id: e.id,
          amount: e.amount,
          date: e.date?.toISOString() ?? null,
          category: e.category,
          notes: e.notes,
          createdAt: e.createdAt.toISOString(),
          updatedAt: e.updatedAt.toISOString()
        })),
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit)
        },
        stats: {
          totalAmount: stats._sum.amount ?? 0,
          totalCount: stats._count,
          byCategory: byCategory.map((c) => ({
            category: c.category,
            total: c._sum.amount ?? 0,
            count: c._count
          }))
        }
      }
    })
  } catch (error) {
    console.error('Error fetching internal expenses:', error)
    return NextResponse.json(
      { error: 'Failed to fetch internal expenses' },
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
      return NextResponse.json({ error: access.error }, { status: access.status })
    }

    const business = await prisma.business.findUnique({
      where: { id: businessId },
      select: { internalExpensesEnabled: true }
    })
    if (!business?.internalExpensesEnabled) {
      return NextResponse.json(
        { error: 'Internal Expenses is not enabled for this business.' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const { amount, date, category, notes } = body

    if (amount === undefined || amount === null) {
      return NextResponse.json({ error: 'Amount is required' }, { status: 400 })
    }
    const amountNum = parseFloat(amount)
    if (isNaN(amountNum) || amountNum < 0) {
      return NextResponse.json({ error: 'Amount must be a positive number' }, { status: 400 })
    }

    if (!category || typeof category !== 'string' || category.trim() === '') {
      return NextResponse.json({ error: 'Category is required' }, { status: 400 })
    }

    let expenseDate: Date | null = null
    if (date) {
      expenseDate = new Date(date)
      if (isNaN(expenseDate.getTime())) {
        return NextResponse.json({ error: 'Invalid date' }, { status: 400 })
      }
    }

    const expense = await prisma.internalExpense.create({
      data: {
        businessId,
        amount: amountNum,
        date: expenseDate,
        category: category.trim(),
        notes: notes && typeof notes === 'string' ? notes.trim() || null : null
      },
      select: {
        id: true,
        amount: true,
        date: true,
        category: true,
        notes: true,
        createdAt: true,
        updatedAt: true
      }
    })

    return NextResponse.json({
      success: true,
      expense: {
        id: expense.id,
        amount: expense.amount,
        date: expense.date?.toISOString() ?? null,
        category: expense.category,
        notes: expense.notes,
        createdAt: expense.createdAt.toISOString(),
        updatedAt: expense.updatedAt.toISOString()
      }
    })
  } catch (error) {
    console.error('Error creating internal expense:', error)
    return NextResponse.json(
      { error: 'Failed to create internal expense' },
      { status: 500 }
    )
  }
}
