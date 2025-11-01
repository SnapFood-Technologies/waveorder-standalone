// src/app/api/admin/stores/[businessId]/notifications/route.ts
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

    // Get notifications for the logged-in user
    // When impersonating: get notifications for business users
    // When not impersonating: get notifications for the admin user
    let whereClause: any
    
    if (access.isImpersonating) {
      // SuperAdmin impersonating - get notifications for business users, not superadmin
      const businessUsers = await prisma.businessUser.findMany({
        where: { businessId },
        select: { userId: true }
      })
      const businessUserIds = businessUsers.map(bu => bu.userId)
      
      // Use business user IDs if any exist, otherwise fallback to superadmin
      if (businessUserIds.length > 0) {
        whereClause = { userId: { in: businessUserIds } }
      } else {
        whereClause = { userId: access.session.user.id }
      }
    } else {
      // Regular admin user - get their own notifications
      whereClause = { userId: access.session.user.id }
    }

    const [notifications, totalCount, unreadCount] = await Promise.all([
      prisma.notification.findMany({
        where: whereClause,
        orderBy: {
          createdAt: 'desc'
        },
        skip: offset,
        take: limit
      }),
      prisma.notification.count({
        where: whereClause
      }),
      prisma.notification.count({
        where: {
          ...whereClause,
          isRead: false
        }
      })
    ])

    return NextResponse.json({
      success: true,
      notifications: notifications.map((notification: any) => ({
        id: notification.id,
        type: notification.type,
        title: notification.title,
        message: notification.message,
        link: notification.link,
        isRead: notification.isRead,
        createdAt: notification.createdAt.toISOString()
      })),
      pagination: {
        page,
        limit,
        total: totalCount,
        pages: Math.ceil(totalCount / limit)
      },
      unreadCount
    })

  } catch (error) {
    console.error('Error fetching notifications:', error)
    return NextResponse.json(
      { error: 'Failed to fetch notifications' },
      { status: 500 }
    )
  }
}