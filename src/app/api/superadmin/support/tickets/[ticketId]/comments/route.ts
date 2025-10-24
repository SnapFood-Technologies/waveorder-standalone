// src/app/api/superadmin/support/tickets/[ticketId]/comments/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { sendSupportTicketCommentEmail } from '@/lib/email'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ ticketId: string }> }
) {
  try {
    const { ticketId } = await params

    const session = await getServerSession(authOptions)
    
    if (!session || session.user.role !== 'SUPER_ADMIN') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Verify ticket exists
    const ticket = await prisma.supportTicket.findFirst({
      where: { id: ticketId }
    })

    if (!ticket) {
      return NextResponse.json(
        { error: 'Ticket not found' },
        { status: 404 }
      )
    }

    // Get support team name from settings
    const supportSettings = await prisma.superAdminSettings.findFirst({
      where: { userId: session.user.id },
      select: { supportTeamName: true }
    })
    const supportTeamName = supportSettings?.supportTeamName || 'WaveOrder Support Team'

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
            email: true,
            role: true
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
        author: {
          ...comment.author,
          name: comment.author.role === 'SUPER_ADMIN' ? supportTeamName : comment.author.name
        }
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
  { params }: { params: Promise<{ ticketId: string }> }
) {
  try {
    const { ticketId } = await params

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
        { error: 'Comment content is required' },
        { status: 400 }
      )
    }

    // Verify ticket exists
    const ticket = await prisma.supportTicket.findFirst({
      where: { id: ticketId },
      include: {
        createdBy: {
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
        isInternal: false, // SuperAdmin comments are not internal
        ticketId,
        authorId: session.user.id
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

    // Get support team name from settings
    const supportSettings = await prisma.superAdminSettings.findFirst({
      where: { userId: session.user.id },
      select: { supportTeamName: true }
    })
    const supportTeamName = supportSettings?.supportTeamName || 'WaveOrder Support Team'

    // Create notification for ticket creator (admin)
    await prisma.notification.create({
      data: {
        type: 'TICKET_UPDATED',
        title: `New Comment from ${supportTeamName}`,
        message: `${supportTeamName} has added a comment to your ticket #${ticket.ticketNumber}: "${content.trim().substring(0, 80)}${content.trim().length > 80 ? '...' : ''}"`,
        link: `/admin/stores/${ticket.business.id}/support/tickets/${ticketId}`,
        userId: ticket.createdBy.id
      }
    })

    // Send email notification to ticket creator
    try {
      await sendSupportTicketCommentEmail({
        to: ticket.createdBy.email,
        // @ts-ignore
        recipientName: ticket.createdBy.name,
        // @ts-ignore
        ticketNumber: ticket.ticketNumber,
        subject: ticket.subject,
        comment: content.trim(),
        // @ts-ignore
        commentAuthor: supportTeamName,
        // @ts-ignore
        businessName: ticket.business.name,
        ticketUrl: `${process.env.NEXTAUTH_URL}/admin/stores/${ticket.business.id}/support/tickets/${ticketId}`
      })
    } catch (emailError) {
      console.error('Failed to send email notification:', emailError)
    }

    return NextResponse.json({
      success: true,
      message: 'Comment added successfully',
      comment: {
        id: comment.id,
        content: comment.content,
        isInternal: comment.isInternal,
        createdAt: comment.createdAt.toISOString(),
        author: {
          ...comment.author,
          // @ts-ignore
          name: comment.author.role === 'SUPER_ADMIN' ? supportTeamName : comment.author.name
        }
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