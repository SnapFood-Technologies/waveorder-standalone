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
    const typeFilter = searchParams.get('type') || undefined // "EXPENSE" | "INJECTION"

    const where = { businessId } as { businessId: string; category?: string; type?: string }
    if (category) where.category = category
    if (typeFilter === 'EXPENSE' || typeFilter === 'INJECTION') where.type = typeFilter

    const [expenses, total, expensesAgg, injectionsAgg, byCategory] = await Promise.all([
      prisma.internalExpense.findMany({
        where,
        orderBy: [{ date: 'desc' }, { createdAt: 'desc' }],
        skip,
        take: limit,
        select: {
          id: true,
          type: true,
          amount: true,
          date: true,
          category: true,
          notes: true,
          createdAt: true,
          updatedAt: true
        }
      }),
      prisma.internalExpense.count({ where }),
      // Expenses: type=EXPENSE or legacy (no type)
      prisma.internalExpense.aggregate({
        where: { businessId, type: { not: 'INJECTION' } },
        _sum: { amount: true },
        _count: true
      }),
      prisma.internalExpense.aggregate({
        where: { businessId, type: 'INJECTION' },
        _sum: { amount: true },
        _count: true
      }),
      prisma.internalExpense.groupBy({
        by: ['category'],
        where: { businessId, type: { not: 'INJECTION' } },
        _sum: { amount: true },
        _count: true
      })
    ])

    const totalExpenses = expensesAgg._sum.amount ?? 0
    const totalInjections = injectionsAgg._sum.amount ?? 0
    const net = totalInjections - totalExpenses

    return NextResponse.json({
      enabled: true,
      currency: business.currency || 'EUR',
      data: {
        expenses: expenses.map((e) => ({
          id: e.id,
          type: e.type || 'EXPENSE',
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
          totalExpenses,
          totalInjections,
          net,
          totalCount: expensesAgg._count + injectionsAgg._count,
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
    const { amount, date, category, notes, type } = body

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

    const movementType = type === 'INJECTION' ? 'INJECTION' : 'EXPENSE'

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
        type: movementType,
        amount: amountNum,
        date: expenseDate,
        category: category.trim(),
        notes: notes && typeof notes === 'string' ? notes.trim() || null : null
      },
      select: {
        id: true,
        type: true,
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
        type: expense.type || 'EXPENSE',
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
