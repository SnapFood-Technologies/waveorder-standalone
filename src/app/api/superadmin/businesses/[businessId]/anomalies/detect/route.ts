import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

// POST - Run anomaly detection for a business
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ businessId: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || session.user.role !== 'SUPER_ADMIN') {
      return NextResponse.json(
        { message: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { businessId } = await params

    // Verify business exists
    const business = await prisma.business.findUnique({
      where: { id: businessId },
      select: { id: true, name: true }
    })

    if (!business) {
      return NextResponse.json(
        { message: 'Business not found' },
        { status: 404 }
      )
    }

    const detectedAnomalies: any[] = []
    const now = new Date()

    // ===== ANOMALY CHECK #1: Published products with price 0 =====
    const zeroPriceProducts = await prisma.product.findMany({
      where: {
        businessId,
        isActive: true, // Published
        price: 0
      },
      select: {
        id: true,
        name: true,
        price: true,
        categoryId: true
      }
    })

    for (const product of zeroPriceProducts) {
      // Check if anomaly already exists (avoid duplicates)
      const existing = await prisma.anomaly.findFirst({
        where: {
          businessId,
          type: 'ZERO_PRICE_PRODUCT',
          entityId: product.id,
          status: 'OPEN' // Only check open anomalies
        }
      })

      if (!existing) {
        // Create new anomaly
        const anomaly = await prisma.anomaly.create({
          data: {
            businessId,
            type: 'ZERO_PRICE_PRODUCT',
            severity: 'HIGH',
            status: 'OPEN',
            title: 'Product with zero price',
            description: `Product "${product.name}" is published but has a price of 0. This may be a data entry error.`,
            entityType: 'PRODUCT',
            entityId: product.id,
            entityName: product.name,
            detectedAt: now,
            lastChecked: now
          }
        })
        detectedAnomalies.push(anomaly)
      } else {
        // Update last checked
        await prisma.anomaly.update({
          where: { id: existing.id },
          data: { lastChecked: now }
        })
      }
    }

    // ===== FUTURE: Add more anomaly checks here =====
    // - Missing product images
    // - Out of stock products
    // - Duplicate products
    // - Invalid phone numbers
    // - Etc.

    // Auto-resolve anomalies that are no longer valid
    // (e.g., product price was fixed, so anomaly should be auto-resolved)
    const openAnomalies = await prisma.anomaly.findMany({
      where: {
        businessId,
        type: 'ZERO_PRICE_PRODUCT',
        status: 'OPEN'
      }
    })

    for (const anomaly of openAnomalies) {
      if (!anomaly.entityId) continue

      // Check if product still has price 0
      const product = await prisma.product.findUnique({
        where: { id: anomaly.entityId },
        select: { price: true, isActive: true }
      })

      // Auto-resolve if product was fixed (price > 0) or deactivated
      if (!product || product.price > 0 || !product.isActive) {
        await prisma.anomaly.update({
          where: { id: anomaly.id },
          data: {
            status: 'RESOLVED',
            resolvedAt: now,
            lastChecked: now
          }
        })
      }
    }

    // Get updated counts
    const statusCounts = await prisma.anomaly.groupBy({
      by: ['status'],
      where: { businessId },
      _count: true
    })

    const counts = {
      totalDetected: detectedAnomalies.length,
      open: statusCounts.find(s => s.status === 'OPEN')?._count || 0,
      resolved: statusCounts.find(s => s.status === 'RESOLVED')?._count || 0,
      ignored: statusCounts.find(s => s.status === 'IGNORED')?._count || 0
    }

    return NextResponse.json({
      success: true,
      message: `Anomaly detection completed. ${detectedAnomalies.length} new anomalies detected.`,
      detectedAnomalies,
      counts
    })
  } catch (error: any) {
    console.error('Error running anomaly detection:', error)
    return NextResponse.json(
      { message: 'Internal server error', error: error.message },
      { status: 500 }
    )
  }
}
