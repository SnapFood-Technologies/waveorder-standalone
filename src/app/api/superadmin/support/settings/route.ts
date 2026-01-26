// src/app/api/superadmin/support/settings/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'


export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || session.user.role !== 'SUPER_ADMIN') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Get or create SuperAdmin settings
    let settings = await prisma.superAdminSettings.findFirst({
      where: { userId: session.user.id },
      include: { workingHours: true }
    })

    if (!settings) {
      // Create default settings for this SuperAdmin
      settings = await prisma.superAdminSettings.create({
        data: {
          userId: session.user.id,
          primaryEmail: session.user.email || '',
          backupEmails: [],
          emailFrequency: 'IMMEDIATE',
          emailDigest: false,
          urgentOnly: false,
          autoAssignTickets: false,
          defaultTicketPriority: 'MEDIUM',
          responseTimeSLA: 24,
          emailNotificationsTicketCreated: true,
          emailNotificationsTicketUpdated: true,
          emailNotificationsTicketResolved: true,
          emailNotificationsMessageReceived: true,
          businessNotificationsTicketCreated: true,
          businessNotificationsTicketUpdated: true,
          businessNotificationsTicketResolved: true,
          businessNotificationsMessageReceived: true,
          workingHours: {
            create: {
              enabled: false,
              startTime: '09:00',
              endTime: '17:00',
              timezone: 'UTC'
            }
          }
        },
        include: { workingHours: true }
      })
    }

    // Transform database format to UI format
    const formattedSettings = {
      autoAssignTickets: settings.autoAssignTickets,
      defaultTicketPriority: settings.defaultTicketPriority,
      responseTimeSLA: settings.responseTimeSLA,
      emailNotifications: {
        ticketCreated: settings.emailNotificationsTicketCreated,
        ticketUpdated: settings.emailNotificationsTicketUpdated,
        ticketResolved: settings.emailNotificationsTicketResolved,
        messageReceived: settings.emailNotificationsMessageReceived
      },
      businessNotifications: {
        ticketCreated: settings.businessNotificationsTicketCreated,
        ticketUpdated: settings.businessNotificationsTicketUpdated,
        ticketResolved: settings.businessNotificationsTicketResolved,
        messageReceived: settings.businessNotificationsMessageReceived
      },
      workingHours: settings.workingHours ? {
        enabled: settings.workingHours.enabled,
        startTime: settings.workingHours.startTime,
        endTime: settings.workingHours.endTime,
        timezone: settings.workingHours.timezone
      } : {
        enabled: false,
        startTime: '09:00',
        endTime: '17:00',
        timezone: 'UTC'
      },
      superAdminEmailSettings: {
        primaryEmail: settings.primaryEmail,
        backupEmails: settings.backupEmails,
        emailFrequency: settings.emailFrequency.toLowerCase(),
        emailDigest: settings.emailDigest,
        urgentOnly: settings.urgentOnly
      },
      supportContactSettings: {
        supportEmail: settings.supportEmail,
        supportPhone: settings.supportPhone,
        supportWebsite: settings.supportWebsite,
        supportHours: settings.supportHours,
        responseTime: settings.responseTime,
        emergencyContact: settings.emergencyContact,
        supportMessage: settings.supportMessage,
        supportTeamName: settings.supportTeamName
      }
    }

    return NextResponse.json({
      success: true,
      settings: formattedSettings
    })

  } catch (error) {
    console.error('Error fetching support settings:', error)
    return NextResponse.json(
      { error: 'Failed to fetch support settings' },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || session.user.role !== 'SUPER_ADMIN') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const settings = body

    // Validate settings
    if (!settings || typeof settings !== 'object') {
      return NextResponse.json(
        { error: 'Invalid settings data' },
        { status: 400 }
      )
    }

    // Check if settings exist
    const existingSettings = await prisma.superAdminSettings.findFirst({
      where: { userId: session.user.id }
    })

    if (existingSettings) {
      // Update existing settings
      await prisma.superAdminSettings.update({
        where: { id: existingSettings.id },
        data: {
          primaryEmail: settings.superAdminEmailSettings?.primaryEmail || existingSettings.primaryEmail,
          backupEmails: settings.superAdminEmailSettings?.backupEmails || existingSettings.backupEmails,
          emailFrequency: settings.superAdminEmailSettings?.emailFrequency?.toUpperCase() || existingSettings.emailFrequency,
          emailDigest: settings.superAdminEmailSettings?.emailDigest ?? existingSettings.emailDigest,
          urgentOnly: settings.superAdminEmailSettings?.urgentOnly ?? existingSettings.urgentOnly,
          autoAssignTickets: settings.autoAssignTickets ?? existingSettings.autoAssignTickets,
          defaultTicketPriority: settings.defaultTicketPriority || existingSettings.defaultTicketPriority,
          responseTimeSLA: settings.responseTimeSLA || existingSettings.responseTimeSLA,
          emailNotificationsTicketCreated: settings.emailNotifications?.ticketCreated ?? existingSettings.emailNotificationsTicketCreated,
          emailNotificationsTicketUpdated: settings.emailNotifications?.ticketUpdated ?? existingSettings.emailNotificationsTicketUpdated,
          emailNotificationsTicketResolved: settings.emailNotifications?.ticketResolved ?? existingSettings.emailNotificationsTicketResolved,
          emailNotificationsMessageReceived: settings.emailNotifications?.messageReceived ?? existingSettings.emailNotificationsMessageReceived,
          businessNotificationsTicketCreated: settings.businessNotifications?.ticketCreated ?? existingSettings.businessNotificationsTicketCreated,
          businessNotificationsTicketUpdated: settings.businessNotifications?.ticketUpdated ?? existingSettings.businessNotificationsTicketUpdated,
          businessNotificationsTicketResolved: settings.businessNotifications?.ticketResolved ?? existingSettings.businessNotificationsTicketResolved,
          businessNotificationsMessageReceived: settings.businessNotifications?.messageReceived ?? existingSettings.businessNotificationsMessageReceived,
          supportEmail: settings.supportContactSettings?.supportEmail || existingSettings.supportEmail,
          supportPhone: settings.supportContactSettings?.supportPhone || existingSettings.supportPhone,
          supportWebsite: settings.supportContactSettings?.supportWebsite || existingSettings.supportWebsite,
          supportHours: settings.supportContactSettings?.supportHours || existingSettings.supportHours,
          responseTime: settings.supportContactSettings?.responseTime || existingSettings.responseTime,
          emergencyContact: settings.supportContactSettings?.emergencyContact || existingSettings.emergencyContact,
          supportMessage: settings.supportContactSettings?.supportMessage || existingSettings.supportMessage,
          supportTeamName: settings.supportContactSettings?.supportTeamName || existingSettings.supportTeamName,
        }
      })

      // Update working hours if they exist
      // @ts-ignore
      if (settings.workingHours && existingSettings.workingHours) {
        await prisma.workingHours.update({
          // @ts-ignore
          where: { id: existingSettings.workingHours.id },
          data: {
            enabled: settings.workingHours.enabled,
            // @ts-ignore
            startTime: settings.workingHours.startTime,
            // @ts-ignore
            endTime: settings.workingHours.endTime,
            // @ts-ignore
            timezone: settings.workingHours.timezone
          }
        })
      }
    } else {
      // Create new settings
      await prisma.superAdminSettings.create({
        data: {
          userId: session.user.id,
          primaryEmail: settings.superAdminEmailSettings?.primaryEmail || session.user.email || '',
          backupEmails: settings.superAdminEmailSettings?.backupEmails || [],
          emailFrequency: settings.superAdminEmailSettings?.emailFrequency?.toUpperCase() || 'IMMEDIATE',
          emailDigest: settings.superAdminEmailSettings?.emailDigest || false,
          urgentOnly: settings.superAdminEmailSettings?.urgentOnly || false,
          autoAssignTickets: settings.autoAssignTickets || false,
          defaultTicketPriority: settings.defaultTicketPriority || 'MEDIUM',
          responseTimeSLA: settings.responseTimeSLA || 24,
          emailNotificationsTicketCreated: settings.emailNotifications?.ticketCreated ?? true,
          emailNotificationsTicketUpdated: settings.emailNotifications?.ticketUpdated ?? true,
          emailNotificationsTicketResolved: settings.emailNotifications?.ticketResolved ?? true,
          emailNotificationsMessageReceived: settings.emailNotifications?.messageReceived ?? true,
          businessNotificationsTicketCreated: settings.businessNotifications?.ticketCreated ?? true,
          businessNotificationsTicketUpdated: settings.businessNotifications?.ticketUpdated ?? true,
          businessNotificationsTicketResolved: settings.businessNotifications?.ticketResolved ?? true,
          businessNotificationsMessageReceived: settings.businessNotifications?.messageReceived ?? true,
          supportEmail: settings.supportContactSettings?.supportEmail || 'support@waveorder.app',
          supportPhone: settings.supportContactSettings?.supportPhone || '+1 (555) 123-4567',
          supportWebsite: settings.supportContactSettings?.supportWebsite || 'https://waveorder.app/support',
          supportHours: settings.supportContactSettings?.supportHours || 'Monday - Friday, 9:00 AM - 6:00 PM EST',
          responseTime: settings.supportContactSettings?.responseTime || 'Within 24 hours',
          emergencyContact: settings.supportContactSettings?.emergencyContact || 'emergency@waveorder.app',
          supportMessage: settings.supportContactSettings?.supportMessage || 'We\'re here to help! Contact us anytime for support with your WaveOrder store.',
          supportTeamName: settings.supportContactSettings?.supportTeamName || 'WaveOrder Support Team',
          workingHours: settings.workingHours ? {
            create: {
              enabled: settings.workingHours.enabled,
              startTime: settings.workingHours.startTime,
              endTime: settings.workingHours.endTime,
              timezone: settings.workingHours.timezone
            }
          } : {
            create: {
              enabled: false,
              startTime: '09:00',
              endTime: '17:00',
              timezone: 'UTC'
            }
          }
        }
      })
    }

    return NextResponse.json({
      success: true,
      message: 'Support settings updated successfully',
      settings
    })

  } catch (error) {
    console.error('Error updating support settings:', error)
    return NextResponse.json(
      { error: 'Failed to update support settings' },
      { status: 500 }
    )
  }
}
