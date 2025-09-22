// app/api/admin/stores/[businessId]/business-hours/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { PrismaClient } from '@prisma/client'
import { authOptions } from '@/lib/auth'

const prisma = new PrismaClient()

interface DayHours {
  open: string
  close: string
  closed: boolean
}

interface BusinessHours {
  monday: DayHours
  tuesday: DayHours
  wednesday: DayHours
  thursday: DayHours
  friday: DayHours
  saturday: DayHours
  sunday: DayHours
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ businessId: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
    }

    const { businessId } = await params

    // Verify user has access to business
    const business = await prisma.business.findFirst({
      where: {
        id: businessId,
        users: {
          some: {
            user: {
              email: session.user.email
            }
          }
        }
      },
      select: {
        id: true,
        businessHours: true
      }
    })

    if (!business) {
      return NextResponse.json({ message: 'Business not found' }, { status: 404 })
    }

    return NextResponse.json({ 
        // @ts-ignore
      businessHours: business.businessHours as BusinessHours || null
    })

  } catch (error) {
    console.error('Error fetching business hours:', error)
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 })
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ businessId: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
    }

    const { businessId } = await params
    const { businessHours } = await request.json()

    // Verify user has access to business
    const business = await prisma.business.findFirst({
      where: {
        id: businessId,
        users: {
          some: {
            user: {
              email: session.user.email
            }
          }
        }
      }
    })

    if (!business) {
      return NextResponse.json({ message: 'Business not found' }, { status: 404 })
    }

    // Validate business hours structure
    const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']
    
    if (!businessHours || typeof businessHours !== 'object') {
      return NextResponse.json({ message: 'Invalid business hours format' }, { status: 400 })
    }

    // Validate each day
    for (const day of days) {
      const dayHours = businessHours[day]
      
      if (!dayHours || typeof dayHours !== 'object') {
        return NextResponse.json({ message: `Invalid ${day} hours format` }, { status: 400 })
      }

      if (typeof dayHours.closed !== 'boolean') {
        return NextResponse.json({ message: `${day}: 'closed' must be a boolean` }, { status: 400 })
      }

      if (!dayHours.closed) {
        // Validate time format (HH:MM)
        const timeRegex = /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/
        
        if (!dayHours.open || !timeRegex.test(dayHours.open)) {
          return NextResponse.json({ message: `${day}: Invalid opening time format` }, { status: 400 })
        }

        if (!dayHours.close || !timeRegex.test(dayHours.close)) {
          return NextResponse.json({ message: `${day}: Invalid closing time format` }, { status: 400 })
        }

        // Check that closing time is after opening time
        if (dayHours.open >= dayHours.close) {
          return NextResponse.json({ message: `${day}: Closing time must be after opening time` }, { status: 400 })
        }
      }
    }

    // Update business hours
    await prisma.business.update({
      where: { id: businessId },
      data: {
        businessHours: businessHours as any // Store as JSON
      }
    })

    return NextResponse.json({ 
      message: 'Business hours updated successfully',
      businessHours 
    })

  } catch (error) {
    console.error('Error updating business hours:', error)
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 })
  }
}