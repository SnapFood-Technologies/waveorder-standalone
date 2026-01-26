// app/api/business/[businessId]/preview/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'


export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ businessId: string }> }
) {
  try {
    const { businessId } = await params
    
    const business = await prisma.business.findUnique({
      where: { id: businessId },
      include: {
        products: {
          where: { isActive: true },
          take: 10,
          include: {
            category: true
          }
        },
        categories: {
          where: { isActive: true },
          take: 5
        }
      }
    })

    if (!business) {
      return NextResponse.json({ message: 'Business not found' }, { status: 404 })
    }

    return NextResponse.json({
      business: {
        id: business.id,
        name: business.name,
        businessType: business.businessType,
        primaryColor: business.primaryColor,
        deliveryEnabled: business.deliveryEnabled,
        pickupEnabled: business.pickupEnabled,
        dineInEnabled: business.dineInEnabled,
        deliveryFee: business.deliveryFee,
        estimatedDeliveryTime: business.estimatedDeliveryTime
      },
      products: business.products.map(product => ({
        id: product.id,
        name: product.name,
        description: product.description,
        price: product.price,
        category: product.category.name
      })),
      categories: business.categories.map(category => ({
        id: category.id,
        name: category.name,
        description: category.description
      }))
    })

  } catch (error) {
    console.error('Get business preview error:', error)
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 })
  }
}