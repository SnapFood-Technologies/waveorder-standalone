// src/app/api/integrations/[slug]/services/low-stock-alerts/route.ts
/**
 * External API endpoint for integrations to trigger low stock alert emails.
 * Replaces the old cron-based approach with proper integration API key auth and logging.
 *
 * Authentication: Integration API key (wo_int_xxx)
 * Method: POST
 * Response: Stats on products found, emails sent/failed, and per-business results
 */
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { sendLowStockAlertEmail } from '@/lib/email'
import {
  authenticateIntegrationRequest,
  logIntegrationCall,
} from '@/lib/integration-auth'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const startTime = Date.now()
  const { slug } = await params
  const endpoint = `/api/integrations/${slug}/services/low-stock-alerts`
  let integrationId = ''

  try {
    // Authenticate the integration
    const authResult = await authenticateIntegrationRequest(request)
    if (authResult instanceof NextResponse) return authResult
    const { integration } = authResult
    integrationId = integration.integrationId

    // Verify slug matches the authenticated integration
    if (integration.integrationSlug !== slug) {
      return NextResponse.json(
        { error: 'API key does not belong to this integration' },
        { status: 403 }
      )
    }

    // Find products with low stock notifications enabled that are at/below threshold
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
    const results: Array<{
      businessId: string
      businessName: string
      ownerEmail?: string
      productsCount?: number
      status: string
      reason?: string
      error?: string
    }> = []

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

    const responseBody = {
      success: true,
      message: 'Low stock alert check complete',
      stats: {
        totalLowStockProducts: lowStockProducts.length,
        businessesNotified: productsByBusiness.size,
        emailsSent,
        emailsFailed
      },
      results
    }

    await logIntegrationCall({
      integrationId,
      endpoint,
      method: 'POST',
      statusCode: 200,
      responseBody: responseBody.stats,
      ipAddress: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip'),
      duration: Date.now() - startTime,
    })

    return NextResponse.json(responseBody)
  } catch (error) {
    console.error('Low stock alerts service error:', error)
    const errorMsg = error instanceof Error ? error.message : 'Internal server error'

    await logIntegrationCall({
      integrationId,
      endpoint,
      method: 'POST',
      statusCode: 500,
      error: errorMsg,
      ipAddress: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip'),
      duration: Date.now() - startTime,
    }).catch(() => {})

    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}
