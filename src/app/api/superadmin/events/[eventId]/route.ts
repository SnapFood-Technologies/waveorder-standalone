import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// GET - Get single event
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ eventId: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user || session.user.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
    }

    const { eventId } = await params

    const event = await prisma.event.findUnique({
      where: { id: eventId },
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

    if (!event) {
      return NextResponse.json({ message: 'Event not found' }, { status: 404 })
    }

    return NextResponse.json({ event })
  } catch (error) {
    console.error('Error fetching event:', error)
    return NextResponse.json(
      { error: 'Failed to fetch event' },
      { status: 500 }
    )
  }
}

// PUT - Update event
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ eventId: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user || session.user.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
    }

    const { eventId } = await params
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
      photos,
      organizer,
      attendees,
      expectedAttendance,
      actualAttendance,
      notes,
      leadsGenerated,
      followUpRequired,
      followUpNotes,
      targetPlans,
      targetCountries,
      showOnDashboard,
      showToBusinesses
    } = body

    const updateData: any = {}

    if (title !== undefined) updateData.title = title
    if (description !== undefined) updateData.description = description
    if (eventType !== undefined) updateData.eventType = eventType
    if (status !== undefined) updateData.status = status
    if (priority !== undefined) updateData.priority = priority
    if (startDate !== undefined) updateData.startDate = startDate ? new Date(startDate) : null
    if (endDate !== undefined) updateData.endDate = endDate ? new Date(endDate) : null
    if (timezone !== undefined) updateData.timezone = timezone
    if (locationType !== undefined) updateData.locationType = locationType
    if (venueName !== undefined) updateData.venueName = venueName
    if (address !== undefined) updateData.address = address
    if (city !== undefined) updateData.city = city
    if (country !== undefined) updateData.country = country
    if (coordinates !== undefined) updateData.coordinates = coordinates
    if (onlineUrl !== undefined) updateData.onlineUrl = onlineUrl
    if (registrationUrl !== undefined) updateData.registrationUrl = registrationUrl
    if (bannerImage !== undefined) updateData.bannerImage = bannerImage
    if (icon !== undefined) updateData.icon = icon
    if (photos !== undefined) updateData.photos = photos
    if (organizer !== undefined) updateData.organizer = organizer
    if (attendees !== undefined) updateData.attendees = attendees
    if (expectedAttendance !== undefined) updateData.expectedAttendance = expectedAttendance
    if (actualAttendance !== undefined) updateData.actualAttendance = actualAttendance
    if (notes !== undefined) updateData.notes = notes
    if (leadsGenerated !== undefined) updateData.leadsGenerated = leadsGenerated
    if (followUpRequired !== undefined) updateData.followUpRequired = followUpRequired
    if (followUpNotes !== undefined) updateData.followUpNotes = followUpNotes
    if (targetPlans !== undefined) updateData.targetPlans = targetPlans
    if (targetCountries !== undefined) updateData.targetCountries = targetCountries
    if (showOnDashboard !== undefined) updateData.showOnDashboard = showOnDashboard
    if (showToBusinesses !== undefined) updateData.showToBusinesses = showToBusinesses

    const event = await prisma.event.update({
      where: { id: eventId },
      data: updateData,
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

    return NextResponse.json({ event })
  } catch (error) {
    console.error('Error updating event:', error)
    return NextResponse.json(
      { error: 'Failed to update event' },
      { status: 500 }
    )
  }
}

// DELETE - Delete event
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ eventId: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user || session.user.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
    }

    const { eventId } = await params

    await prisma.event.delete({
      where: { id: eventId }
    })

    return NextResponse.json({ message: 'Event deleted successfully' })
  } catch (error) {
    console.error('Error deleting event:', error)
    return NextResponse.json(
      { error: 'Failed to delete event' },
      { status: 500 }
    )
  }
}
