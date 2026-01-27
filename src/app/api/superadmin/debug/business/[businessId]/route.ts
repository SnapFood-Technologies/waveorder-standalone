import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ businessId: string }> }
) {
  const session = await getServerSession(authOptions)
  
  if (!session || session.user.role !== 'SUPER_ADMIN') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { businessId } = await params

  try {
    // Get business info
    const business = await prisma.business.findUnique({
      where: { id: businessId },
      select: {
        id: true,
        name: true,
        slug: true,
        businessType: true,
        isActive: true
      }
    })

    if (!business) {
      return NextResponse.json({ error: 'Business not found' }, { status: 404 })
    }

    // Simple counts - 3 fast queries
    const [productCount, orderCount, customerCount] = await Promise.all([
      prisma.product.count({ where: { businessId } }),
      prisma.order.count({ where: { businessId } }),
      prisma.customer.count({ where: { businessId } })
    ])

    return NextResponse.json({
      business,
      counts: {
        products: productCount,
        orders: orderCount,
        customers: customerCount
      },
      storefront: {
        url: `/${business.slug}`
      }
    })
  } catch (error) {
    console.error('Error in business health debug:', error)
    return NextResponse.json({ error: 'Failed to analyze business health' }, { status: 500 })
  }
}
