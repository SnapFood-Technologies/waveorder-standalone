// app/api/admin/stores/[businessId]/products/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { PrismaClient } from '@prisma/client'
import { authOptions } from '@/lib/auth'

const prisma = new PrismaClient()

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ businessId: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
    }

    const { businessId } = await params

    // Verify user has access to business
    const business = await prisma.business.findFirst({
      where: {
        id: businessId,
        users: {
          some: {
            user: {
              email: session.user.email
            }
          }
        }
      }
    })

    if (!business) {
      return NextResponse.json({ message: 'Business not found' }, { status: 404 })
    }

    const products = await prisma.product.findMany({
      where: { businessId },
      include: {
        category: {
          select: {
            id: true,
            name: true
          }
        },
        variants: true,
        modifiers: true
      },
      orderBy: { createdAt: 'desc' }
    })

    return NextResponse.json({ products })

  } catch (error) {
    console.error('Error fetching products:', error)
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ businessId: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
    }

    const { businessId } = await params
    const productData = await request.json()

    // Verify user has access to business
    const business = await prisma.business.findFirst({
      where: {
        id: businessId,
        users: {
          some: {
            user: {
              email: session.user.email
            }
          }
        }
      }
    })

    if (!business) {
      return NextResponse.json({ message: 'Business not found' }, { status: 404 })
    }

    // Create product with variants and modifiers
    const product = await prisma.product.create({
      data: {
        name: productData.name,
        description: productData.description || null,
        images: productData.images || [],
        price: productData.price,
        originalPrice: productData.originalPrice || null,
        sku: productData.sku || null,
        stock: productData.trackInventory ? productData.stock : 0,
        trackInventory: productData.trackInventory,
        lowStockAlert: productData.lowStockAlert || null,
        isActive: productData.isActive,
        featured: productData.featured,
        metaTitle: productData.metaTitle || null,
        metaDescription: productData.metaDescription || null,
        businessId,
        categoryId: productData.categoryId,
        variants: {
          create: productData.variants?.map((variant: any) => ({
            name: variant.name,
            price: variant.price,
            stock: variant.stock || 0,
            sku: variant.sku || null
          })) || []
        },
        modifiers: {
          create: productData.modifiers?.map((modifier: any) => ({
            name: modifier.name,
            price: modifier.price,
            required: modifier.required
          })) || []
        }
      },
      include: {
        category: true,
        variants: true,
        modifiers: true
      }
    })

    // Create inventory activity if tracking inventory
    if (productData.trackInventory && productData.stock > 0) {
      await prisma.inventoryActivity.create({
        data: {
          productId: product.id,
          businessId,
          type: 'RESTOCK',
          quantity: productData.stock,
          oldStock: 0,
          newStock: productData.stock,
          reason: 'Initial stock when creating product'
        }
      })
    }

    return NextResponse.json({ product })

  } catch (error) {
    console.error('Error creating product:', error)
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 })
  }
}