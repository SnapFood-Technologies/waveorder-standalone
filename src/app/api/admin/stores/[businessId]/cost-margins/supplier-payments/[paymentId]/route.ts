// src/app/api/admin/stores/[businessId]/cost-margins/supplier-payments/[paymentId]/route.ts
// Individual supplier payment operations - Update and Delete
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { checkBusinessAccess } from '@/lib/api-helpers'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ businessId: string; paymentId: string }> }
) {
  try {
    const { businessId, paymentId } = await params

    const access = await checkBusinessAccess(businessId)
    
    if (!access.authorized) {
      return NextResponse.json({ message: access.error }, { status: access.status })
    }

    const payment = await prisma.supplierPayment.findFirst({
      where: {
        id: paymentId,
        businessId
      }
    })

    if (!payment) {
      return NextResponse.json({ message: 'Payment not found' }, { status: 404 })
    }

    return NextResponse.json({ payment })

  } catch (error) {
    console.error('Error fetching supplier payment:', error)
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ businessId: string; paymentId: string }> }
) {
  try {
    const { businessId, paymentId } = await params

    const access = await checkBusinessAccess(businessId)
    
    if (!access.authorized) {
      return NextResponse.json({ message: access.error }, { status: access.status })
    }

    // Check if payment exists and belongs to this business
    const existingPayment = await prisma.supplierPayment.findFirst({
      where: {
        id: paymentId,
        businessId
      }
    })

    if (!existingPayment) {
      return NextResponse.json({ message: 'Payment not found' }, { status: 404 })
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

    // Build update data
    const updateData: any = {}

    if (supplierName !== undefined) {
      if (typeof supplierName !== 'string' || !supplierName.trim()) {
        return NextResponse.json({ message: 'Invalid supplier name' }, { status: 400 })
      }
      updateData.supplierName = supplierName.trim()
    }

    if (amount !== undefined) {
      if (typeof amount !== 'number' || amount <= 0) {
        return NextResponse.json({ message: 'Invalid amount' }, { status: 400 })
      }
      updateData.amount = amount
    }

    if (currency !== undefined) updateData.currency = currency
    if (periodStart !== undefined) updateData.periodStart = periodStart ? new Date(periodStart) : null
    if (periodEnd !== undefined) updateData.periodEnd = periodEnd ? new Date(periodEnd) : null
    if (paymentMethod !== undefined) updateData.paymentMethod = paymentMethod || null
    if (reference !== undefined) updateData.reference = reference || null
    if (notes !== undefined) updateData.notes = notes || null
    if (paidAt !== undefined) updateData.paidAt = new Date(paidAt)

    // Update payment
    const payment = await prisma.supplierPayment.update({
      where: { id: paymentId },
      data: updateData
    })

    return NextResponse.json({
      success: true,
      message: 'Payment updated successfully',
      payment
    })

  } catch (error) {
    console.error('Error updating supplier payment:', error)
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ businessId: string; paymentId: string }> }
) {
  try {
    const { businessId, paymentId } = await params

    const access = await checkBusinessAccess(businessId)
    
    if (!access.authorized) {
      return NextResponse.json({ message: access.error }, { status: access.status })
    }

    // Check if payment exists and belongs to this business
    const existingPayment = await prisma.supplierPayment.findFirst({
      where: {
        id: paymentId,
        businessId
      }
    })

    if (!existingPayment) {
      return NextResponse.json({ message: 'Payment not found' }, { status: 404 })
    }

    // Delete payment
    await prisma.supplierPayment.delete({
      where: { id: paymentId }
    })

    return NextResponse.json({
      success: true,
      message: 'Payment deleted successfully'
    })

  } catch (error) {
    console.error('Error deleting supplier payment:', error)
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    )
  }
}
