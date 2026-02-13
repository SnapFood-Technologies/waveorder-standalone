// src/app/api/admin/stores/[businessId]/orders/[orderId]/assign-delivery/route.ts
// Assign/unassign delivery person to order and create/update delivery earning
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { checkBusinessAccess } from '@/lib/api-helpers'

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ businessId: string; orderId: string }> }
) {
  try {
    const { businessId, orderId } = await params

    const access = await checkBusinessAccess(businessId)
    
    if (!access.authorized) {
      return NextResponse.json({ message: access.error }, { status: access.status })
    }

    // Check if delivery management is enabled for this business
    const business = await prisma.business.findUnique({
      where: { id: businessId },
      select: { enableDeliveryManagement: true }
    })

    if (!business?.enableDeliveryManagement) {
      return NextResponse.json({ 
        message: 'Delivery management is not enabled for this business. Please contact support to enable this feature.',
        code: 'FEATURE_NOT_ENABLED'
      }, { status: 403 })
    }

    const body = await request.json()
    const { deliveryPersonId } = body // null to unassign

    // Get order with business info
    const order = await prisma.order.findFirst({
      where: {
        id: orderId,
        businessId
      },
      include: {
        business: {
          select: {
            currency: true
          }
        },
        deliveryEarning: true
      }
    })

    if (!order) {
      return NextResponse.json({ message: 'Order not found' }, { status: 404 })
    }

    // Only allow assignment for DELIVERY orders
    if (order.type !== 'DELIVERY') {
      return NextResponse.json({ 
        message: 'Delivery assignment is only available for delivery orders' 
      }, { status: 400 })
    }

    // If assigning a delivery person
    if (deliveryPersonId) {
      // Verify delivery person exists and is a member of this business with DELIVERY role
      const deliveryPerson = await prisma.businessUser.findFirst({
        where: {
          userId: deliveryPersonId,
          businessId,
          role: 'DELIVERY'
        }
      })

      if (!deliveryPerson) {
        return NextResponse.json({ 
          message: 'Delivery person not found or does not have DELIVERY role' 
        }, { status: 400 })
      }

      // Update order with delivery person assignment
      await prisma.order.update({
        where: { id: orderId },
        data: {
          deliveryPersonId
        }
      })

      // Create or update delivery earning
      if (order.deliveryEarning) {
        // Update existing earning
        await prisma.deliveryEarning.update({
          where: { id: order.deliveryEarning.id },
          data: {
            deliveryPersonId,
            amount: order.deliveryFee,
            status: 'PENDING'
          }
        })
      } else {
        // Create new earning
        await prisma.deliveryEarning.create({
          data: {
            businessId,
            orderId,
            deliveryPersonId,
            amount: order.deliveryFee,
            currency: order.business.currency || 'EUR',
            status: 'PENDING'
          }
        })
      }

      return NextResponse.json({
        success: true,
        message: 'Delivery person assigned successfully'
      })
    } else {
      // Unassigning delivery person
      await prisma.order.update({
        where: { id: orderId },
        data: {
          deliveryPersonId: null
        }
      })

      // Cancel existing earning if it exists
      if (order.deliveryEarning) {
        await prisma.deliveryEarning.update({
          where: { id: order.deliveryEarning.id },
          data: {
            status: 'CANCELLED'
          }
        })
      }

      return NextResponse.json({
        success: true,
        message: 'Delivery person unassigned successfully'
      })
    }

  } catch (error) {
    console.error('Error assigning delivery person:', error)
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    )
  }
}
