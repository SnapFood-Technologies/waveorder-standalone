// src/app/api/admin/stores/[businessId]/support/tickets/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { checkBusinessAccess } from '@/lib/api-helpers'
import { prisma } from '@/lib/prisma'
import { generateTicketNumber } from '@/lib/support-helpers'
import { sendSupportTicketCreatedEmail } from '@/lib/email'

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

    // Get tickets for this business
    const tickets = await prisma.supportTicket.findMany({
      where: {
        businessId
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
        _count: {
          select: {
            comments: true
          }
        }
      },
      orderBy: {
        updatedAt: 'desc'
      }
    })

    return NextResponse.json({
      success: true,
      tickets: tickets.map(ticket => ({
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
        commentsCount: ticket._count.comments
      }))
    })

  } catch (error) {
    console.error('Error fetching tickets:', error)
    return NextResponse.json(
      { error: 'Failed to fetch tickets' },
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
    const { subject, description, type, priority } = body

    if (!subject || !description) {
      return NextResponse.json(
        { error: 'Subject and description are required' },
        { status: 400 }
      )
    }

    // Generate unique ticket number
    let ticketNumber: string
    let isUnique = false
    let attempts = 0
    
    while (!isUnique && attempts < 10) {
      ticketNumber = generateTicketNumber()
      const existing = await prisma.supportTicket.findUnique({
        where: { ticketNumber }
      })
      if (!existing) {
        isUnique = true
      }
      attempts++
    }

    if (!isUnique) {
      return NextResponse.json(
        { error: 'Failed to generate unique ticket number' },
        { status: 500 }
      )
    }

    // Create ticket
    const ticket = await prisma.supportTicket.create({
      data: {
        ticketNumber: ticketNumber!,
        subject,
        description,
        type: type || 'GENERAL',
        priority: priority || 'MEDIUM',
        businessId,
        createdById: access.session.user.id
      },
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

    // Find a superadmin to notify
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
          type: 'TICKET_CREATED',
          title: 'New Support Ticket Created',
          message: `A new support ticket #${ticket.ticketNumber} has been created: "${ticket.subject}"`,
          link: `/superadmin/support/tickets/${ticket.id}`,
          userId: superAdminUser.id
        }
      })

      // Send email notification to SuperAdmin
      try {
        await sendSupportTicketCreatedEmail({
          to: notificationEmail,
          recipientName: superAdminUser.name,
          ticketNumber: ticket.ticketNumber,
          subject: ticket.subject,
          description: ticket.description,
          businessName: access.business.name,
          ticketUrl: `${process.env.NEXTAUTH_URL}/superadmin/support/tickets/${ticket.id}`
        })
      } catch (emailError) {
        console.error('Failed to send email notification to SuperAdmin:', emailError)
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Ticket created successfully',
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
        commentsCount: 0
      }
    })

  } catch (error) {
    console.error('Error creating ticket:', error)
    return NextResponse.json(
      { error: 'Failed to create ticket' },
      { status: 500 }
    )
  }
}
