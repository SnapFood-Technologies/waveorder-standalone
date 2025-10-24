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
      console.log('🔍 SuperAdmin user found:', superAdminUser)
      
      // Get or create SuperAdmin email settings
      let superAdminSettings = await prisma.superAdminSettings.findFirst({
        where: { userId: superAdminUser.id },
        select: { primaryEmail: true }
      })
      
      // Create default settings if they don't exist
      if (!superAdminSettings) {
        console.log('🔍 No SuperAdmin settings found, creating defaults...')
        superAdminSettings = await prisma.superAdminSettings.create({
          data: {
            userId: superAdminUser.id,
            primaryEmail: superAdminUser.email,
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
      
      const notificationEmail = superAdminSettings?.primaryEmail || superAdminUser.email
      console.log('🔍 Using email for SuperAdmin:', notificationEmail)

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
      console.log('📧 Attempting to send ticket created email with params:', {
        to: notificationEmail,
        recipientName: superAdminUser.name,
        ticketNumber: ticket.ticketNumber,
        subject: ticket.subject,
        businessName: business.name
      })
      
      try {
        const emailResult = await sendSupportTicketCreatedEmail({
          to: notificationEmail,
          recipientName: superAdminUser.name,
          ticketNumber: ticket.ticketNumber,
          subject: ticket.subject,
          description: ticket.description,
          businessName: business.name,
          ticketUrl: `${process.env.NEXTAUTH_URL}/superadmin/support/tickets/${ticket.id}`
        })
        console.log('✅ Ticket created email sent successfully:', emailResult)
      } catch (emailError) {
        console.error('❌ Failed to send ticket created email to SuperAdmin:', emailError)
        console.error('Email error details:', {
          message: emailError.message,
          stack: emailError.stack,
          name: emailError.name
        })
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
