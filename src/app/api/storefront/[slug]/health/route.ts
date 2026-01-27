import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// Lightweight health check - just 1 product
export async function GET(
  request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const start = Date.now()
  const { slug } = await params

  try {
    // 1 query: business exists?
    const business = await prisma.business.findUnique({
      where: { slug },
      select: {
        id: true,
        name: true,
        isActive: true
      }
    })

    if (!business) {
      return NextResponse.json({ 
        ok: false, 
        error: 'Business not found',
        ms: Date.now() - start
      }, { status: 404 })
    }

    if (!business.isActive) {
      return NextResponse.json({ 
        ok: false, 
        error: 'Business not active',
        ms: Date.now() - start
      }, { status: 400 })
    }

    // 1 query: load just 1 product
    const product = await prisma.product.findFirst({
      where: { 
        businessId: business.id,
        isActive: true,
        price: { gt: 0 }
      },
      select: {
        id: true,
        name: true,
        price: true
      }
    })

    return NextResponse.json({
      ok: true,
      business: business.name,
      hasProducts: !!product,
      sampleProduct: product ? product.name : null,
      ms: Date.now() - start
    })

  } catch (error) {
    return NextResponse.json({ 
      ok: false, 
      error: 'Database error',
      ms: Date.now() - start
    }, { status: 500 })
  }
}
