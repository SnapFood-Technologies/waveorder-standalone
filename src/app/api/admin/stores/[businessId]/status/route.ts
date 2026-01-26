// src/app/api/admin/stores/[businessId]/status/route.ts
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
        isTemporarilyClosed: true,
        closureReason: true,
        closureMessage: true,
        closureStartDate: true,
        closureEndDate: true,
        businessHours: true,
        timezone: true
      }
    })

    if (!business) {
      return NextResponse.json({ message: 'Business not found' }, { status: 404 })
    }

    // Calculate if currently open based on business hours
    const now = new Date()
    const currentDay = now.getDay() // 0 = Sunday, 1 = Monday, etc.
    const currentTime = now.toTimeString().slice(0, 5) // HH:MM format

    let isOpen = false
    let nextChange = ''

    const businessHours = business.businessHours as any
    if (businessHours && !business.isTemporarilyClosed) {
      const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday']
      const today = days[currentDay]
      const todayHours = businessHours[today]

      if (todayHours && !todayHours.closed) {
        const openTime = todayHours.open
        const closeTime = todayHours.close
        
        if (currentTime >= openTime && currentTime <= closeTime) {
          isOpen = true
          nextChange = `Closes at ${closeTime}`
        } else if (currentTime < openTime) {
          nextChange = `Opens at ${openTime}`
        } else {
          // Find next opening day
          for (let i = 1; i <= 7; i++) {
            const nextDayIndex = (currentDay + i) % 7
            const nextDay = days[nextDayIndex]
            const nextDayHours = businessHours[nextDay]
            
            if (nextDayHours && !nextDayHours.closed) {
              const dayName = nextDay.charAt(0).toUpperCase() + nextDay.slice(1)
              nextChange = `Opens ${i === 1 ? 'tomorrow' : dayName} at ${nextDayHours.open}`
              break
            }
          }
        }
      }
    }

    return NextResponse.json({
      status: {
        isOpen: isOpen && !business.isTemporarilyClosed,
        nextChange,
        isTemporarilyClosed: business.isTemporarilyClosed,
        closureReason: business.closureReason,
        closureMessage: business.closureMessage
      }
    })

  } catch (error) {
    console.error('Error fetching business status:', error)
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 })
  }
}