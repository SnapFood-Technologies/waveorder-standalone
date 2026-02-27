// GET - Fetch single invoice (for view/download)
// DELETE - Delete invoice
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { checkBusinessAccess } from '@/lib/api-helpers'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ businessId: string; invoiceId: string }> }
) {
  try {
    const { businessId, invoiceId } = await params
    const access = await checkBusinessAccess(businessId)
    if (!access.authorized) {
      return NextResponse.json({ error: access.error }, { status: access.status })
    }

    const business = await prisma.business.findUnique({
      where: { id: businessId },
      select: { internalInvoiceEnabled: true, name: true, logo: true, primaryColor: true, address: true, phone: true, email: true, currency: true }
    })
    if (!business || !business.internalInvoiceEnabled) {
      return NextResponse.json(
        { error: 'Internal invoice feature is not enabled for this business' },
        { status: 403 }
      )
    }

    const invoice = await prisma.orderInvoice.findFirst({
      where: { id: invoiceId, businessId },
      include: {
        order: {
          include: {
            customer: { select: { name: true, phone: true, email: true, addressJson: true } },
            items: {
              include: {
                product: {
                  select: {
                    name: true,
                    modifiers: { select: { id: true, name: true, price: true, required: true } }
                  }
                },
                variant: { select: { name: true } }
              }
            }
          }
        }
      }
    })

    if (!invoice) {
      return NextResponse.json({ error: 'Invoice not found' }, { status: 404 })
    }

    // Resolve modifiers same as Order Details API
    const items = invoice.order.items.map((item) => {
      const modifierIds = (item.modifiers as string[]) || []
      const modifierDetails = modifierIds.length > 0
        ? (item.product as any).modifiers?.filter((m: { id: string }) => modifierIds.includes(m.id)) || []
        : []
      return {
        id: item.id,
        quantity: item.quantity,
        price: item.price,
        originalPrice: item.originalPrice,
        productName: item.product.name,
        variantName: item.variant?.name || null,
        modifiers: modifierDetails
      }
    })

    return NextResponse.json({
      invoice: {
        id: invoice.id,
        invoiceNumber: invoice.invoiceNumber,
        note: invoice.note,
        generatedAt: invoice.generatedAt,
        order: {
          id: invoice.order.id,
          orderNumber: invoice.order.orderNumber,
          total: invoice.order.total,
          subtotal: invoice.order.subtotal,
          deliveryFee: invoice.order.deliveryFee,
          tax: invoice.order.tax,
          discount: invoice.order.discount,
          paymentMethod: invoice.order.paymentMethod,
          createdAt: invoice.order.createdAt,
          deliveryAddress: invoice.order.deliveryAddress,
          customer: invoice.order.customer,
          items
        }
      },
      business: {
        name: business.name,
        logo: business.logo,
        primaryColor: business.primaryColor || '#0d9488',
        address: business.address,
        phone: business.phone,
        email: business.email,
        currency: business.currency || 'EUR'
      }
    })
  } catch (error) {
    console.error('Error fetching invoice:', error)
    return NextResponse.json(
      { error: 'Failed to fetch invoice' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ businessId: string; invoiceId: string }> }
) {
  try {
    const { businessId, invoiceId } = await params
    const access = await checkBusinessAccess(businessId)
    if (!access.authorized) {
      return NextResponse.json({ error: access.error }, { status: access.status })
    }

    const business = await prisma.business.findUnique({
      where: { id: businessId },
      select: { internalInvoiceEnabled: true }
    })
    if (!business || !business.internalInvoiceEnabled) {
      return NextResponse.json(
        { error: 'Internal invoice feature is not enabled for this business' },
        { status: 403 }
      )
    }

    const invoice = await prisma.orderInvoice.findFirst({
      where: { id: invoiceId, businessId }
    })

    if (!invoice) {
      return NextResponse.json({ error: 'Invoice not found' }, { status: 404 })
    }

    await prisma.orderInvoice.delete({
      where: { id: invoiceId }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting invoice:', error)
    return NextResponse.json(
      { error: 'Failed to delete invoice' },
      { status: 500 }
    )
  }
}
