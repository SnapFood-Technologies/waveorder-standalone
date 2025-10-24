// src/app/api/superadmin/support/messages/[threadId]/reply/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function POST(
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
    const { content } = body

    if (!content || !content.trim()) {
      return NextResponse.json(
        { error: 'Message content is required' },
        { status: 400 }
      )
    }

    // Verify thread exists and get the other participant
    const existingMessage = await prisma.supportMessage.findFirst({
      where: {
        threadId,
        OR: [
          { senderId: session.user.id },
          { recipientId: session.user.id }
        ]
      }
    })

    if (!existingMessage) {
      return NextResponse.json(
        { error: 'Thread not found' },
        { status: 404 }
      )
    }

    // Find the other participant in the thread
    const otherParticipant = await prisma.supportMessage.findFirst({
      where: {
        threadId,
        senderId: {
          not: session.user.id
        }
      },
      select: {
        senderId: true
      }
    })

    if (!otherParticipant) {
      return NextResponse.json(
        { error: 'Cannot find thread participant' },
        { status: 400 }
      )
    }

    // Create reply message
    const message = await prisma.supportMessage.create({
      data: {
        threadId,
        content: content.trim(),
        businessId: existingMessage.businessId,
        senderId: session.user.id,
        recipientId: otherParticipant.senderId
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
        }
      }
    })

    // TODO: Send notification to recipient
    // TODO: Send email notification

    return NextResponse.json({
      success: true,
      message: 'Reply sent successfully',
      message: {
        id: message.id,
        content: message.content,
        createdAt: message.createdAt.toISOString(),
        sender: message.sender,
        recipient: message.recipient,
        isRead: message.isRead
      }
    })

  } catch (error) {
    console.error('Error sending reply:', error)
    return NextResponse.json(
      { error: 'Failed to send reply' },
      { status: 500 }
    )
  }
}
