// src/app/api/superadmin/support/settings/route.ts
import { NextRequest, NextResponse } from 'next/server'
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

    // Default settings - in a real app, these would be stored in the database
    const defaultSettings = {
      autoAssignTickets: false,
      defaultTicketPriority: 'MEDIUM',
      responseTimeSLA: 24,
      emailNotifications: {
        ticketCreated: true,
        ticketUpdated: true,
        ticketResolved: true,
        messageReceived: true
      },
      businessNotifications: {
        ticketCreated: true,
        ticketUpdated: true,
        ticketResolved: true,
        messageReceived: true
      },
      workingHours: {
        enabled: false,
        startTime: '09:00',
        endTime: '17:00',
        timezone: 'UTC'
      }
    }

    return NextResponse.json({
      success: true,
      settings: defaultSettings
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

    // In a real app, save to database
    // For now, just return success
    console.log('Support settings updated:', settings)

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
