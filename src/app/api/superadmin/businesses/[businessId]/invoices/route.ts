// GET - List invoices for a business (SuperAdmin only)
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ businessId: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || session.user.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { businessId } = await params

    const business = await prisma.business.findUnique({
      where: { id: businessId },
      select: { id: true, name: true, internalInvoiceEnabled: true }
    })
    if (!business) {
      return NextResponse.json({ error: 'Business not found' }, { status: 404 })
    }
    if (!business.internalInvoiceEnabled) {
      return NextResponse.json(
        { error: 'Internal invoice feature is not enabled for this business' },
        { status: 403 }
      )
    }

    const { searchParams } = new URL(request.url)
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10))
    const limit = Math.min(50, Math.max(1, parseInt(searchParams.get('limit') || '20', 10)))
    const skip = (page - 1) * limit

    const [invoices, total] = await Promise.all([
      prisma.orderInvoice.findMany({
        where: { businessId },
        orderBy: { generatedAt: 'desc' },
        skip,
        take: limit,
        select: {
          id: true,
          invoiceNumber: true,
          note: true,
          generatedAt: true,
          order: {
            select: {
              id: true,
              orderNumber: true,
              total: true,
              customer: { select: { id: true, name: true } }
            }
          }
        }
      }),
      prisma.orderInvoice.count({ where: { businessId } })
    ])

    return NextResponse.json({
      business: { id: business.id, name: business.name },
      invoices: invoices.map((inv) => ({
        id: inv.id,
        invoiceNumber: inv.invoiceNumber,
        note: inv.note,
        generatedAt: inv.generatedAt,
        orderId: inv.order.id,
        orderNumber: inv.order.orderNumber,
        total: inv.order.total,
        customerName: inv.order.customer?.name || '—'
      })),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    })
  } catch (error) {
    console.error('Error listing invoices:', error)
    return NextResponse.json(
      { error: 'Failed to list invoices' },
      { status: 500 }
    )
  }
}
