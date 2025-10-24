// src/app/api/admin/stores/[businessId]/support/tickets/[ticketId]/comments/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { checkBusinessAccess } from '@/lib/api-helpers'
import { prisma } from '@/lib/prisma'

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

    // TODO: Send notification to relevant parties
    // TODO: Send email notification

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
