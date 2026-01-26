// app/api/admin/stores/[businessId]/settings/notifications/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { checkBusinessAccess } from '@/lib/api-helpers'


export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ businessId: string }> }
) {
  try {
    const { businessId } = await params

    const access = await checkBusinessAccess(businessId)
    
    if (!access.authorized) {
      return NextResponse.json({ message: access.error }, { status: access.status })
    }

    const business = await prisma.business.findUnique({
      where: { id: businessId },
      select: {
        orderNotificationsEnabled: true,
        orderNotificationEmail: true,
        orderNotificationLastUpdate: true,
        notifyOnAdminCreatedOrders: true,
        notifyAdminOnPickedUpAndPaid: true,
        notifyAdminOnStatusUpdates: true,
        // Customer notification settings (global)
        customerNotificationEnabled: true,
        notifyCustomerOnConfirmed: true,
        notifyCustomerOnPreparing: true,
        notifyCustomerOnReady: true,
        notifyCustomerOnOutForDelivery: true,
        notifyCustomerOnDelivered: true,
        notifyCustomerOnCancelled: true,
        // Order-type specific settings
        notifyDeliveryOnConfirmed: true,
        notifyDeliveryOnPreparing: true,
        notifyDeliveryOnOutForDelivery: true,
        notifyDeliveryOnDelivered: true,
        notifyPickupOnConfirmed: true,
        notifyPickupOnPreparing: true,
        notifyPickupOnReady: true,
        notifyPickupOnDelivered: true,
        notifyDineInOnConfirmed: true,
        notifyDineInOnPreparing: true,
        notifyDineInOnReady: true,
        notifyDineInOnDelivered: true,
        email: true,
        currency: true,
        timeFormat: true,
        businessType: true
      }
    })

    if (!business) {
      return NextResponse.json({ message: 'Business not found' }, { status: 404 })
    }

    return NextResponse.json({ business })

  } catch (error) {
    console.error('Error fetching notification settings:', error)
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 })
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ businessId: string }> }
) {
  try {
    const { businessId } = await params

    const access = await checkBusinessAccess(businessId)
    
    if (!access.authorized) {
      return NextResponse.json({ message: access.error }, { status: access.status })
    }

    const data = await request.json()

    if (data.orderNotificationsEnabled && !data.orderNotificationEmail?.trim()) {
      return NextResponse.json({ 
        message: 'Email address is required when notifications are enabled' 
      }, { status: 400 })
    }

    const updatedBusiness = await prisma.business.update({
      where: { id: businessId },
      data: {
        orderNotificationsEnabled: data.orderNotificationsEnabled || false,
        orderNotificationEmail: data.orderNotificationsEnabled 
          ? data.orderNotificationEmail?.trim() || null 
          : null,
        notifyOnAdminCreatedOrders: data.notifyOnAdminCreatedOrders ?? false,
        notifyAdminOnPickedUpAndPaid: data.notifyAdminOnPickedUpAndPaid ?? true,
        notifyAdminOnStatusUpdates: data.notifyAdminOnStatusUpdates ?? false,
        orderNotificationLastUpdate: new Date(),
        // Customer notification settings (global)
        customerNotificationEnabled: data.customerNotificationEnabled ?? false,
        notifyCustomerOnConfirmed: data.notifyCustomerOnConfirmed ?? false,
        notifyCustomerOnPreparing: data.notifyCustomerOnPreparing ?? false,
        notifyCustomerOnReady: data.notifyCustomerOnReady ?? false,
        notifyCustomerOnOutForDelivery: data.notifyCustomerOnOutForDelivery ?? false,
        notifyCustomerOnDelivered: data.notifyCustomerOnDelivered ?? false,
        notifyCustomerOnCancelled: data.notifyCustomerOnCancelled ?? false,
        // Order-type specific settings
        notifyDeliveryOnConfirmed: data.notifyDeliveryOnConfirmed ?? false,
        notifyDeliveryOnPreparing: data.notifyDeliveryOnPreparing ?? false,
        notifyDeliveryOnOutForDelivery: data.notifyDeliveryOnOutForDelivery ?? false,
        notifyDeliveryOnDelivered: data.notifyDeliveryOnDelivered ?? false,
        notifyPickupOnConfirmed: data.notifyPickupOnConfirmed ?? false,
        notifyPickupOnPreparing: data.notifyPickupOnPreparing ?? false,
        notifyPickupOnReady: data.notifyPickupOnReady ?? false,
        notifyPickupOnDelivered: data.notifyPickupOnDelivered ?? false,
        notifyDineInOnConfirmed: data.notifyDineInOnConfirmed ?? false,
        notifyDineInOnPreparing: data.notifyDineInOnPreparing ?? false,
        notifyDineInOnReady: data.notifyDineInOnReady ?? false,
        notifyDineInOnDelivered: data.notifyDineInOnDelivered ?? false,
        updatedAt: new Date()
      },
      select: {
        orderNotificationsEnabled: true,
        orderNotificationEmail: true,
        orderNotificationLastUpdate: true,
        notifyOnAdminCreatedOrders: true,
        notifyAdminOnPickedUpAndPaid: true,
        notifyAdminOnStatusUpdates: true,
        customerNotificationEnabled: true,
        notifyCustomerOnConfirmed: true,
        notifyCustomerOnPreparing: true,
        notifyCustomerOnReady: true,
        notifyCustomerOnOutForDelivery: true,
        notifyCustomerOnDelivered: true,
        notifyCustomerOnCancelled: true,
        // Order-type specific settings
        notifyDeliveryOnConfirmed: true,
        notifyDeliveryOnPreparing: true,
        notifyDeliveryOnOutForDelivery: true,
        notifyDeliveryOnDelivered: true,
        notifyPickupOnConfirmed: true,
        notifyPickupOnPreparing: true,
        notifyPickupOnReady: true,
        notifyPickupOnDelivered: true,
        notifyDineInOnConfirmed: true,
        notifyDineInOnPreparing: true,
        notifyDineInOnReady: true,
        notifyDineInOnDelivered: true,
        email: true,
        currency: true,
        timeFormat: true,
        businessType: true
      }
    })

    return NextResponse.json({ business: updatedBusiness })

  } catch (error) {
    console.error('Error updating notification settings:', error)
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 })
  }
}