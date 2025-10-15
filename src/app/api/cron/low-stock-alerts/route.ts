// src/app/api/cron/low-stock-alerts/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { sendLowStockAlertEmail } from '@/lib/email'

export async function GET(request: NextRequest) {
  try {
    // Verify cron secret to prevent unauthorized access
    const authHeader = request.headers.get('authorization')
    
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
    }

    // Get all products that meet the criteria:
    // 1. Low stock notification is enabled
    // 2. Current stock is at or below the low stock alert threshold
    // 3. Business is active
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
              where: {
                role: 'OWNER'
              },
              include: {
                user: {
                  select: {
                    email: true,
                    name: true
                  }
                }
              }
            }
          }
        },
        category: {
          select: {
            name: true
          }
        }
      }
    })

    // Group products by business
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
    const results: any[] = []

    // Send email to each business owner
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
        // Format products for email
        const formattedProducts = products.map((p: any) => ({
          name: p.name,
          sku: p.sku,
          currentStock: p.stock,
          lowStockAlert: p.lowStockAlert,
          category: p.category?.name || 'Uncategorized'
        }))

        // Send email
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
        console.error(`Failed to send email to ${owner.email}:`, error)
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
      message: 'Low stock alert check complete',
      stats: {
        totalLowStockProducts: lowStockProducts.length,
        businessesNotified: productsByBusiness.size,
        emailsSent,
        emailsFailed
      },
      results
    })

  } catch (error) {
    console.error('Error in low stock alert cron:', error)
    return NextResponse.json(
      { 
        success: false,
        message: 'Internal server error',
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}