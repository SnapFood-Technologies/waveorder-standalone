// app/api/admin/stores/[businessId]/business-hours/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { checkBusinessAccess } from '@/lib/api-helpers'


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
    const { businessId } = await params

    const access = await checkBusinessAccess(businessId)
    
    if (!access.authorized) {
      return NextResponse.json({ message: access.error }, { status: access.status })
    }

    const business = await prisma.business.findUnique({
      where: { id: businessId },
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
    const { businessId } = await params

    const access = await checkBusinessAccess(businessId)
    
    if (!access.authorized) {
      return NextResponse.json({ message: access.error }, { status: access.status })
    }

    const { businessHours } = await request.json()

    // Validate business hours structure
    const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']
    
    if (!businessHours || typeof businessHours !== 'object') {
      return NextResponse.json({ message: 'Invalid business hours format' }, { status: 400 })
    }

    for (const day of days) {
      const dayHours = businessHours[day]
      
      if (!dayHours || typeof dayHours !== 'object') {
        return NextResponse.json({ message: `Invalid ${day} hours format` }, { status: 400 })
      }

      if (typeof dayHours.closed !== 'boolean') {
        return NextResponse.json({ message: `${day}: 'closed' must be a boolean` }, { status: 400 })
      }

      if (!dayHours.closed) {
        const timeRegex = /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/
        
        if (!dayHours.open || !timeRegex.test(dayHours.open)) {
          return NextResponse.json({ message: `${day}: Invalid opening time format` }, { status: 400 })
        }

        if (!dayHours.close || !timeRegex.test(dayHours.close)) {
          return NextResponse.json({ message: `${day}: Invalid closing time format` }, { status: 400 })
        }

        if (dayHours.open >= dayHours.close) {
          return NextResponse.json({ message: `${day}: Closing time must be after opening time` }, { status: 400 })
        }
      }
    }

    await prisma.business.update({
      where: { id: businessId },
      data: { businessHours: businessHours as any }
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