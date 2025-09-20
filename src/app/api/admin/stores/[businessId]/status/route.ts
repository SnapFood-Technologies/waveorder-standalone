// src/app/api/admin/stores/[businessId]/status/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export async function GET(
  request: NextRequest,
  { params }: { params: { businessId: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
    }

    // Verify user has access to this business
    const businessUser = await prisma.businessUser.findFirst({
      where: {
        businessId: params.businessId,
        userId: session.user.id
      }
    })

    if (!businessUser) {
      return NextResponse.json({ message: 'Access denied' }, { status: 403 })
    }

    // Get business data
    const business = await prisma.business.findUnique({
      where: { id: params.businessId },
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

    // Parse business hours (assuming JSON format)
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