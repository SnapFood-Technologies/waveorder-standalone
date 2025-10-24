// src/app/api/admin/stores/[businessId]/support/tickets/[ticketId]/comments/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { checkBusinessAccess } from '@/lib/api-helpers'
import { prisma } from '@/lib/prisma'
import { sendSupportTicketCommentEmail } from '@/lib/email'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ businessId: string; ticketId: string }> }
) {
  try {
    const { businessId, ticketId } = await params

    const access = await checkBusinessAccess(businessId)
    
    if (!access.authorized) {
      return NextResponse.json(
        { error: access.error },
        { status: access.status }
      )
    }

    // Verify ticket exists and belongs to business
    const ticket = await prisma.supportTicket.findFirst({
      where: {
        id: ticketId,
        businessId
      }
    })

    if (!ticket) {
      return NextResponse.json(
        { error: 'Ticket not found' },
        { status: 404 }
      )
    }

    // Get comments
    const comments = await prisma.ticketComment.findMany({
      where: {
        ticketId
      },
      include: {
        author: {
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

    return NextResponse.json({
      success: true,
      comments: comments.map(comment => ({
        id: comment.id,
        content: comment.content,
        isInternal: comment.isInternal,
        createdAt: comment.createdAt.toISOString(),
        author: comment.author
      }))
    })

  } catch (error) {
    console.error('Error fetching comments:', error)
    return NextResponse.json(
      { error: 'Failed to fetch comments' },
      { status: 500 }
    )
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ businessId: string; ticketId: string }> }
) {
  try {
    const { businessId, ticketId } = await params

    const access = await checkBusinessAccess(businessId)
    
    if (!access.authorized) {
      return NextResponse.json(
        { error: access.error },
        { status: access.status }
      )
    }

    const body = await request.json()
    const { content, isInternal = false } = body

    if (!content || !content.trim()) {
      return NextResponse.json(
        { error: 'Comment content is required' },
        { status: 400 }
      )
    }

    // Verify ticket exists and belongs to business
    const ticket = await prisma.supportTicket.findFirst({
      where: {
        id: ticketId,
        businessId
      }
    })

    if (!ticket) {
      return NextResponse.json(
        { error: 'Ticket not found' },
        { status: 404 }
      )
    }

    // Create comment
    const comment = await prisma.ticketComment.create({
      data: {
        content: content.trim(),
        isInternal,
        ticketId,
        authorId: access.session.user.id
      },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    })

    // Update ticket updatedAt
    await prisma.supportTicket.update({
      where: { id: ticketId },
      data: { updatedAt: new Date() }
    })

    // Find SuperAdmin to notify
    const superAdminUser = await prisma.user.findFirst({
      where: { role: 'SUPER_ADMIN' },
      select: { id: true, email: true, name: true }
    })

    if (superAdminUser) {
      // Get SuperAdmin email settings
      const superAdminSettings = await prisma.superAdminSettings.findFirst({
        where: { userId: superAdminUser.id },
        select: { primaryEmail: true }
      })
      
      const notificationEmail = superAdminSettings?.primaryEmail || superAdminUser.email

      // Create notification for SuperAdmin
      await prisma.notification.create({
        data: {
          type: 'TICKET_UPDATED',
          title: 'New Comment on Support Ticket',
          message: `A new comment has been added to ticket #${ticket.ticketNumber}: "${content.trim().substring(0, 80)}${content.trim().length > 80 ? '...' : ''}"`,
          link: `/superadmin/support/tickets/${ticketId}`,
          userId: superAdminUser.id
        }
      })

      // Send email notification to SuperAdmin
      try {
        await sendSupportTicketCommentEmail({
          to: notificationEmail,
          recipientName: superAdminUser.name,
          ticketNumber: ticket.ticketNumber,
          subject: ticket.subject,
          comment: content.trim(),
          commentAuthor: comment.author.name,
          businessName: access.business.name,
          ticketUrl: `${process.env.NEXTAUTH_URL}/superadmin/support/tickets/${ticketId}`
        })
      } catch (emailError) {
        console.error('Failed to send email notification to SuperAdmin:', emailError)
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Comment added successfully',
      comment: {
        id: comment.id,
        content: comment.content,
        isInternal: comment.isInternal,
        createdAt: comment.createdAt.toISOString(),
        author: comment.author
      }
    })

  } catch (error) {
    console.error('Error adding comment:', error)
    return NextResponse.json(
      { error: 'Failed to add comment' },
      { status: 500 }
    )
  }
}
