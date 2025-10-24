// src/app/api/superadmin/support/tickets/[ticketId]/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { sendSupportTicketUpdatedEmail } from '@/lib/email'

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

    // Get ticket details
    const ticket = await prisma.supportTicket.findUnique({
      where: {
        id: ticketId
      },
      include: {
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        assignedTo: {
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

    return NextResponse.json({
      success: true,
      ticket: {
        id: ticket.id,
        ticketNumber: ticket.ticketNumber,
        subject: ticket.subject,
        description: ticket.description,
        status: ticket.status,
        priority: ticket.priority,
        type: ticket.type,
        createdAt: ticket.createdAt.toISOString(),
        updatedAt: ticket.updatedAt.toISOString(),
        createdBy: ticket.createdBy,
        assignedTo: ticket.assignedTo,
        business: ticket.business
      }
    })

  } catch (error) {
    console.error('Error fetching ticket:', error)
    return NextResponse.json(
      { error: 'Failed to fetch ticket' },
      { status: 500 }
    )
  }
}

export async function PUT(
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
    const { status, assignedToId, priority } = body

    // Verify ticket exists
    const existingTicket = await prisma.supportTicket.findUnique({
      where: { id: ticketId }
    })

    if (!existingTicket) {
      return NextResponse.json(
        { error: 'Ticket not found' },
        { status: 404 }
      )
    }

    // Update ticket
    const updateData: any = {}
    
    if (status) {
      updateData.status = status
      if (status === 'RESOLVED' || status === 'CLOSED') {
        updateData.resolvedAt = new Date()
        updateData.resolvedById = session.user.id
      }
    }
    
    if (assignedToId !== undefined) {
      updateData.assignedToId = assignedToId || null
    }
    
    if (priority) {
      updateData.priority = priority
    }

    const ticket = await prisma.supportTicket.update({
      where: { id: ticketId },
      data: updateData,
      include: {
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        assignedTo: {
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

    // Get support team name from settings
    const supportSettings = await prisma.superAdminSettings.findFirst({
      where: { userId: session.user.id },
      select: { supportTeamName: true }
    })
    const supportTeamName = supportSettings?.supportTeamName || 'WaveOrder Support Team'

    // Create notification for ticket creator
    await prisma.notification.create({
      data: {
        type: 'TICKET_UPDATED',
        title: `Ticket Updated by ${supportTeamName}`,
        message: `Your support ticket #${ticket.ticketNumber} has been updated. Status: ${ticket.status}`,
        link: `/admin/stores/${ticket.business.id}/support/tickets/${ticket.id}`,
        userId: ticket.createdBy.id
      }
    })

    // Send email notification to ticket creator
    try {
      await sendSupportTicketUpdatedEmail({
        to: ticket.createdBy.email,
        // @ts-ignore
        businessName: ticket.business.name,
        // @ts-ignore
        adminName: ticket.createdBy.name,
        // @ts-ignore
        ticketNumber: ticket.ticketNumber,
        subject: ticket.subject,
        status: ticket.status,
        // @ts-ignore
        businessName: ticket.business.name,
        // @ts-ignore
        updatedBy: supportSettings?.supportTeamName || 'WaveOrder Support Team',
        ticketUrl: `${process.env.NEXTAUTH_URL}/admin/stores/${ticket.business.id}/support/tickets/${ticket.id}`
      })
    } catch (emailError) {
      console.error('Failed to send email notification:', emailError)
      // Don't fail the request if email fails
    }

    return NextResponse.json({
      success: true,
      message: 'Ticket updated successfully',
      ticket: {
        id: ticket.id,
        ticketNumber: ticket.ticketNumber,
        subject: ticket.subject,
        description: ticket.description,
        status: ticket.status,
        priority: ticket.priority,
        type: ticket.type,
        createdAt: ticket.createdAt.toISOString(),
        updatedAt: ticket.updatedAt.toISOString(),
        createdBy: ticket.createdBy,
        assignedTo: ticket.assignedTo,
        business: ticket.business
      }
    })

  } catch (error) {
    console.error('Error updating ticket:', error)
    return NextResponse.json(
      { error: 'Failed to update ticket' },
      { status: 500 }
    )
  }
}
