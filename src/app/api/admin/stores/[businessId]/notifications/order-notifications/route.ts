// src/app/api/admin/stores/[businessId]/notifications/order-notifications/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { checkBusinessAccess } from '@/lib/api-helpers'
import { prisma } from '@/lib/prisma'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ businessId: string }> }
) {
  try {
    const { businessId } = await params

    const access = await checkBusinessAccess(businessId)
    
    if (!access.authorized) {
      return NextResponse.json(
        { error: access.error },
        { status: access.status }
      )
    }

    // Get pagination parameters
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const offset = (page - 1) * limit

    // Get OrderNotifications for this business
    // These are tied to the business, not individual users
    const [orderNotifications, totalCount] = await Promise.all([
      prisma.orderNotification.findMany({
        where: {
          businessId
        },
        orderBy: {
          notifiedAt: 'desc'
        },
        skip: offset,
        take: limit
      }),
      prisma.orderNotification.count({
        where: {
          businessId
        }
      })
    ])

    return NextResponse.json({
      success: true,
      notifications: orderNotifications.map((notification: any) => ({
        id: notification.id,
        orderId: notification.orderId,
        orderNumber: notification.orderNumber,
        orderStatus: notification.orderStatus,
        customerName: notification.customerName,
        total: notification.total,
        notifiedAt: notification.notifiedAt.toISOString(),
        emailSent: notification.emailSent,
        emailError: notification.emailError
      })),
      pagination: {
        page,
        limit,
        total: totalCount,
        pages: Math.ceil(totalCount / limit)
      }
    })

  } catch (error) {
    console.error('Error fetching order notifications:', error)
    return NextResponse.json(
      { error: 'Failed to fetch order notifications' },
      { status: 500 }
    )
  }
}
