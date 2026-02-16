import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// GET - List all events with filters
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user || session.user.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const eventType = searchParams.get('eventType')
    const country = searchParams.get('country')
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')
    const search = searchParams.get('search')

    const where: any = {}

    if (status) {
      where.status = status
    }

    if (eventType) {
      where.eventType = eventType
    }

    if (country) {
      where.country = country
    }

    if (startDate || endDate) {
      where.OR = []
      if (startDate) {
        where.OR.push({
          startDate: { gte: new Date(startDate) }
        })
      }
      if (endDate) {
        where.OR.push({
          endDate: { lte: new Date(endDate) }
        })
      }
    }

    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
        { venueName: { contains: search, mode: 'insensitive' } },
        { city: { contains: search, mode: 'insensitive' } }
      ]
    }

    const events = await prisma.event.findMany({
      where,
      include: {
        createdByUser: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      },
      orderBy: {
        startDate: 'desc'
      }
    })

    return NextResponse.json({ events })
  } catch (error) {
    console.error('Error fetching events:', error)
    return NextResponse.json(
      { error: 'Failed to fetch events' },
      { status: 500 }
    )
  }
}

// POST - Create new event
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user || session.user.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const {
      title,
      description,
      eventType,
      status,
      priority,
      startDate,
      endDate,
      timezone,
      locationType,
      venueName,
      address,
      city,
      country,
      coordinates,
      onlineUrl,
      registrationUrl,
      bannerImage,
      icon,
      organizer,
      attendees,
      expectedAttendance,
      targetPlans,
      targetCountries,
      showOnDashboard,
      showToBusinesses
    } = body

    if (!title || !eventType) {
      return NextResponse.json(
        { error: 'Title and event type are required' },
        { status: 400 }
      )
    }

    const event = await prisma.event.create({
      data: {
        title,
        description: description || '',
        eventType,
        status: status || 'PLANNING',
        priority: priority || 'MEDIUM',
        startDate: startDate ? new Date(startDate) : null,
        endDate: endDate ? new Date(endDate) : null,
        timezone: timezone || null,
        locationType: locationType || 'PHYSICAL',
        venueName: venueName || null,
        address: address || null,
        city: city || null,
        country: country || null,
        coordinates: coordinates || null,
        onlineUrl: onlineUrl || null,
        registrationUrl: registrationUrl || null,
        bannerImage: bannerImage || null,
        icon: icon || null,
        organizer: organizer || null,
        attendees: attendees || [],
        expectedAttendance: expectedAttendance || null,
        targetPlans: targetPlans || [],
        targetCountries: targetCountries || [],
        showOnDashboard: showOnDashboard !== undefined ? showOnDashboard : true,
        showToBusinesses: showToBusinesses !== undefined ? showToBusinesses : false,
        createdBy: session.user.id
      },
      include: {
        createdByUser: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    })

    return NextResponse.json({ event }, { status: 201 })
  } catch (error) {
    console.error('Error creating event:', error)
    return NextResponse.json(
      { error: 'Failed to create event' },
      { status: 500 }
    )
  }
}
