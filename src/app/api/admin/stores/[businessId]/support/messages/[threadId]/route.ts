// src/app/api/admin/stores/[businessId]/support/messages/[threadId]/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { checkBusinessAccess } from '@/lib/api-helpers'
import { prisma } from '@/lib/prisma'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ businessId: string; threadId: string }> }
) {
  try {
    const { businessId, threadId } = await params

    const access = await checkBusinessAccess(businessId)
    
    if (!access.authorized) {
      return NextResponse.json(
        { error: access.error },
        { status: access.status }
      )
    }

    // Get messages in this thread
    const messages = await prisma.supportMessage.findMany({
      where: {
        threadId,
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
      business: {
        id: businessId,
        name: 'Business' // This would need to be fetched from business table
      }
    }

    // Mark messages as read for current user
    await prisma.supportMessage.updateMany({
      where: {
        threadId,
        businessId,
        recipientId: access.session.user.id,
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
