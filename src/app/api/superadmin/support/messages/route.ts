// src/app/api/superadmin/support/messages/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { generateThreadId } from '@/lib/support-helpers'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || session.user.role !== 'SUPER_ADMIN') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

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
    console.error('Error fetching message threads:', error)
    return NextResponse.json(
      { error: 'Failed to fetch message threads' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || session.user.role !== 'SUPER_ADMIN') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { subject, content, businessId, recipientId } = body

    if (!subject || !content || !businessId || !recipientId) {
      return NextResponse.json(
        { error: 'Subject, content, businessId, and recipientId are required' },
        { status: 400 }
      )
    }

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
    })

    // Get support team name from settings
    const supportSettings = await prisma.superAdminSettings.findFirst({
      where: { userId: session.user.id },
      select: { supportTeamName: true }
    })
    const supportTeamName = supportSettings?.supportTeamName || 'WaveOrder Support Team'

    // Create notification for recipient
    await prisma.notification.create({
      data: {
        type: 'MESSAGE_RECEIVED',
        title: `New Message from ${supportTeamName}`,
        message: `"${content.trim().substring(0, 80)}${content.trim().length > 80 ? '...' : ''}"`,
        link: `/admin/stores/${businessId}/support/messages/${threadId}`,
        userId: recipientId
      }
    })

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
    console.error('Error sending message:', error)
    return NextResponse.json(
      { error: 'Failed to send message' },
      { status: 500 }
    )
  }
}
