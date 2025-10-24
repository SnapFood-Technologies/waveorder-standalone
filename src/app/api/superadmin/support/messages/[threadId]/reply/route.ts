// src/app/api/superadmin/support/messages/[threadId]/reply/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { sendSupportMessageReceivedEmail } from '@/lib/email'

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
      },
      include: {
        business: {
          select: {
            id: true,
            name: true
          }
        }
      }
    })

    if (!existingMessage) {
      return NextResponse.json(
        { error: 'Thread not found' },
        { status: 404 }
      )
    }

    // Find the other participant in the thread
    // Look for a message where current user is the recipient, then get the sender
    // OR look for a message where current user is the sender, then get the recipient
    let otherParticipantId = null
    
    // First, try to find a message where current user is the recipient
    const messageToCurrentUser = await prisma.supportMessage.findFirst({
      where: {
        threadId,
        recipientId: session.user.id
      },
      select: {
        senderId: true
      }
    })
    
    if (messageToCurrentUser) {
      otherParticipantId = messageToCurrentUser.senderId
    } else {
      // If not found, look for a message where current user is the sender
      const messageFromCurrentUser = await prisma.supportMessage.findFirst({
        where: {
          threadId,
          senderId: session.user.id
        },
        select: {
          recipientId: true
        }
      })
      
      if (messageFromCurrentUser) {
        otherParticipantId = messageFromCurrentUser.recipientId
      }
    }

    if (!otherParticipantId) {
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
        recipientId: otherParticipantId
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
        link: `/admin/stores/${existingMessage.businessId}/support/messages/${threadId}`,
        userId: otherParticipantId
      }
    })

    // Send email notification
    try {
      await sendSupportMessageReceivedEmail({
        to: message.recipient.email,
        recipientName: message.recipient.name,
        senderName: supportSettings?.supportTeamName || 'WaveOrder Support Team',
        subject: `Re: Support Message`,
        content: content.trim(),
        businessName: existingMessage.business.name,
        messageUrl: `${process.env.NEXTAUTH_URL}/admin/stores/${existingMessage.businessId}/support/messages/${threadId}`
      })
    } catch (emailError) {
      console.error('Failed to send email notification:', emailError)
      // Don't fail the request if email fails
    }

    return NextResponse.json({
      success: true,
      message: 'Reply sent successfully',
      message: {
        id: message.id,
        content: message.content,
        createdAt: message.createdAt.toISOString(),
        sender: message.sender,
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
