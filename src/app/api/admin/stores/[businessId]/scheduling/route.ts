// src/app/api/admin/stores/[businessId]/scheduling/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { checkBusinessAccess } from '@/lib/api-helpers'

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
        schedulingEnabled: true,
        slotDuration: true,
        slotCapacity: true,
        deliveryBufferMinutes: true,
        pickupBufferMinutes: true,
        holidayHours: true,
        businessHours: true
      }
    })

    if (!business) {
      return NextResponse.json({ message: 'Business not found' }, { status: 404 })
    }

    return NextResponse.json({
      scheduling: {
        schedulingEnabled: business.schedulingEnabled,
        slotDuration: business.slotDuration,
        slotCapacity: business.slotCapacity,
        deliveryBufferMinutes: business.deliveryBufferMinutes,
        pickupBufferMinutes: business.pickupBufferMinutes,
        holidayHours: business.holidayHours || {},
        businessHours: business.businessHours || {}
      }
    })

  } catch (error) {
    console.error('Error fetching scheduling config:', error)
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

    const body = await request.json()
    const { 
      schedulingEnabled,
      slotDuration, 
      slotCapacity, 
      deliveryBufferMinutes, 
      pickupBufferMinutes,
      holidayHours 
    } = body

    // Validate slot duration
    if (slotDuration !== undefined) {
      if (![15, 30, 60].includes(slotDuration)) {
        return NextResponse.json({ 
          message: 'Slot duration must be 15, 30, or 60 minutes' 
        }, { status: 400 })
      }
    }

    // Validate slot capacity
    if (slotCapacity !== undefined && slotCapacity !== null) {
      if (typeof slotCapacity !== 'number' || slotCapacity < 1) {
        return NextResponse.json({ 
          message: 'Slot capacity must be a positive number or null for unlimited' 
        }, { status: 400 })
      }
    }

    // Validate buffer times
    if (deliveryBufferMinutes !== undefined) {
      if (typeof deliveryBufferMinutes !== 'number' || deliveryBufferMinutes < 0 || deliveryBufferMinutes > 240) {
        return NextResponse.json({ 
          message: 'Delivery buffer must be between 0 and 240 minutes' 
        }, { status: 400 })
      }
    }

    if (pickupBufferMinutes !== undefined) {
      if (typeof pickupBufferMinutes !== 'number' || pickupBufferMinutes < 0 || pickupBufferMinutes > 240) {
        return NextResponse.json({ 
          message: 'Pickup buffer must be between 0 and 240 minutes' 
        }, { status: 400 })
      }
    }

    // Validate holiday hours format
    if (holidayHours !== undefined) {
      if (typeof holidayHours !== 'object') {
        return NextResponse.json({ 
          message: 'Holiday hours must be an object' 
        }, { status: 400 })
      }

      // Validate each holiday entry
      const dateRegex = /^\d{4}-\d{2}-\d{2}$/
      const timeRegex = /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/
      
      for (const [date, hours] of Object.entries(holidayHours)) {
        if (!dateRegex.test(date)) {
          return NextResponse.json({ 
            message: `Invalid date format: ${date}. Use YYYY-MM-DD` 
          }, { status: 400 })
        }

        const h = hours as any
        if (typeof h !== 'object') {
          return NextResponse.json({ 
            message: `Invalid hours format for ${date}` 
          }, { status: 400 })
        }

        // If not closed, validate open/close times
        if (!h.closed) {
          if (h.open && !timeRegex.test(h.open)) {
            return NextResponse.json({ 
              message: `Invalid opening time for ${date}` 
            }, { status: 400 })
          }
          if (h.close && !timeRegex.test(h.close)) {
            return NextResponse.json({ 
              message: `Invalid closing time for ${date}` 
            }, { status: 400 })
          }
        }
      }
    }

    // Build update data
    const updateData: any = {}
    if (schedulingEnabled !== undefined) updateData.schedulingEnabled = schedulingEnabled
    if (slotDuration !== undefined) updateData.slotDuration = slotDuration
    if (slotCapacity !== undefined) updateData.slotCapacity = slotCapacity
    if (deliveryBufferMinutes !== undefined) updateData.deliveryBufferMinutes = deliveryBufferMinutes
    if (pickupBufferMinutes !== undefined) updateData.pickupBufferMinutes = pickupBufferMinutes
    if (holidayHours !== undefined) updateData.holidayHours = holidayHours

    const business = await prisma.business.update({
      where: { id: businessId },
      data: updateData,
      select: {
        schedulingEnabled: true,
        slotDuration: true,
        slotCapacity: true,
        deliveryBufferMinutes: true,
        pickupBufferMinutes: true,
        holidayHours: true
      }
    })

    return NextResponse.json({
      message: 'Scheduling configuration updated successfully',
      scheduling: {
        schedulingEnabled: business.schedulingEnabled,
        slotDuration: business.slotDuration,
        slotCapacity: business.slotCapacity,
        deliveryBufferMinutes: business.deliveryBufferMinutes,
        pickupBufferMinutes: business.pickupBufferMinutes,
        holidayHours: business.holidayHours || {}
      }
    })

  } catch (error) {
    console.error('Error updating scheduling config:', error)
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 })
  }
}
