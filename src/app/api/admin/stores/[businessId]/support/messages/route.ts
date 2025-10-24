// src/app/api/admin/stores/[businessId]/support/messages/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { checkBusinessAccess } from '@/lib/api-helpers'
import { prisma } from '@/lib/prisma'
import { generateThreadId } from '@/lib/support-helpers'

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

    // Get message threads for this business
    const threads = await prisma.supportMessage.findMany({
      where: {
        businessId
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
    })

    // Group messages by threadId
    const threadMap = new Map()
    
    threads.forEach(message => {
      if (!threadMap.has(message.threadId)) {
        threadMap.set(message.threadId, {
          threadId: message.threadId,
          subject: message.subject,
          business: message.business,
          messages: [],
          unreadCount: 0
        })
      }
      
      threadMap.get(message.threadId).messages.push(message)
      if (!message.isRead && message.recipientId === access.session.user.id) {
        threadMap.get(message.threadId).unreadCount++
      }
    })

    // Convert to array and get latest message for each thread
    const threadList = Array.from(threadMap.values()).map(thread => {
      const sortedMessages = thread.messages.sort((a: any, b: any) => 
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      )
      const lastMessage = sortedMessages[0]
      
      return {
        threadId: thread.threadId,
        subject: thread.subject,
        lastMessage: {
          content: lastMessage.content,
          createdAt: lastMessage.createdAt.toISOString(),
          sender: lastMessage.sender
        },
        unreadCount: thread.unreadCount,
        totalMessages: thread.messages.length,
        business: thread.business
      }
    })

    return NextResponse.json({
      success: true,
      threads: threadList
    })

  } catch (error) {
    console.error('Error fetching message threads:', error)
    return NextResponse.json(
      { error: 'Failed to fetch message threads' },
      { status: 500 }
    )
  }
}

export async function POST(
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

    const body = await request.json()
    const { subject, content } = body

    if (!subject || !content) {
      return NextResponse.json(
        { error: 'Subject and content are required' },
        { status: 400 }
      )
    }

    // Generate unique thread ID
    const threadId = generateThreadId()

    // Find a superadmin user to send the message to
    const superAdmin = await prisma.user.findFirst({
      where: {
        role: 'SUPER_ADMIN'
      }
    })

    if (!superAdmin) {
      return NextResponse.json(
        { error: 'No support team available' },
        { status: 500 }
      )
    }

    // Create message
    const message = await prisma.supportMessage.create({
      data: {
        threadId,
        subject,
        content,
        businessId,
        senderId: access.session.user.id,
        recipientId: superAdmin.id
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
    })

    // TODO: Send notification to superadmin
    // TODO: Send email notification

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
        business: message.business
      }
    })

  } catch (error) {
    console.error('Error sending message:', error)
    return NextResponse.json(
      { error: 'Failed to send message' },
      { status: 500 }
    )
  }
}
