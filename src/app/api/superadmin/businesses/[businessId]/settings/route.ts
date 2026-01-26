import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// PATCH - Update business settings
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ businessId: string }> }
) {
  try {
    const { businessId } = await params
    const session = await getServerSession(authOptions)

    if (!session?.user || session.user.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { hideProductsWithoutPhotos } = body

    // Update business settings
    const business = await prisma.business.update({
      where: { id: businessId },
      data: {
        ...(hideProductsWithoutPhotos !== undefined && { hideProductsWithoutPhotos })
      },
      include: {
        owner: {
          select: {
            id: true,
            name: true,
            email: true,
            createdAt: true,
            authMethod: true
          }
        }
      }
    })

    // Fetch stats separately
    const [totalOrders, totalRevenue, totalCustomers, totalProducts] = await Promise.all([
      prisma.order.count({ where: { businessId } }),
      prisma.order.aggregate({
        where: { businessId, status: { in: ['CONFIRMED', 'PREPARING', 'READY', 'DELIVERED', 'COMPLETED'] } },
        _sum: { total: true }
      }),
      prisma.customer.count({ where: { businessId } }),
      prisma.product.count({ where: { businessId } })
    ])

    const businessWithStats = {
      ...business,
      stats: {
        totalOrders,
        totalRevenue: totalRevenue._sum.total || 0,
        totalCustomers,
        totalProducts
      }
    }

    return NextResponse.json({ business: businessWithStats })
  } catch (error) {
    console.error('Error updating business settings:', error)
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 })
  }
}
