// GET - Fetch single invoice for SuperAdmin (for PDF download)
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ businessId: string; invoiceId: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || session.user.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { businessId, invoiceId } = await params

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

    // Resolve modifiers same as admin API
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
