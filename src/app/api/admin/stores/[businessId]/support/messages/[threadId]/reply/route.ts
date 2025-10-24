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

    // Get business details
    const business = await prisma.business.findUnique({
      where: { id: businessId },
      select: { name: true }
    })

    if (!business) {
      return NextResponse.json(
        { error: 'Business not found' },
        { status: 404 }
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
    // First, get all messages in the thread to understand the participants
    const threadMessages = await prisma.supportMessage.findMany({
      where: {
        threadId,
        businessId
      },
      select: {
        senderId: true,
        recipientId: true
      }
    })

    console.log('🔍 Thread messages:', threadMessages)
    console.log('🔍 Current user ID:', access.session.user.id)

    // Find the other participant - could be sender or recipient
    let otherParticipantId = null
    
    for (const msg of threadMessages) {
      if (msg.senderId !== access.session.user.id) {
        otherParticipantId = msg.senderId
        break
      }
      if (msg.recipientId !== access.session.user.id) {
        otherParticipantId = msg.recipientId
        break
      }
    }

    console.log('🔍 Other participant ID:', otherParticipantId)

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
        businessId,
        senderId: access.session.user.id,
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
            email: true,
            role: true
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
    console.log('🔍 Recipient details:', {
      id: message.recipient.id,
      name: message.recipient.name,
      email: message.recipient.email,
      role: message.recipient.role
    })
    
    if (message.recipient.role === 'SUPER_ADMIN') {
      console.log('🔍 Recipient is SuperAdmin, checking settings...')
      let superAdminSettings = await prisma.superAdminSettings.findFirst({
        where: { userId: message.recipient.id },
        select: { primaryEmail: true }
      })
      
      // Create default settings if they don't exist
      if (!superAdminSettings) {
        console.log('🔍 No SuperAdmin settings found, creating defaults...')
        superAdminSettings = await prisma.superAdminSettings.create({
          data: {
            userId: message.recipient.id,
            primaryEmail: message.recipient.email,
            backupEmails: [],
            emailFrequency: 'IMMEDIATE',
            emailDigest: false,
            urgentOnly: false,
            supportTeamName: 'WaveOrder Support Team'
          },
          select: { primaryEmail: true }
        })
        console.log('🔍 Created default SuperAdmin settings:', superAdminSettings)
      }
      
      console.log('🔍 SuperAdmin settings found:', superAdminSettings)
      notificationEmail = superAdminSettings?.primaryEmail || message.recipient.email
      console.log('🔍 Final email to use:', notificationEmail)
    } else {
      console.log('🔍 Recipient is not SuperAdmin, using default email:', notificationEmail)
    }

    // Send email notification to recipient
    console.log('Attempting to send email with params:', {
      to: notificationEmail,
      recipientName: message.recipient.name,
      senderName: message.sender.name,
      businessName: business.name
    })
    
    try {
      const emailResult = await sendSupportMessageReceivedEmail({
        to: notificationEmail,
        // @ts-ignore
        recipientName: message.recipient.name,
        // @ts-ignore
        senderName: message.sender.name,
        // @ts-ignore
        subject: `Re: Support Message`,
        content: content.trim(),
        // @ts-ignore
        businessName: business.name,
        // @ts-ignore
        messageUrl: `${process.env.NEXTAUTH_URL}/superadmin/support/messages/${threadId}`
      })
      console.log('✅ Email sent successfully:', emailResult)
    } catch (emailError) {
      console.error('❌ Failed to send email notification:', emailError)
      console.error('Email error details:', {
        // @ts-ignore
        message: emailError.message,
        // @ts-ignore
        stack: emailError.stack,
        // @ts-ignore
        name: emailError.name
      })
      // Don't fail the request if email fails
    }

    return NextResponse.json({
      success: true,
      message: 'Reply sent successfully',
      // @ts-ignore
      message: {
        id: message.id,
        content: message.content,
        createdAt: message.createdAt.toISOString(),
        // @ts-ignore
        sender: message.sender,
        // @ts-ignore
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
