// app/api/admin/stores/[businessId]/analytics/product-shares/route.ts
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
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { businessId } = await params
    const { searchParams } = new URL(request.url)
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')

    // Verify user has access to this business
    const userBusiness = await prisma.userBusiness.findFirst({
      where: {
        userId: session.user.id,
        businessId: businessId
      }
    })

    if (!userBusiness && session.user.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Build date filter
    const dateFilter: any = {}
    if (startDate) {
      dateFilter.gte = new Date(startDate)
    }
    if (endDate) {
      dateFilter.lte = new Date(endDate)
    }

    // Get total share visits (visits with productShareId)
    const totalShareVisits = await prisma.visitorSession.count({
      where: {
        businessId,
        productShareId: { not: null },
        ...(Object.keys(dateFilter).length > 0 && { visitedAt: dateFilter })
      }
    })

    // Get top shared products (group by productShareId)
    const sharesByProduct = await prisma.visitorSession.groupBy({
      by: ['productShareId'],
      where: {
        businessId,
        productShareId: { not: null },
        ...(Object.keys(dateFilter).length > 0 && { visitedAt: dateFilter })
      },
      _count: {
        productShareId: true
      },
      orderBy: {
        _count: {
          productShareId: 'desc'
        }
      },
      take: 10
    })

    // Get product details for the top shared products
    const productIds = sharesByProduct
      .map(s => s.productShareId)
      .filter((id): id is string => id !== null)

    const products = await prisma.product.findMany({
      where: {
        id: { in: productIds }
      },
      select: {
        id: true,
        name: true,
        images: true
      }
    })

    // Create a map for quick lookup
    const productMap = new Map(products.map(p => [p.id, p]))

    // Format top shared products
    const topSharedProducts = sharesByProduct.map(share => {
      const product = productMap.get(share.productShareId!)
      return {
        productId: share.productShareId!,
        productName: product?.name || 'Unknown Product',
        productImage: product?.images?.[0] || null,
        shareVisits: share._count.productShareId
      }
    })

    return NextResponse.json({
      data: {
        totalShareVisits,
        topSharedProducts
      }
    })
  } catch (error) {
    console.error('Error fetching product shares analytics:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
