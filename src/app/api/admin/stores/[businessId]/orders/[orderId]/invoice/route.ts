// POST - Generate internal invoice (excludes cancelled/returned/refunded orders and payment REFUNDED)
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { checkBusinessAccess } from '@/lib/api-helpers'
import {
  isOrderEligibleForInternalInvoice,
  INTERNAL_INVOICE_INELIGIBLE_MESSAGE
} from '@/lib/internal-order-invoice'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ businessId: string; orderId: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { businessId, orderId } = await params
    const access = await checkBusinessAccess(businessId)
    if (!access.authorized) {
      return NextResponse.json({ error: access.error }, { status: access.status })
    }

    const body = await request.json().catch(() => ({}))
    const note = typeof body.note === 'string' ? body.note.trim() || null : null

    const business = await prisma.business.findUnique({
      where: { id: businessId },
      select: { id: true, internalInvoiceEnabled: true }
    })
    if (!business || !business.internalInvoiceEnabled) {
      return NextResponse.json(
        { error: 'Internal invoice feature is not enabled for this business' },
        { status: 403 }
      )
    }

    const order = await prisma.order.findFirst({
      where: { id: orderId, businessId },
      select: {
        id: true,
        status: true,
        paymentStatus: true,
        type: true,
        invoice: { select: { id: true, invoiceNumber: true } }
      }
    })

    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 })
    }

    if (order.invoice) {
      return NextResponse.json(
        { error: 'Invoice already exists for this order', invoiceId: order.invoice.id },
        { status: 400 }
      )
    }

    if (!isOrderEligibleForInternalInvoice(order)) {
      return NextResponse.json({ error: INTERNAL_INVOICE_INELIGIBLE_MESSAGE }, { status: 400 })
    }

    const year = new Date().getFullYear()
    const lastInvoice = await prisma.orderInvoice.findFirst({
      where: {
        businessId,
        invoiceNumber: { startsWith: `INV-${year}-` }
      },
      orderBy: { invoiceNumber: 'desc' },
      select: { invoiceNumber: true }
    })

    let seq = 1
    if (lastInvoice) {
      const match = lastInvoice.invoiceNumber.match(/INV-\d{4}-(\d+)/)
      if (match) seq = parseInt(match[1], 10) + 1
    }
    const invoiceNumber = `INV-${year}-${seq.toString().padStart(4, '0')}`

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true }
    })

    const invoice = await prisma.orderInvoice.create({
      data: {
        orderId,
        businessId,
        invoiceNumber,
        note: note || null,
        generatedById: user?.id
      },
      select: {
        id: true,
        invoiceNumber: true,
        note: true,
        generatedAt: true
      }
    })

    return NextResponse.json({
      success: true,
      invoice: {
        id: invoice.id,
        invoiceNumber: invoice.invoiceNumber,
        note: invoice.note,
        generatedAt: invoice.generatedAt
      }
    })
  } catch (error) {
    console.error('Error generating invoice:', error)
    return NextResponse.json(
      { error: 'Failed to generate invoice' },
      { status: 500 }
    )
  }
}
