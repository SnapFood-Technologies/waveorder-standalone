// src/app/api/admin/stores/[businessId]/internal-expenses/[expenseId]/route.ts
// PATCH - Update expense, DELETE - Delete expense
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { checkBusinessAccess } from '@/lib/api-helpers'

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ businessId: string; expenseId: string }> }
) {
  try {
    const { businessId, expenseId } = await params
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

    const existing = await prisma.internalExpense.findFirst({
      where: { id: expenseId, businessId }
    })
    if (!existing) {
      return NextResponse.json({ error: 'Expense not found' }, { status: 404 })
    }

    const body = await request.json()
    const { amount, date, category, notes, type } = body

    const updateData: { amount?: number; date?: Date | null; category?: string; notes?: string | null; type?: string } = {}

    if (type !== undefined && (type === 'EXPENSE' || type === 'INJECTION')) {
      updateData.type = type
    }

    if (amount !== undefined && amount !== null) {
      const amountNum = parseFloat(amount)
      if (isNaN(amountNum) || amountNum < 0) {
        return NextResponse.json({ error: 'Amount must be a positive number' }, { status: 400 })
      }
      updateData.amount = amountNum
    }

    if (date !== undefined) {
      if (date === null || date === '') {
        updateData.date = null
      } else {
        const expenseDate = new Date(date)
        if (isNaN(expenseDate.getTime())) {
          return NextResponse.json({ error: 'Invalid date' }, { status: 400 })
        }
        updateData.date = expenseDate
      }
    }

    if (category !== undefined) {
      if (!category || typeof category !== 'string' || category.trim() === '') {
        return NextResponse.json({ error: 'Category cannot be empty' }, { status: 400 })
      }
      updateData.category = category.trim()
    }

    if (notes !== undefined) {
      updateData.notes = notes && typeof notes === 'string' ? notes.trim() || null : null
    }

    const expense = await prisma.internalExpense.update({
      where: { id: expenseId },
      data: updateData,
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
    console.error('Error updating internal expense:', error)
    return NextResponse.json(
      { error: 'Failed to update internal expense' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ businessId: string; expenseId: string }> }
) {
  try {
    const { businessId, expenseId } = await params
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

    const existing = await prisma.internalExpense.findFirst({
      where: { id: expenseId, businessId }
    })
    if (!existing) {
      return NextResponse.json({ error: 'Expense not found' }, { status: 404 })
    }

    await prisma.internalExpense.delete({
      where: { id: expenseId }
    })

    return NextResponse.json({ success: true, message: 'Expense deleted' })
  } catch (error) {
    console.error('Error deleting internal expense:', error)
    return NextResponse.json(
      { error: 'Failed to delete internal expense' },
      { status: 500 }
    )
  }
}
