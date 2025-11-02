// src/app/api/superadmin/notifications/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { handleApiError, setSentryContext, setSentryUser, setSentryTags } from '@/lib/api-error-handler'
import { AuthenticationError, DatabaseError } from '@/lib/errors'
import * as Sentry from '@sentry/nextjs'

export async function GET(request: NextRequest) {
  try {
    // Set Sentry context
    setSentryContext({
      endpoint: '/api/superadmin/notifications',
      method: 'GET',
    })
    
    const session = await getServerSession(authOptions)
    
    // Set Sentry user context
    if (session?.user) {
      setSentryUser({
        id: session.user.id,
        email: session.user.email || undefined,
        role: session.user.role,
      })
    }
    
    if (!session) {
      throw new AuthenticationError('No session found')
    }
    
    if (session.user.role !== 'SUPER_ADMIN') {
      setSentryTags({
        unauthorized: 'true',
        userRole: session.user.role || 'none',
      })
      throw new AuthenticationError('SuperAdmin access required')
    }

    if (!session.user.id) {
      throw new AuthenticationError('User ID missing from session')
    }

    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const offset = (page - 1) * limit

    setSentryContext({
      endpoint: '/api/superadmin/notifications',
      method: 'GET',
      userId: session.user.id,
      pagination: { page, limit, offset },
    })

    // Get total count and unread count
    const [totalCount, unreadCount, notifications] = await Promise.all([
      prisma.notification.count({
        where: {
          userId: session.user.id
        }
      }).catch((error) => {
        Sentry.captureException(error, {
          tags: { operation: 'count_notifications' },
          extra: { userId: session.user.id },
        })
        throw new DatabaseError('Failed to count notifications', error, { userId: session.user.id })
      }),
      
      prisma.notification.count({
        where: {
          userId: session.user.id,
          isRead: false
        }
      }).catch((error) => {
        Sentry.captureException(error, {
          tags: { operation: 'count_unread_notifications' },
          extra: { userId: session.user.id },
        })
        throw new DatabaseError('Failed to count unread notifications', error, { userId: session.user.id })
      }),
      
      prisma.notification.findMany({
        where: {
          userId: session.user.id
        },
        orderBy: {
          createdAt: 'desc'
        },
        skip: offset,
        take: limit
      }).catch((error) => {
        Sentry.captureException(error, {
          tags: { operation: 'find_notifications' },
          extra: { userId: session.user.id, pagination: { page, limit, offset } },
        })
        throw new DatabaseError('Failed to fetch notifications', error, { 
          userId: session.user.id,
          pagination: { page, limit, offset },
        })
      })
    ])

    const totalPages = Math.ceil(totalCount / limit)

    return NextResponse.json({
      success: true,
      notifications: notifications.map(notification => ({
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
        totalCount,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1
      },
      unreadCount
    })

  } catch (error) {
    // Enhanced error handling with Sentry
    Sentry.captureException(error, {
      tags: {
        endpoint: 'superadmin_notifications',
        method: 'GET',
      },
      extra: {
        url: request.url,
      },
    })
    
    return handleApiError(error, {
      endpoint: '/api/superadmin/notifications',
      method: 'GET',
      url: request.url,
    })
  }
}
