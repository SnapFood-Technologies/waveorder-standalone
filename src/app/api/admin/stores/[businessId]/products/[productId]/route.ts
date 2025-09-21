// app/api/admin/stores/[businessId]/products/[productId]/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { PrismaClient } from '@prisma/client'
import { authOptions } from '@/lib/auth'

const prisma = new PrismaClient()

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ businessId: string; productId: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
    }

    const { businessId, productId } = await params

    const product = await prisma.product.findFirst({
      where: {
        id: productId,
        businessId,
        business: {
          users: {
            some: {
              user: {
                email: session.user.email
              }
            }
          }
        }
      },
      include: {
        category: true,
        variants: true,
        modifiers: true
      }
    })

    if (!product) {
      return NextResponse.json({ message: 'Product not found' }, { status: 404 })
    }

    return NextResponse.json({ product })

  } catch (error) {
    console.error('Error fetching product:', error)
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 })
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ businessId: string; productId: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
    }

    const { businessId, productId } = await params
    const productData = await request.json()

    // Get current product for inventory tracking
    const currentProduct = await prisma.product.findFirst({
      where: {
        id: productId,
        businessId,
        business: {
          users: {
            some: {
              user: {
                email: session.user.email
              }
            }
          }
        }
      }
    })

    if (!currentProduct) {
      return NextResponse.json({ message: 'Product not found' }, { status: 404 })
    }

    // Update product
    const product = await prisma.product.update({
      where: { id: productId },
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
        categoryId: productData.categoryId
      },
      include: {
        category: true,
        variants: true,
        modifiers: true
      }
    })

    // Track inventory changes
    if (productData.trackInventory && currentProduct.stock !== productData.stock) {
      const quantityChange = productData.stock - currentProduct.stock
      
      await prisma.inventoryActivity.create({
        data: {
          productId: productId,
          businessId,
          type: quantityChange > 0 ? 'MANUAL_INCREASE' : 'MANUAL_DECREASE',
          quantity: quantityChange,
          oldStock: currentProduct.stock,
          newStock: productData.stock,
          reason: 'Manual adjustment from product edit'
        }
      })
    }

    // Update variants (delete existing and recreate)
    await prisma.productVariant.deleteMany({
      where: { productId }
    })

    if (productData.variants && productData.variants.length > 0) {
      await prisma.productVariant.createMany({
        data: productData.variants.map((variant: any) => ({
          productId,
          name: variant.name,
          price: variant.price,
          stock: variant.stock || 0,
          sku: variant.sku || null
        }))
      })
    }

    // Update modifiers (delete existing and recreate)
    await prisma.productModifier.deleteMany({
      where: { productId }
    })

    if (productData.modifiers && productData.modifiers.length > 0) {
      await prisma.productModifier.createMany({
        data: productData.modifiers.map((modifier: any) => ({
          productId,
          name: modifier.name,
          price: modifier.price,
          required: modifier.required
        }))
      })
    }

    return NextResponse.json({ product })

  } catch (error) {
    console.error('Error updating product:', error)
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 })
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ businessId: string; productId: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
    }

    const { businessId, productId } = await params
    const updates = await request.json()

    const product = await prisma.product.updateMany({
      where: {
        id: productId,
        businessId,
        business: {
          users: {
            some: {
              user: {
                email: session.user.email
              }
            }
          }
        }
      },
      data: updates
    })

    if (product.count === 0) {
      return NextResponse.json({ message: 'Product not found' }, { status: 404 })
    }

    return NextResponse.json({ message: 'Product updated successfully' })

  } catch (error) {
    console.error('Error updating product:', error)
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ businessId: string; productId: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
    }

    const { businessId, productId } = await params

    const deletedProduct = await prisma.product.deleteMany({
      where: {
        id: productId,
        businessId,
        business: {
          users: {
            some: {
              user: {
                email: session.user.email
              }
            }
          }
        }
      }
    })

    if (deletedProduct.count === 0) {
      return NextResponse.json({ message: 'Product not found' }, { status: 404 })
    }

    return NextResponse.json({ message: 'Product deleted successfully' })

  } catch (error) {
    console.error('Error deleting product:', error)
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 })
  }
}
