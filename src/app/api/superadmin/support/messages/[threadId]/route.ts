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

    return NextResponse.json({
      success: true,
      threadInfo,
      messages: messages.map(message => ({
        id: message.id,
        content: message.content,
        createdAt: message.createdAt.toISOString(),
        sender: message.sender,
        recipient: message.recipient,
        isRead: message.isRead
      }))
    })

  } catch (error) {
    console.error('Error fetching message thread:', error)
    return NextResponse.json(
      { error: 'Failed to fetch message thread' },
      { status: 500 }
    )
  }
}
