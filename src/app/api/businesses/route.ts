import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const businesses = await prisma.business.findMany({
      where: { isActive: true },
      include: {
        _count: {
          select: {
            products: true,
            orders: true
          }
        }
      }
    })
    
    return NextResponse.json(businesses)
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch businesses' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const data = await request.json()
    
    const business = await prisma.business.create({
      data: {
        ...data,
        slug: data.slug || data.name.toLowerCase().replace(/[^a-z0-9]+/g, '-')
      }
    })
    
    return NextResponse.json(business)
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create business' }, { status: 500 })
  }
}
