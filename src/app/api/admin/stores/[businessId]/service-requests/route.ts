// List service requests (form submissions) for SERVICES business type only.
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
      return NextResponse.json({ message: access.error }, { status: access.status })
    }

    const business = await prisma.business.findUnique({
      where: { id: businessId },
      select: { businessType: true }
    })
    if (business?.businessType !== 'SERVICES') {
      return NextResponse.json({ message: 'Service requests are only available for SERVICES businesses' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const page = Math.max(1, parseInt(searchParams.get('page') || '1'))
    const limit = Math.min(50, Math.max(1, parseInt(searchParams.get('limit') || '20')))
    const status = searchParams.get('status') || ''
    const requestType = searchParams.get('requestType') || ''
    const search = (searchParams.get('search') || '').trim()

    const skip = (page - 1) * limit

    const where: Record<string, unknown> = { businessId }
    if (status) where.status = status
    if (requestType) where.requestType = requestType
    if (search) {
      where.OR = [
        { contactName: { contains: search, mode: 'insensitive' } },
        { companyName: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { phone: { contains: search } },
        { message: { contains: search, mode: 'insensitive' } }
      ]
    }

    const [items, total] = await Promise.all([
      prisma.serviceRequest.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit
      }),
      prisma.serviceRequest.count({ where })
    ])

    return NextResponse.json({ items, total, page, limit })
  } catch (e) {
    console.error('Service requests list error:', e)
    return NextResponse.json({ message: 'Failed to load service requests' }, { status: 500 })
  }
}
