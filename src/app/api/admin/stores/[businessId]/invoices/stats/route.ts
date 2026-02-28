// GET - Invoice usage stats (total count, last generated)
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
      select: { internalInvoiceEnabled: true }
    })
    if (!business || !business.internalInvoiceEnabled) {
      return NextResponse.json(
        { error: 'Internal invoice feature is not enabled for this business' },
        { status: 403 }
      )
    }

    const [total, lastInvoice] = await Promise.all([
      prisma.orderInvoice.count({ where: { businessId } }),
      prisma.orderInvoice.findFirst({
        where: { businessId },
        orderBy: { generatedAt: 'desc' },
        select: { generatedAt: true, invoiceNumber: true }
      })
    ])

    return NextResponse.json({
      total,
      lastGeneratedAt: lastInvoice?.generatedAt?.toISOString() ?? null,
      lastInvoiceNumber: lastInvoice?.invoiceNumber ?? null
    })
  } catch (error) {
    console.error('Error fetching invoice stats:', error)
    return NextResponse.json(
      { error: 'Failed to fetch invoice stats' },
      { status: 500 }
    )
  }
}
