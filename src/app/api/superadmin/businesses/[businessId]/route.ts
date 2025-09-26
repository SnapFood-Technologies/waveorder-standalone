// app/api/superadmin/businesses/[businessId]/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { PrismaClient } from '@prisma/client'
import { authOptions } from '@/lib/auth'

const prisma = new PrismaClient()

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ businessId: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || session.user.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
    }

    const { businessId } = await params

    if (!businessId) {
      return NextResponse.json({ message: 'Business ID is required' }, { status: 400 })
    }

    // Check if business exists
    const business = await prisma.business.findUnique({
      where: { id: businessId },
      include: {
        users: {
          include: { user: true }
        }
      }
    })

    if (!business) {
      return NextResponse.json({ message: 'Business not found' }, { status: 404 })
    }

    // Start a transaction to delete everything related to the business
    await prisma.$transaction(async (tx) => {
      // Delete in the correct order to avoid foreign key constraints
      
      // 1. Delete order items first
      await tx.orderItem.deleteMany({
        where: {
          order: {
            businessId: businessId
          }
        }
      })

      // 2. Delete order notifications
      await tx.orderNotification.deleteMany({
        where: { businessId: businessId }
      })

      // 3. Delete orders
      await tx.order.deleteMany({
        where: { businessId: businessId }
      })

      // 4. Delete product variants and modifiers
      await tx.productVariant.deleteMany({
        where: {
          product: {
            businessId: businessId
          }
        }
      })

      await tx.productModifier.deleteMany({
        where: {
          product: {
            businessId: businessId
          }
        }
      })

      // 5. Delete inventory activities
      await tx.inventoryActivity.deleteMany({
        where: { businessId: businessId }
      })

      // 6. Delete products
      await tx.product.deleteMany({
        where: { businessId: businessId }
      })

      // 7. Delete categories
      await tx.category.deleteMany({
        where: { businessId: businessId }
      })

      // 8. Delete customers
      await tx.customer.deleteMany({
        where: { businessId: businessId }
      })

      // 9. Delete delivery zones
      await tx.deliveryZone.deleteMany({
        where: { businessId: businessId }
      })

      // 10. Delete team invitations
      await tx.teamInvitation.deleteMany({
        where: { businessId: businessId }
      })

      // 11. Delete analytics
      await tx.analytics.deleteMany({
        where: { businessId: businessId }
      })

      // 12. Delete business users relationships
      await tx.businessUser.deleteMany({
        where: { businessId: businessId }
      })

      // 13. Finally delete the business itself
      await tx.business.delete({
        where: { id: businessId }
      })

      // 14. Delete the owner user if they have no other businesses
      for (const businessUser of business.users) {
        if (businessUser.role === 'OWNER') {
          const userOtherBusinesses = await tx.businessUser.findMany({
            where: { 
              userId: businessUser.userId,
              businessId: { not: businessId }
            }
          })

          // If user has no other businesses, delete the user account
          if (userOtherBusinesses.length === 0) {
            // Delete user's accounts and sessions first
            await tx.account.deleteMany({
              where: { userId: businessUser.userId }
            })

            await tx.session.deleteMany({
              where: { userId: businessUser.userId }
            })

            // Delete the user
            await tx.user.delete({
              where: { id: businessUser.userId }
            })
          }
        }
      }
    })

    return NextResponse.json({ 
      success: true,
      message: `Business "${business.name}" and all associated data have been permanently deleted.`
    })

  } catch (error) {
    console.error('Error deleting business:', error)
    
    // Check if it's a foreign key constraint error
    if (error instanceof Error && error.message.includes('foreign key constraint')) {
      return NextResponse.json(
        { message: 'Cannot delete business due to existing dependencies. Please contact support.' },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ businessId: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || session.user.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
    }

    const { businessId } = await params

    const business = await prisma.business.findUnique({
      where: { id: businessId },
      include: {
        users: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                createdAt: true
              }
            }
          }
        },
        _count: {
          select: {
            orders: true,
            customers: true,
            products: true,
            categories: true
          }
        }
      }
    })

    if (!business) {
      return NextResponse.json({ message: 'Business not found' }, { status: 404 })
    }

    return NextResponse.json({ business })

  } catch (error) {
    console.error('Error fetching business:', error)
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    )
  }
}