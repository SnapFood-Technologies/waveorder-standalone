// app/api/admin/stores/[businessId]/discounts/route.ts
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

    // Get business type to determine if we're dealing with services or products
    const business = await prisma.business.findUnique({
      where: { id: businessId },
      select: { businessType: true }
    })

    const isSalon = business?.businessType === 'SALON'

    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const search = (searchParams.get('search') || '').trim()
    const category = searchParams.get('category') || ''
    const status = (searchParams.get('status') || 'all') as 'all' | 'active' | 'inactive'

    const where: any = {
      businessId,
      originalPrice: { not: null },
      // For salons, only show services; for others, exclude services
      isService: isSalon ? true : false,
    }

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { sku: { contains: search, mode: 'insensitive' } },
      ]
    }

    if (category) {
      where.categoryId = category
    }

    if (status === 'active') {
      where.isActive = true
    } else if (status === 'inactive') {
      where.isActive = false
    }

    // Fetch candidates (with non-null originalPrice)
    const candidates = await prisma.product.findMany({
      where,
      include: { category: true },
      orderBy: { updatedAt: 'desc' },
    })

    // Filter to only products where originalPrice > price
    const discounted = candidates.filter((p) => (p.originalPrice ?? 0) > p.price)

    const total = discounted.length
    const pages = Math.ceil(total / limit) || 1
    const start = (page - 1) * limit
    const end = start + limit
    const pageItems = discounted.slice(start, end)

    const products = pageItems.map((p) => ({
      id: p.id,
      name: p.name,
      sku: p.sku,
      price: p.price,
      originalPrice: p.originalPrice!,
      isActive: p.isActive,
      category: p.category ? { id: p.category.id, name: p.category.name } : null,
    }))

    return NextResponse.json({
      products,
      pagination: { page, limit, total, pages },
    })
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Error fetching discounts:', error)
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 })
  }
}


