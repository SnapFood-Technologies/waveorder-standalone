// src/app/api/admin/stores/[businessId]/scheduling/slots/route.ts
// Check slot availability and capacity
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

    const { searchParams } = new URL(request.url)
    const date = searchParams.get('date') // YYYY-MM-DD format

    if (!date) {
      return NextResponse.json({ message: 'Date parameter is required' }, { status: 400 })
    }

    const business = await prisma.business.findUnique({
      where: { id: businessId },
      select: {
        slotDuration: true,
        slotCapacity: true,
        businessHours: true,
        holidayHours: true,
        timezone: true
      }
    })

    if (!business) {
      return NextResponse.json({ message: 'Business not found' }, { status: 404 })
    }

    // Get orders for this date to count per-slot bookings
    const startOfDay = new Date(`${date}T00:00:00.000Z`)
    const endOfDay = new Date(`${date}T23:59:59.999Z`)

    const orders = await prisma.order.findMany({
      where: {
        businessId,
        deliveryTime: {
          gte: startOfDay,
          lte: endOfDay
        },
        status: {
          notIn: ['CANCELLED', 'REFUNDED']
        }
      },
      select: {
        deliveryTime: true
      }
    })

    // Count orders per slot
    const slotCounts = new Map<string, number>()
    orders.forEach(order => {
      if (order.deliveryTime) {
        const slotKey = getSlotKey(order.deliveryTime, business.slotDuration)
        slotCounts.set(slotKey, (slotCounts.get(slotKey) || 0) + 1)
      }
    })

    // Generate all slots for the day with availability info
    const slots = generateSlotsForDate(
      date,
      business.businessHours as any,
      business.holidayHours as any,
      business.slotDuration,
      business.slotCapacity,
      slotCounts
    )

    return NextResponse.json({
      date,
      slotDuration: business.slotDuration,
      slotCapacity: business.slotCapacity,
      slots
    })

  } catch (error) {
    console.error('Error fetching slot availability:', error)
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 })
  }
}

function getSlotKey(date: Date, slotDuration: number): string {
  const hours = date.getUTCHours()
  const minutes = Math.floor(date.getUTCMinutes() / slotDuration) * slotDuration
  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`
}

function generateSlotsForDate(
  date: string,
  businessHours: any,
  holidayHours: any,
  slotDuration: number,
  slotCapacity: number | null,
  slotCounts: Map<string, number>
): Array<{ time: string; available: boolean; booked: number; capacity: number | null }> {
  const dayOfWeek = new Date(date).toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase()
  
  // Check holiday hours first
  let dayHours = holidayHours?.[date]
  
  // If no holiday hours, use regular business hours
  if (!dayHours) {
    dayHours = businessHours?.[dayOfWeek]
  }

  if (!dayHours || dayHours.closed) {
    return []
  }

  const slots: Array<{ time: string; available: boolean; booked: number; capacity: number | null }> = []
  
  const [openHour, openMin] = dayHours.open.split(':').map(Number)
  const [closeHour, closeMin] = dayHours.close.split(':').map(Number)
  
  let currentHour = openHour
  let currentMin = openMin

  while (currentHour < closeHour || (currentHour === closeHour && currentMin < closeMin)) {
    const timeStr = `${currentHour.toString().padStart(2, '0')}:${currentMin.toString().padStart(2, '0')}`
    const booked = slotCounts.get(timeStr) || 0
    const available = slotCapacity === null || booked < slotCapacity

    slots.push({
      time: timeStr,
      available,
      booked,
      capacity: slotCapacity
    })

    // Increment time by slot duration
    currentMin += slotDuration
    if (currentMin >= 60) {
      currentHour += Math.floor(currentMin / 60)
      currentMin = currentMin % 60
    }
  }

  return slots
}
