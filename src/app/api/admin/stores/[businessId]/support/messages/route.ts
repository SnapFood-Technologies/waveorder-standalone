// src/app/api/admin/stores/[businessId]/support/messages/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { checkBusinessAccess } from '@/lib/api-helpers'
import { prisma } from '@/lib/prisma'
import { generateThreadId } from '@/lib/support-helpers'
import { sendSupportMessageReceivedEmail } from '@/lib/email'

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
            email: true,
            role: true
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

    // Get support team name from superadmin settings
    const supportSettings = await prisma.superAdminSettings.findFirst({
      select: { supportTeamName: true }
    })
    
    const supportTeamName = supportSettings?.supportTeamName || 'WaveOrder Support Team'
    
    // Get all superadmin user IDs for name replacement
    const superAdminUsers = await prisma.user.findMany({
      where: { role: 'SUPER_ADMIN' },
      select: { id: true }
    })
    const superAdminIds = superAdminUsers.map(user => user.id)

    // Convert to array and get latest message for each thread
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
            name: superAdminIds.includes(lastMessage.sender.id) ? supportTeamName : lastMessage.sender.name
          }
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

    // Create notification for SuperAdmin
    await prisma.notification.create({
      data: {
        type: 'MESSAGE_RECEIVED',
        title: `New Message from ${message.sender.name}`,
        message: `"${content.trim().substring(0, 80)}${content.trim().length > 80 ? '...' : ''}"`,
        link: `/superadmin/support/messages/${threadId}`,
        userId: superAdmin.id
      }
    })

    // Get or create SuperAdmin email settings
    let superAdminSettings = await prisma.superAdminSettings.findFirst({
      where: { userId: superAdmin.id },
      select: { primaryEmail: true }
    })
    
    // Create default settings if they don't exist
    if (!superAdminSettings) {
      console.log('🔍 No SuperAdmin settings found, creating defaults...')
      superAdminSettings = await prisma.superAdminSettings.create({
        data: {
          userId: superAdmin.id,
          primaryEmail: superAdmin.email,
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
    
    const notificationEmail = superAdminSettings?.primaryEmail || superAdmin.email
    console.log('🔍 Using email for SuperAdmin:', notificationEmail)

    // Send email notification to SuperAdmin
    console.log('📧 Attempting to send new message email with params:', {
      to: notificationEmail,
      recipientName: superAdmin.name,
      senderName: message.sender.name,
      subject: subject,
      businessName: message.business.name
    })
    
    try {
      const emailResult = await sendSupportMessageReceivedEmail({
        to: notificationEmail,
        // @ts-ignore
        recipientName: superAdmin.name,
        // @ts-ignore
        senderName: message.sender.name,
        subject: subject,
        content: content.trim(),
        // @ts-ignore
        businessName: message.business.name,
        // @ts-ignore
        messageUrl: `${process.env.NEXTAUTH_URL}/superadmin/support/messages/${threadId}`
      })
      console.log('✅ New message email sent successfully:', emailResult)
    } catch (emailError) {
      console.error('❌ Failed to send new message email to SuperAdmin:', emailError)
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
