// src/app/api/admin/stores/[businessId]/support/messages/[threadId]/reply/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { checkBusinessAccess } from '@/lib/api-helpers'
import { prisma } from '@/lib/prisma'
import { sendSupportMessageReceivedEmail } from '@/lib/email'

export async function POST(
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

    const body = await request.json()
    const { content } = body

    if (!content || !content.trim()) {
      return NextResponse.json(
        { error: 'Message content is required' },
        { status: 400 }
      )
    }

    // Verify thread exists
    const existingThread = await prisma.supportMessage.findFirst({
      where: {
        threadId,
        businessId
      }
    })

    if (!existingThread) {
      return NextResponse.json(
        { error: 'Thread not found' },
        { status: 404 }
      )
    }

    // Find the other participant in the thread
    const otherParticipant = await prisma.supportMessage.findFirst({
      where: {
        threadId,
        businessId,
        senderId: {
          not: access.session.user.id
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
        businessId,
        senderId: access.session.user.id,
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

    // Create notification for recipient
    await prisma.notification.create({
      data: {
        type: 'MESSAGE_RECEIVED',
        title: `New Message from ${message.sender.name}`,
        message: `"${content.trim().substring(0, 80)}${content.trim().length > 80 ? '...' : ''}"`,
        link: `/superadmin/support/messages/${threadId}`,
        userId: message.recipient.id
      }
    })

    // Get SuperAdmin email settings if recipient is SuperAdmin
    let notificationEmail = message.recipient.email
    if (message.recipient.role === 'SUPER_ADMIN') {
      const superAdminSettings = await prisma.superAdminSettings.findFirst({
        where: { userId: message.recipient.id },
        select: { primaryEmail: true }
      })
      notificationEmail = superAdminSettings?.primaryEmail || message.recipient.email
    }

    // Send email notification to recipient
    try {
      await sendSupportMessageReceivedEmail({
        to: notificationEmail,
        recipientName: message.recipient.name,
        senderName: message.sender.name,
        subject: `Re: Support Message`,
        content: content.trim(),
        businessName: business.name,
        messageUrl: `${process.env.NEXTAUTH_URL}/superadmin/support/messages/${threadId}`
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
