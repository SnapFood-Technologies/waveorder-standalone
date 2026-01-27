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
    // Get business info with slug for storefront ping
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

    // Simple counts - just 1 query each (fast)
    const [productCount, orderCount, customerCount] = await Promise.all([
      prisma.product.count({ where: { businessId } }),
      prisma.order.count({ where: { businessId } }),
      prisma.customer.count({ where: { businessId } })
    ])

    // Ping storefront API
    let storefrontStatus = 'unknown'
    let storefrontResponseTime = 0
    
    try {
      const baseUrl = process.env.NEXTAUTH_URL || 'https://waveorder.app'
      const startTime = Date.now()
      const storefrontResponse = await fetch(`${baseUrl}/api/storefront/${business.slug}`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' }
      })
      storefrontResponseTime = Date.now() - startTime
      
      if (storefrontResponse.ok) {
        storefrontStatus = 'ok'
      } else {
        storefrontStatus = `error (${storefrontResponse.status})`
      }
    } catch (error) {
      storefrontStatus = 'failed'
    }

    return NextResponse.json({
      business,
      counts: {
        products: productCount,
        orders: orderCount,
        customers: customerCount
      },
      storefront: {
        status: storefrontStatus,
        responseTime: storefrontResponseTime,
        url: `/${business.slug}`
      }
    })
  } catch (error) {
    console.error('Error in business health debug:', error)
    return NextResponse.json({ error: 'Failed to analyze business health' }, { status: 500 })
  }
}
