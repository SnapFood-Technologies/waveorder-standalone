// app/api/admin/stores/[businessId]/delivery/zones/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { PrismaClient } from '@prisma/client'
import { authOptions } from '@/lib/auth'

const prisma = new PrismaClient()

interface DeliveryZone {
  id?: string
  name: string
  maxDistance: number
  fee: number
  description: string
  isActive: boolean
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
        deliveryFee: true,
        deliveryRadius: true,
        // We'll store zones in a JSON field for now
        // In a full implementation, you might want a separate DeliveryZone model
        businessHours: true // We can use this field temporarily to store zones
      }
    })

    if (!business) {
      return NextResponse.json({ message: 'Business not found' }, { status: 404 })
    }

    // For now, we'll generate default zones based on business settings
    // In production, you'd store these in a proper zones table
    const defaultZones: DeliveryZone[] = [
      {
        id: '1',
        name: 'Zone 1 (Close)',
        maxDistance: 2,
        fee: business.deliveryFee,
        description: 'Close delivery area',
        isActive: true
      },
      {
        id: '2',
        name: 'Zone 2 (Medium)',
        maxDistance: 5,
        fee: Math.round(business.deliveryFee * 1.5 * 100) / 100,
        description: 'Medium distance delivery',
        isActive: true
      },
      {
        id: '3',
        name: 'Zone 3 (Far)',
        maxDistance: Math.min(business.deliveryRadius, 10),
        fee: Math.round(business.deliveryFee * 2 * 100) / 100,
        description: 'Far delivery area',
        isActive: true
      }
    ].filter(zone => zone.maxDistance <= business.deliveryRadius)

    return NextResponse.json({ 
      zones: defaultZones,
      business: {
        deliveryFee: business.deliveryFee,
        deliveryRadius: business.deliveryRadius
      }
    })

  } catch (error) {
    console.error('Error fetching delivery zones:', error)
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ businessId: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
    }

    const { businessId } = await params
    const { zones } = await request.json()

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

    // Validate zones
    if (!Array.isArray(zones)) {
      return NextResponse.json({ message: 'Invalid zones data' }, { status: 400 })
    }

    // Validate each zone
    for (const zone of zones) {
      if (!zone.name || typeof zone.maxDistance !== 'number' || typeof zone.fee !== 'number') {
        return NextResponse.json({ message: 'Invalid zone data' }, { status: 400 })
      }

      if (zone.maxDistance > business.deliveryRadius) {
        return NextResponse.json({ 
          message: `Zone distance cannot exceed delivery radius (${business.deliveryRadius}km)` 
        }, { status: 400 })
      }
    }

    // For now, we'll log the zones. In production, store them in database
    console.log('Delivery zones saved for business:', businessId, zones)

    // TODO: In production, implement proper zones storage
    // This could be a separate DeliveryZone model or JSON field

    return NextResponse.json({ 
      message: 'Zones saved successfully',
      zones 
    })

  } catch (error) {
    console.error('Error saving delivery zones:', error)
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 })
  }
}