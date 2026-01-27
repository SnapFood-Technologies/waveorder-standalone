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
    // Check if this business is an originator (has connected suppliers)
    const supplierConnections = await prisma.connectedBusiness.findMany({
      where: { originatorId: businessId },
      include: {
        supplier: {
          select: {
            id: true,
            name: true,
            slug: true
          }
        }
      }
    })

    // Check if this business is a supplier (connected to originators)
    const originatorConnections = await prisma.connectedBusiness.findMany({
      where: { supplierId: businessId },
      include: {
        originator: {
          select: {
            id: true,
            name: true,
            slug: true
          }
        }
      }
    })

    // Determine role
    let role = 'standalone'
    if (supplierConnections.length > 0) {
      role = 'originator'
    } else if (originatorConnections.length > 0) {
      role = 'supplier'
    }

    // Get product counts
    const ownProductsCount = await prisma.product.count({
      where: {
        businessId,
        sourceBusinessId: null // Not imported
      }
    })

    // Count products imported from each supplier (for originator)
    const supplierProductCounts = await Promise.all(
      supplierConnections.map(async (conn) => {
        const count = await prisma.product.count({
          where: {
            businessId,
            sourceBusinessId: conn.supplierId
          }
        })
        return {
          id: conn.supplier.id,
          name: conn.supplier.name,
          slug: conn.supplier.slug,
          productCount: count,
          isActive: conn.isActive,
          importProducts: conn.importProducts
        }
      })
    )

    // Count products visible to each originator (for supplier)
    const originatorProductCounts = await Promise.all(
      originatorConnections.map(async (conn) => {
        const count = await prisma.product.count({
          where: {
            businessId: conn.originatorId,
            sourceBusinessId: businessId
          }
        })
        return {
          id: conn.originator.id,
          name: conn.originator.name,
          slug: conn.originator.slug,
          productCount: count,
          isActive: conn.isActive,
          importProducts: conn.importProducts
        }
      })
    )

    // Total connected products
    const connectedProductsCount = role === 'originator'
      ? supplierProductCounts.reduce((sum, s) => sum + s.productCount, 0)
      : originatorProductCounts.reduce((sum, s) => sum + s.productCount, 0)

    return NextResponse.json({
      role,
      connectedBusinesses: role === 'originator' ? supplierProductCounts : originatorProductCounts,
      summary: {
        ownProducts: ownProductsCount,
        connectedProducts: connectedProductsCount,
        totalVisible: ownProductsCount + connectedProductsCount,
        totalConnections: role === 'originator' ? supplierConnections.length : originatorConnections.length
      }
    })
  } catch (error) {
    console.error('Error in connections debug:', error)
    return NextResponse.json({ error: 'Failed to analyze connections' }, { status: 500 })
  }
}
