import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// GET - Fetch cost price settings for a business
export async function GET(
  request: Request,
  { params }: { params: Promise<{ businessId: string }> }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if user is superadmin
    const user = await prisma.user.findUnique({
      where: { email: session.user.email }
    })

    if (!user || user.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Forbidden - SuperAdmin access required' }, { status: 403 })
    }

    const { businessId } = await params

    // Fetch business with cost price settings
    const business = await prisma.business.findUnique({
      where: { id: businessId },
      select: {
        id: true,
        name: true,
        showCostPrice: true,
        currency: true
      }
    })

    if (!business) {
      return NextResponse.json({ error: 'Business not found' }, { status: 404 })
    }

    // Get cost & margins summary
    const [
      totalProducts,
      productsWithCostPrice,
      productsWithSupplier,
      uniqueSuppliers,
      totalSupplierPayments
    ] = await Promise.all([
      // Total products
      prisma.product.count({
        where: { businessId }
      }),
      // Products with cost price set
      prisma.product.count({
        where: {
          businessId,
          costPrice: { not: null }
        }
      }),
      // Products with supplier name
      prisma.product.count({
        where: {
          businessId,
          supplierName: { not: null }
        }
      }),
      // Unique suppliers from products
      prisma.product.groupBy({
        by: ['supplierName'],
        where: {
          businessId,
          supplierName: { not: null }
        }
      }).then(results => results.length),
      // Total supplier payments
      prisma.supplierPayment.aggregate({
        where: { businessId },
        _sum: { amount: true },
        _count: true
      })
    ])

    return NextResponse.json({
      success: true,
      business: {
        id: business.id,
        name: business.name,
        currency: business.currency
      },
      settings: {
        showCostPrice: business.showCostPrice
      },
      summary: {
        totalProducts,
        productsWithCostPrice,
        productsWithSupplier,
        uniqueSuppliers,
        totalPayments: totalSupplierPayments._count,
        totalPaymentAmount: totalSupplierPayments._sum.amount || 0
      }
    })
  } catch (error) {
    console.error('Error fetching cost price settings:', error)
    return NextResponse.json(
      { error: 'Failed to fetch cost price settings' },
      { status: 500 }
    )
  }
}

// PATCH - Update cost price settings for a business
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ businessId: string }> }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if user is superadmin
    const user = await prisma.user.findUnique({
      where: { email: session.user.email }
    })

    if (!user || user.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Forbidden - SuperAdmin access required' }, { status: 403 })
    }

    const { businessId } = await params
    const body = await request.json()

    const { showCostPrice } = body

    // Validate business exists
    const business = await prisma.business.findUnique({
      where: { id: businessId }
    })

    if (!business) {
      return NextResponse.json({ error: 'Business not found' }, { status: 404 })
    }

    // Update business
    const updatedBusiness = await prisma.business.update({
      where: { id: businessId },
      data: {
        showCostPrice: showCostPrice === true
      },
      select: {
        id: true,
        name: true,
        showCostPrice: true
      }
    })

    return NextResponse.json({
      success: true,
      message: `Cost & Margins ${updatedBusiness.showCostPrice ? 'enabled' : 'disabled'} for ${updatedBusiness.name}`,
      settings: {
        showCostPrice: updatedBusiness.showCostPrice
      }
    })
  } catch (error) {
    console.error('Error updating cost price settings:', error)
    return NextResponse.json(
      { error: 'Failed to update cost price settings' },
      { status: 500 }
    )
  }
}
