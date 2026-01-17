// src/lib/support-helpers.ts
import { prisma } from '@/lib/prisma'
import { NotificationType } from '@prisma/client'
import {
  sendSupportTicketCreatedEmail,
  sendSupportTicketUpdatedEmail,
  sendSupportTicketCommentEmail,
  sendSupportMessageReceivedEmail
} from '@/lib/email'

/**
 * Generate a unique ticket number in format TKT-YYYY-NNNNN
 */
export function generateTicketNumber(): string {
  const year = new Date().getFullYear()
  const randomNum = Math.floor(Math.random() * 100000).toString().padStart(5, '0')
  return `TKT-${year}-${randomNum}`
}

/**
 * Generate a unique thread ID for messaging
 */
export function generateThreadId(): string {
  const timestamp = Date.now().toString(36)
  const randomStr = Math.random().toString(36).substring(2, 8)
  return `thread_${timestamp}_${randomStr}`
}

/**
 * Create a notification for a user
 */
export async function createNotification({
  userId,
  type,
  title,
  message,
  link
}: {
  userId: string
  type: NotificationType
  title: string
  message: string
  link?: string
}) {
  try {
    const notification = await prisma.notification.create({
      data: {
        userId,
        type,
        title,
        message,
        link
      }
    })
    return notification
  } catch (error) {
    console.error('Failed to create notification:', error)
    throw new Error('Failed to create notification')
  }
}

/**
 * Send ticket notification (both email and in-app)
 */
export async function sendTicketNotification({
  ticketId,
  type,
  recipientId,
  businessName,
  ticketNumber,
  subject,
  description,
  priority,
  ticketType,
  status,
  updatedBy,
  comment,
  commentAuthor
}: {
  ticketId: string
  type: 'created' | 'updated' | 'resolved' | 'commented'
  recipientId: string
  businessName: string
  ticketNumber: string
  subject: string
  description?: string
  priority?: string
  ticketType?: string
  status?: string
  updatedBy?: string
  comment?: string
  commentAuthor?: string
}) {
  try {
    // Create in-app notification
    const notificationType = type === 'created' ? 'TICKET_CREATED' : 
                            type === 'updated' ? 'TICKET_UPDATED' :
                            type === 'resolved' ? 'TICKET_RESOLVED' : 'TICKET_UPDATED'

    const title = type === 'created' ? 'New Support Ticket Created' :
                  type === 'updated' ? 'Support Ticket Updated' :
                  type === 'resolved' ? 'Support Ticket Resolved' : 'New Comment on Ticket'

    const message = type === 'created' ? `A new support ticket "${subject}" has been created for ${businessName}` :
                    type === 'updated' ? `Support ticket "${subject}" has been updated` :
                    type === 'resolved' ? `Support ticket "${subject}" has been resolved` :
                    `A new comment has been added to ticket "${subject}"`

    await createNotification({
      userId: recipientId,
      type: notificationType as NotificationType,
      title,
      message,
      link: `/admin/stores/tickets/${ticketId}`
    })

    // Send email notification
    try {
      const recipient = await prisma.user.findUnique({
        where: { id: recipientId },
        select: { email: true, name: true }
      })

      if (!recipient || !recipient.email) {
        console.warn(`User ${recipientId} not found or has no email for ticket notification`)
        return
      }

      const ticketUrl = `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/admin/stores/tickets/${ticketId}`
      const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000'

      if (type === 'created') {
        await sendSupportTicketCreatedEmail({
          to: recipient.email,
          // @ts-ignore
          superadminName: recipient.name || 'Support Team',
          ticketNumber,
          subject,
          description: description || '',
          businessName,
          // @ts-ignore
          createdBy: recipient.name || 'Unknown',
          priority: priority || 'MEDIUM',
          type: ticketType || 'GENERAL',
          ticketUrl: `${baseUrl}/superadmin/support/tickets/${ticketId}`
        })
      } else if (type === 'commented' && comment && commentAuthor) {
        await sendSupportTicketCommentEmail({
          to: recipient.email,
          recipientName: recipient.name || 'User',
          ticketNumber,
          subject,
          comment,
          commentAuthor,
          businessName,
          ticketUrl: `${baseUrl}/admin/stores/tickets/${ticketId}`
        })
      } else if (type === 'updated' || type === 'resolved') {
        await sendSupportTicketUpdatedEmail({
          to: recipient.email,
          // @ts-ignore
          adminName: recipient.name || 'User',
          ticketNumber,
          subject,
          status: status || (type === 'resolved' ? 'RESOLVED' : 'UPDATED'),
          businessName,
          updatedBy: updatedBy || 'Support Team',
          ticketUrl: `${baseUrl}/admin/stores/tickets/${ticketId}`
        })
      }

      console.log(`Ticket notification email sent for ${type} ticket ${ticketNumber}`)
    } catch (emailError) {
      console.error('Failed to send ticket email notification:', emailError)
      // Don't throw - in-app notification was successful
    }
  } catch (error) {
    console.error('Failed to send ticket notification:', error)
    throw new Error('Failed to send ticket notification')
  }
}

/**
 * Send message notification (both email and in-app)
 */
export async function sendMessageNotification({
  messageId,
  recipientId,
  senderName,
  businessName,
  subject,
  content,
  threadId
}: {
  messageId: string
  recipientId: string
  senderName: string
  businessName: string
  subject?: string
  content?: string
  threadId?: string
}) {
  try {
    // Create in-app notification
    await createNotification({
      userId: recipientId,
      type: 'MESSAGE_RECEIVED',
      title: 'New Message Received',
      message: `You have received a new message from ${senderName}${businessName ? ` (${businessName})` : ''}${subject ? `: ${subject}` : ''}`,
      link: threadId ? `/admin/stores/messages/${threadId}` : `/admin/stores/messages/${messageId}`
    })

    // Send email notification
    try {
      const recipient = await prisma.user.findUnique({
        where: { id: recipientId },
        select: { email: true, name: true }
      })

      if (!recipient || !recipient.email) {
        console.warn(`User ${recipientId} not found or has no email for message notification`)
        return
      }

      const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000'
      const messageUrl = threadId 
        ? `${baseUrl}/admin/stores/messages/${threadId}`
        : `${baseUrl}/admin/stores/messages/${messageId}`

      await sendSupportMessageReceivedEmail({
        to: recipient.email,
        recipientName: recipient.name || 'User',
        senderName,
        subject: subject || 'New Message',
        content: content || 'You have received a new message.',
        businessName,
        messageUrl
      })

      console.log(`Message notification email sent to user ${recipientId}`)
    } catch (emailError) {
      console.error('Failed to send message email notification:', emailError)
      // Don't throw - in-app notification was successful
    }
  } catch (error) {
    console.error('Failed to send message notification:', error)
    throw new Error('Failed to send message notification')
  }
}

/**
 * Get unread notification count for a user
 */
export async function getUnreadNotificationCount(userId: string): Promise<number> {
  try {
    const count = await prisma.notification.count({
      where: {
        userId,
        isRead: false
      }
    })
    return count
  } catch (error) {
    console.error('Failed to get unread notification count:', error)
    return 0
  }
}

/**
 * Mark notification as read
 */
export async function markNotificationAsRead(notificationId: string, userId: string) {
  try {
    await prisma.notification.updateMany({
      where: {
        id: notificationId,
        userId
      },
      data: {
        isRead: true,
        readAt: new Date()
      }
    })
  } catch (error) {
    console.error('Failed to mark notification as read:', error)
    throw new Error('Failed to mark notification as read')
  }
}

/**
 * Mark all notifications as read for a user
 */
export async function markAllNotificationsAsRead(userId: string) {
  try {
    await prisma.notification.updateMany({
      where: {
        userId,
        isRead: false
      },
      data: {
        isRead: true,
        readAt: new Date()
      }
    })
  } catch (error) {
    console.error('Failed to mark all notifications as read:', error)
    throw new Error('Failed to mark all notifications as read')
  }
}

/**
 * Get notifications for a user with pagination
 */
export async function getUserNotifications({
  userId,
  page = 1,
  limit = 20,
  type
}: {
  userId: string
  page?: number
  limit?: number
  type?: NotificationType
}) {
  try {
    const skip = (page - 1) * limit
    
    const where = {
      userId,
      ...(type && { type })
    }

    const [notifications, total] = await Promise.all([
      prisma.notification.findMany({
        where,
        orderBy: {
          createdAt: 'desc'
        },
        skip,
        take: limit
      }),
      prisma.notification.count({ where })
    ])

    return {
      notifications,
      total,
      page,
      totalPages: Math.ceil(total / limit)
    }
  } catch (error) {
    console.error('Failed to get user notifications:', error)
    throw new Error('Failed to get user notifications')
  }
}

/**
 * Check if support module should be shown (not when impersonating)
 */
export function shouldShowSupportModule(session: any, pathname: string): boolean {
  const isImpersonating = session?.user?.role === 'SUPER_ADMIN' && pathname.startsWith('/admin')
  return !isImpersonating
}

/**
 * Get ticket status badge color
 */
export function getTicketStatusColor(status: string): string {
  switch (status) {
    case 'OPEN':
      return 'bg-blue-100 text-blue-800'
    case 'IN_PROGRESS':
      return 'bg-yellow-100 text-yellow-800'
    case 'WAITING_RESPONSE':
      return 'bg-orange-100 text-orange-800'
    case 'RESOLVED':
      return 'bg-green-100 text-green-800'
    case 'CLOSED':
      return 'bg-gray-100 text-gray-800'
    default:
      return 'bg-gray-100 text-gray-800'
  }
}

/**
 * Get ticket priority badge color
 */
export function getTicketPriorityColor(priority: string): string {
  switch (priority) {
    case 'LOW':
      return 'bg-gray-100 text-gray-800'
    case 'MEDIUM':
      return 'bg-blue-100 text-blue-800'
    case 'HIGH':
      return 'bg-orange-100 text-orange-800'
    case 'URGENT':
      return 'bg-red-100 text-red-800'
    default:
      return 'bg-gray-100 text-gray-800'
  }
}

/**
 * Get ticket type display name
 */
export function getTicketTypeDisplayName(type: string): string {
  switch (type) {
    case 'GENERAL':
      return 'General'
    case 'TECHNICAL':
      return 'Technical'
    case 'BILLING':
      return 'Billing'
    case 'FEATURE_REQUEST':
      return 'Feature Request'
    case 'BUG_REPORT':
      return 'Bug Report'
    default:
      return type
  }
}

/**
 * Get notification type display name
 */
export function getNotificationTypeDisplayName(type: NotificationType): string {
  switch (type) {
    case 'TICKET_CREATED':
      return 'Ticket Created'
    case 'TICKET_UPDATED':
      return 'Ticket Updated'
    case 'TICKET_RESOLVED':
      return 'Ticket Resolved'
    case 'MESSAGE_RECEIVED':
      return 'Message Received'
    case 'SYSTEM_UPDATE':
      return 'System Update'
    default:
      return type
  }
}
