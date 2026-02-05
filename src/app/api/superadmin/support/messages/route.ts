// src/app/api/superadmin/support/messages/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { generateThreadId } from '@/lib/support-helpers'
import { sendSupportMessageReceivedEmail } from '@/lib/email'
import { handleApiError, setSentryContext, setSentryUser, setSentryTags } from '@/lib/api-error-handler'
import { AuthenticationError, DatabaseError, ValidationError } from '@/lib/errors'
import * as Sentry from '@sentry/nextjs'

export async function GET(request: NextRequest) {
  try {
    // Set Sentry context
    setSentryContext({
      endpoint: '/api/superadmin/support/messages',
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

    setSentryContext({
      endpoint: '/api/superadmin/support/messages',
      method: 'GET',
      userId: session.user.id,
    })

    // Get all message threads where superadmin is involved
    const messages = await prisma.supportMessage.findMany({
      where: {
        OR: [
          { senderId: session.user.id },
          { recipientId: session.user.id }
        ]
      },
      include: {
        sender: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        recipient: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        business: {
          select: {
            id: true,
            name: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    }).catch((error) => {
      Sentry.captureException(error, {
        tags: { operation: 'find_support_messages' },
        extra: { userId: session.user.id },
      })
      throw new DatabaseError('Failed to fetch support messages', error, { userId: session.user.id })
    })

    // Group messages by threadId
    const threadMap = new Map()
    
    messages.forEach(message => {
      if (!threadMap.has(message.threadId)) {
        threadMap.set(message.threadId, {
          threadId: message.threadId,
          subject: message.subject,
          business: message.business,
          messages: [],
          unreadCount: 0,
          participants: new Set()
        })
      }
      
      threadMap.get(message.threadId).messages.push(message)
      if (!message.isRead && message.recipientId === session.user.id) {
        threadMap.get(message.threadId).unreadCount++
      }
      
      // Add participants
      threadMap.get(message.threadId).participants.add(message.sender)
      threadMap.get(message.threadId).participants.add(message.recipient)
    })

    // Convert to array and get latest message for each thread
    // Get support team name from settings
    const supportSettings = await prisma.superAdminSettings.findFirst({
      where: { userId: session.user.id },
      select: { supportTeamName: true }
    }).catch((error) => {
      Sentry.captureException(error, {
        tags: { operation: 'find_support_settings' },
        extra: { userId: session.user.id },
      })
      // Don't fail the request if settings fetch fails, just use default
      console.warn('Failed to fetch support settings:', error)
      return null
    })

    const supportTeamName = supportSettings?.supportTeamName || 'WaveOrder Support Team'

    const threadList = Array.from(threadMap.values()).map(thread => {
      const sortedMessages = thread.messages.sort((a: any, b: any) => 
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      )
      const lastMessage = sortedMessages[0]
      
      // Get subject from first message that has a subject, or use a fallback
      const firstMessageWithSubject = thread.messages.find((msg: any) => msg.subject && msg.subject.trim() !== '')
      const threadSubject = firstMessageWithSubject?.subject || thread.subject || 'Message Thread'
      
      return {
        threadId: thread.threadId,
        subject: threadSubject,
        lastMessage: {
          content: lastMessage.content,
          createdAt: lastMessage.createdAt.toISOString(),
          sender: {
            ...lastMessage.sender,
            // Replace superadmin name with support team name
            name: lastMessage.sender.id === session.user.id ? supportTeamName : lastMessage.sender.name
          }
        },
        unreadCount: thread.unreadCount,
        totalMessages: thread.messages.length,
        business: thread.business,
        participants: Array.from(thread.participants)
      }
    })

    return NextResponse.json({
      success: true,
      threads: threadList
    })

  } catch (error) {
    // Construct actual URL from headers
    const host = request.headers.get('host') || request.headers.get('x-forwarded-host')
    const protocol = request.headers.get('x-forwarded-proto') || (process.env.NODE_ENV === 'production' ? 'https' : 'http')
    const actualUrl = host ? `${protocol}://${host}${new URL(request.url).pathname}` : request.url

    // Enhanced error handling with Sentry
    Sentry.captureException(error, {
      tags: {
        endpoint: 'superadmin_support_messages',
        method: 'GET',
      },
      extra: {
        url: actualUrl,
      },
    })
    
    return handleApiError(error, {
      endpoint: '/api/superadmin/support/messages',
      method: 'GET',
      url: actualUrl,
    })
  }
}

export async function POST(request: NextRequest) {
  try {
    // Set Sentry context
    setSentryContext({
      endpoint: '/api/superadmin/support/messages',
      method: 'POST',
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

    const body = await request.json().catch((error) => {
      throw new ValidationError('Invalid JSON in request body', { error: error.message })
    })
    
    const { subject, content, businessId, recipientId } = body

    if (!subject || !subject.trim()) {
      throw new ValidationError('Subject is required')
    }
    
    if (!content || !content.trim()) {
      throw new ValidationError('Content is required')
    }
    
    if (!businessId) {
      throw new ValidationError('BusinessId is required')
    }
    
    if (!recipientId) {
      throw new ValidationError('RecipientId is required')
    }

    setSentryContext({
      endpoint: '/api/superadmin/support/messages',
      method: 'POST',
      userId: session.user.id,
      businessId,
      recipientId,
    })

    // Generate unique thread ID
    const threadId = generateThreadId()

    // Create message
    const message = await prisma.supportMessage.create({
      data: {
        threadId,
        subject,
        content,
        businessId,
        senderId: session.user.id,
        recipientId
      },
      include: {
        sender: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        recipient: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        business: {
          select: {
            id: true,
            name: true
          }
        }
      }
    }).catch((error) => {
      Sentry.captureException(error, {
        tags: { operation: 'create_support_message' },
        extra: { 
          userId: session.user.id,
          businessId,
          recipientId,
          threadId,
        },
      })
      throw new DatabaseError('Failed to create support message', error, {
        businessId,
        recipientId,
        threadId,
      })
    })

    // Get support team name and notification settings
    const supportSettings = await prisma.superAdminSettings.findFirst({
      where: { userId: session.user.id },
      select: { 
        supportTeamName: true,
        businessNotificationsMessageReceived: true
      }
    }).catch((error) => {
      Sentry.captureException(error, {
        tags: { operation: 'find_support_settings' },
        extra: { userId: session.user.id },
      })
      // Don't fail the request if settings fetch fails, just use default
      console.warn('Failed to fetch support settings:', error)
      return null
    })
    
    const supportTeamName = supportSettings?.supportTeamName || 'WaveOrder Support Team'
    const shouldSendEmail = supportSettings?.businessNotificationsMessageReceived ?? true

    // Create notification for recipient
    await prisma.notification.create({
      data: {
        type: 'MESSAGE_RECEIVED',
        title: `New Message from ${supportTeamName}`,
        message: `"${content.trim().substring(0, 80)}${content.trim().length > 80 ? '...' : ''}"`,
        link: `/admin/stores/${businessId}/support/messages/${threadId}`,
        userId: recipientId
      }
    }).catch((error) => {
      Sentry.captureException(error, {
        tags: { operation: 'create_notification' },
        extra: { 
          recipientId,
          threadId,
          businessId,
        },
      })
      // Don't fail the request if notification creation fails, just log it
      console.error('Failed to create notification:', error)
    })

    // Send email notification to business admin if enabled
    if (shouldSendEmail) {
      try {
        await sendSupportMessageReceivedEmail({
          to: message.recipient.email,
          // @ts-ignore
          recipientName: message.recipient.name,
          // @ts-ignore
          senderName: supportTeamName,
          subject: subject,
          content: content.trim(),
          // @ts-ignore
          businessName: message.business.name,
          // @ts-ignore
          messageUrl: `${process.env.NEXTAUTH_URL}/admin/stores/${businessId}/support/messages/${threadId}`
        })
        console.log('✅ New message email sent successfully to business admin')
      } catch (emailError) {
        console.error('❌ Failed to send new message email to business admin:', emailError)
        Sentry.captureException(emailError, {
          tags: { operation: 'send_message_email' },
          extra: { 
            recipientId,
            businessId,
            threadId,
          },
        })
        // Don't fail the request if email fails
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Message sent successfully',
      thread: {
        threadId: message.threadId,
        subject: message.subject,
        lastMessage: {
          content: message.content,
          createdAt: message.createdAt.toISOString(),
          sender: message.sender
        },
        unreadCount: 0,
        totalMessages: 1,
        business: message.business,
        participants: [message.sender, message.recipient]
      }
    })

  } catch (error) {
    // Construct actual URL from headers
    const host = request.headers.get('host') || request.headers.get('x-forwarded-host')
    const protocol = request.headers.get('x-forwarded-proto') || (process.env.NODE_ENV === 'production' ? 'https' : 'http')
    const actualUrl = host ? `${protocol}://${host}${new URL(request.url).pathname}` : request.url

    // Enhanced error handling with Sentry
    Sentry.captureException(error, {
      tags: {
        endpoint: 'superadmin_support_messages',
        method: 'POST',
      },
      extra: {
        url: actualUrl,
      },
    })
    
    return handleApiError(error, {
      endpoint: '/api/superadmin/support/messages',
      method: 'POST',
      url: actualUrl,
    })
  }
}
