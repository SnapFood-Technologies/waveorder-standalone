// src/app/api/superadmin/businesses/[businessId]/marketplace/suppliers/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(
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

    // Get business to check connectedBusinesses
    const business = await prisma.business.findUnique({
      where: { id: businessId },
      select: { connectedBusinesses: true }
    })

    if (!business || !business.connectedBusinesses || business.connectedBusinesses.length === 0) {
      return NextResponse.json({
        suppliers: []
      })
    }

    // Get supplier businesses and their product counts
    const suppliers = await prisma.business.findMany({
      where: {
        id: { in: business.connectedBusinesses }
      },
      select: {
        id: true,
        name: true,
        _count: {
          select: {
            products: true
          }
        }
      }
    })

    const suppliersWithCounts = suppliers.map(s => ({
      id: s.id,
      name: s.name,
      productCount: s._count.products
    }))

    return NextResponse.json({
      suppliers: suppliersWithCounts
    })

  } catch (error: any) {
    console.error('Error fetching suppliers:', error)
    return NextResponse.json(
      { message: 'Internal server error', error: error.message },
      { status: 500 }
    )
  }
}
