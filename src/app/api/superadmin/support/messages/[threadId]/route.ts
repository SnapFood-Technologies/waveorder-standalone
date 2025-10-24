// src/app/api/superadmin/support/messages/[threadId]/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ threadId: string }> }
) {
  try {
    const { threadId } = await params
    const session = await getServerSession(authOptions)
    
    if (!session || session.user.role !== 'SUPER_ADMIN') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Get messages in this thread
    const messages = await prisma.supportMessage.findMany({
      where: {
        threadId,
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
        createdAt: 'asc'
      }
    })

    if (messages.length === 0) {
      return NextResponse.json(
        { error: 'Thread not found' },
        { status: 404 }
      )
    }

    // Get thread info from first message
    const firstMessage = messages[0]
    const threadInfo = {
      subject: firstMessage.subject,
      business: firstMessage.business
    }

    // Mark messages as read for current user
    await prisma.supportMessage.updateMany({
      where: {
        threadId,
        recipientId: session.user.id,
        isRead: false
      },
      data: {
        isRead: true,
        readAt: new Date()
      }
    })

    // Get participants (unique users in this thread)
    const participants = Array.from(new Set([
      ...messages.map(m => m.sender.id),
      ...messages.map(m => m.recipient.id)
    ])).map(userId => {
      const message = messages.find(m => m.sender.id === userId || m.recipient.id === userId)
      return message?.sender.id === userId ? message.sender : message?.recipient
    }).filter(Boolean)

    // Count unread messages for current user
    const unreadCount = messages.filter(m => 
      m.recipientId === session.user.id && !m.isRead
    ).length

    // Get support team name from settings
    const supportSettings = await prisma.superAdminSettings.findFirst({
      where: { userId: session.user.id },
      select: { supportTeamName: true }
    })

    const supportTeamName = supportSettings?.supportTeamName || 'WaveOrder Support Team'

    return NextResponse.json({
      success: true,
      thread: {
        threadId,
        subject: threadInfo.subject,
        business: threadInfo.business,
        participants,
        messages: messages.map(message => ({
          id: message.id,
          content: message.content,
          createdAt: message.createdAt.toISOString(),
          sender: {
            ...message.sender,
            // Replace superadmin name with support team name
            name: message.sender.id === session.user.id ? supportTeamName : message.sender.name
          },
          isRead: message.isRead
        })),
        unreadCount
      }
    })

  } catch (error) {
    console.error('Error fetching message thread:', error)
    return NextResponse.json(
      { error: 'Failed to fetch message thread' },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ threadId: string }> }
) {
  try {
    const { threadId } = await params
    const session = await getServerSession(authOptions)
    
    if (!session || session.user.role !== 'SUPER_ADMIN') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { markAsRead } = body

    if (markAsRead) {
      // Mark all messages in this thread as read for the current user
      await prisma.supportMessage.updateMany({
        where: {
          threadId,
          recipientId: session.user.id,
          isRead: false
        },
        data: {
          isRead: true,
          readAt: new Date()
        }
      })

      return NextResponse.json({
        success: true,
        message: 'Messages marked as read'
      })
    }

    return NextResponse.json(
      { error: 'Invalid request' },
      { status: 400 }
    )

  } catch (error) {
    console.error('Error updating message thread:', error)
    return NextResponse.json(
      { error: 'Failed to update message thread' },
      { status: 500 }
    )
  }
}
