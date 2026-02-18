import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { sendLowStockAlertEmail } from '@/lib/email'

export async function POST() {
  try {
    const session = await getServerSession(authOptions)

    if (!session || session.user.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
    }

    const lowStockProducts = await prisma.product.findMany({
      where: {
        enableLowStockNotification: true,
        stock: {
          lte: prisma.product.fields.lowStockAlert
        },
        business: {
          isActive: true
        }
      },
      include: {
        business: {
          include: {
            users: {
              where: { role: 'OWNER' },
              include: {
                user: {
                  select: { email: true, name: true }
                }
              }
            }
          }
        },
        category: {
          select: { name: true }
        }
      }
    })

    const productsByBusiness = new Map<string, typeof lowStockProducts>()

    for (const product of lowStockProducts) {
      const businessId = product.businessId
      if (!productsByBusiness.has(businessId)) {
        productsByBusiness.set(businessId, [])
      }
      productsByBusiness.get(businessId)!.push(product)
    }

    let emailsSent = 0
    let emailsFailed = 0
    const results: Array<{
      businessId: string
      businessName: string
      ownerEmail?: string
      productsCount?: number
      status: string
      reason?: string
      error?: string
    }> = []

    for (const [businessId, products] of productsByBusiness.entries()) {
      const business = products[0].business
      const owner = business.users[0]?.user

      if (!owner || !owner.email) {
        emailsFailed++
        results.push({
          businessId,
          businessName: business.name,
          status: 'failed',
          reason: 'No owner email'
        })
        continue
      }

      try {
        const formattedProducts = products.map((p) => ({
          name: p.name,
          sku: p.sku || '',
          currentStock: p.stock,
          lowStockAlert: p.lowStockAlert || 0,
          category: p.category?.name || 'Uncategorized'
        }))

        await sendLowStockAlertEmail({
          to: owner.email,
          ownerName: owner.name || 'Business Owner',
          businessName: business.name,
          businessId: business.id,
          products: formattedProducts
        })

        emailsSent++
        results.push({
          businessId,
          businessName: business.name,
          ownerEmail: owner.email,
          productsCount: products.length,
          status: 'success'
        })
      } catch (error) {
        console.error(`Failed to send low stock email to ${owner.email}:`, error)
        emailsFailed++
        results.push({
          businessId,
          businessName: business.name,
          ownerEmail: owner.email,
          productsCount: products.length,
          status: 'failed',
          error: error instanceof Error ? error.message : 'Unknown error'
        })
      }
    }

    return NextResponse.json({
      success: true,
      triggeredBy: session.user.email,
      stats: {
        totalLowStockProducts: lowStockProducts.length,
        businessesNotified: productsByBusiness.size,
        emailsSent,
        emailsFailed
      },
      results
    })
  } catch (error) {
    console.error('Manual low stock alerts error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}
