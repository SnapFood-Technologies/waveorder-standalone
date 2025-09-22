// app/api/calculate-delivery-fee/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

function calculateDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371
  const dLat = deg2rad(lat2 - lat1)
  const dLng = deg2rad(lng2 - lng1)
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  const d = R * c
  return d
}

function deg2rad(deg: number): number {
  return deg * (Math.PI / 180)
}

async function calculateDeliveryFeeWithZones(
  storeId: string, 
  customerLat: number, 
  customerLng: number
): Promise<{ 
  deliveryFee: number
  distance: number
  zone: string
  zoneId?: string
  isWithinRadius: boolean 
}> {
  const business = await prisma.business.findUnique({
    where: { id: storeId },
    select: {
      deliveryFee: true,
      deliveryRadius: true,
      deliveryEnabled: true,
      address: true,
      storeLatitude: true,
      storeLongitude: true,
      isTemporarilyClosed: true,
      deliveryZones: {
        where: { isActive: true },
        orderBy: { maxDistance: 'asc' }
      }
    }
  })

  if (!business) {
    throw new Error('Business not found')
  }

  if (business.isTemporarilyClosed) {
    throw new Error('Store is temporarily closed')
  }

  if (!business.deliveryEnabled) {
    throw new Error('Delivery is not enabled')
  }

  if (!business.deliveryRadius || business.deliveryRadius <= 0) {
    throw new Error('Delivery radius not configured')
  }

  // If no address configured, use default delivery fee for entire radius
  if (!business.address) {
    if (business.deliveryFee === null || business.deliveryFee === undefined) {
      throw new Error('Delivery fee not configured - please contact store')
    }

    if (business.deliveryFee < 0) {
      throw new Error('Invalid delivery fee configuration')
    }

    return {
      deliveryFee: business.deliveryFee,
      distance: 0, // Cannot calculate distance without store address
      zone: business.deliveryFee === 0 ? 'Free Delivery' : 'Standard Delivery',
      isWithinRadius: true // Assume within radius since we can't calculate distance
    }
  }

  // Address is configured, calculate distance-based pricing
  if (!business.storeLatitude || !business.storeLongitude) {
    throw new Error('Store coordinates not configured - cannot calculate delivery distance')
  }
  
  const distanceKm = calculateDistance(
    business.storeLatitude,
    business.storeLongitude,
    customerLat,
    customerLng
  )

  const isWithinRadius = distanceKm <= business.deliveryRadius
  
  if (!isWithinRadius) {
    throw new Error(`Address is outside delivery area (${business.deliveryRadius}km radius)`)
  }

  // If no custom zones are configured, use the single delivery fee from configuration
  if (business.deliveryZones.length === 0) {
    if (business.deliveryFee === null || business.deliveryFee === undefined) {
      throw new Error('Delivery fee not configured - please contact store')
    }

    if (business.deliveryFee < 0) {
      throw new Error('Invalid delivery fee configuration')
    }

    return {
      deliveryFee: business.deliveryFee,
      distance: Math.round(distanceKm * 100) / 100,
      zone: business.deliveryFee === 0 ? 'Free Delivery' : 'Standard Delivery',
      isWithinRadius
    }
  }

  // Use custom delivery zones
  let selectedZone = null
  for (const zone of business.deliveryZones) {
    if (distanceKm <= zone.maxDistance) {
      selectedZone = zone
      break
    }
  }

  if (!selectedZone) {
    selectedZone = business.deliveryZones[business.deliveryZones.length - 1]
    
    if (distanceKm > selectedZone.maxDistance) {
      throw new Error(`Address is outside all delivery zones (maximum ${selectedZone.maxDistance}km)`)
    }
  }

  if (selectedZone.fee === null || selectedZone.fee === undefined || selectedZone.fee < 0) {
    throw new Error(`Invalid fee configuration for ${selectedZone.name}`)
  }

  return {
    deliveryFee: selectedZone.fee,
    distance: Math.round(distanceKm * 100) / 100,
    zone: selectedZone.name,
    zoneId: selectedZone.id,
    isWithinRadius
  }
}

export async function POST(request: NextRequest) {
  try {
    const { storeId, customerLat, customerLng } = await request.json()

    if (!storeId || !customerLat || !customerLng) {
      return NextResponse.json({ 
        error: 'Missing required fields: storeId, customerLat, customerLng' 
      }, { status: 400 })
    }

    if (
      typeof customerLat !== 'number' || 
      typeof customerLng !== 'number' ||
      customerLat < -90 || customerLat > 90 ||
      customerLng < -180 || customerLng > 180
    ) {
      return NextResponse.json({ 
        error: 'Invalid coordinates' 
      }, { status: 400 })
    }

    const result = await calculateDeliveryFeeWithZones(storeId, customerLat, customerLng)

    return NextResponse.json({
      success: true,
      deliveryFee: result.deliveryFee,
      distance: result.distance,
      zone: result.zone,
      zoneId: result.zoneId,
      message: `Delivery fee calculated for ${result.zone}`
    })

  } catch (error) {
    console.error('Delivery fee calculation error:', error)
    
    if (error instanceof Error) {
      if (error.message.includes('outside delivery area') || error.message.includes('outside all delivery zones')) {
        return NextResponse.json({ 
          error: error.message,
          code: 'OUTSIDE_DELIVERY_AREA'
        }, { status: 400 })
      }
      
      if (error.message === 'Business not found') {
        return NextResponse.json({ 
          error: 'Store not found' 
        }, { status: 404 })
      }

      if (error.message.includes('not configured') || error.message.includes('not enabled') || error.message === 'Store is temporarily closed') {
        return NextResponse.json({ 
          error: error.message,
          code: 'DELIVERY_NOT_AVAILABLE'
        }, { status: 400 })
      }
    }
    
    return NextResponse.json({
      error: 'Failed to calculate delivery fee',
      code: 'CALCULATION_FAILED'
    }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const storeId = searchParams.get('storeId')

    if (!storeId) {
      return NextResponse.json({ 
        error: 'Missing storeId parameter' 
      }, { status: 400 })
    }

    const business = await prisma.business.findUnique({
      where: { id: storeId },
      select: {
        name: true,
        address: true,
        deliveryEnabled: true,
        deliveryFee: true,
        deliveryRadius: true,
        storeLatitude: true,
        storeLongitude: true,
        currency: true,
        isTemporarilyClosed: true,
        deliveryZones: {
          where: { isActive: true },
          orderBy: { sortOrder: 'asc' },
          select: {
            id: true,
            name: true,
            description: true,
            maxDistance: true,
            fee: true
          }
        }
      }
    })

    if (!business) {
      return NextResponse.json({ 
        error: 'Store not found' 
      }, { status: 404 })
    }

    if (!business.deliveryEnabled) {
      return NextResponse.json({ 
        error: 'Delivery not available for this store' 
      }, { status: 404 })
    }

    if (business.isTemporarilyClosed) {
      return NextResponse.json({ 
        error: 'Store is temporarily closed' 
      }, { status: 400 })
    }

    // Return actual zones if they exist, otherwise show what the single fee would be
    let zones = business.deliveryZones

    if (zones.length === 0) {
      // Don't create fake zones, just return the delivery info
      return NextResponse.json({
        success: true,
        storeName: business.name,
        storeAddress: business.address,
        storeCoordinates: {
          latitude: business.storeLatitude,
          longitude: business.storeLongitude
        },
        deliveryRadius: business.deliveryRadius,
        baseFee: business.deliveryFee,
        currency: business.currency,
        zones: [], // No zones configured
        usesFixedFee: true,
        fixedFeeAmount: business.deliveryFee
      })
    }

    return NextResponse.json({
      success: true,
      storeName: business.name,
      storeAddress: business.address,
      storeCoordinates: {
        latitude: business.storeLatitude,
        longitude: business.storeLongitude
      },
      deliveryRadius: business.deliveryRadius,
      baseFee: business.deliveryFee,
      currency: business.currency,
      zones: zones,
      usesFixedFee: false
    })

  } catch (error) {
    console.error('Get delivery zones error:', error)
    return NextResponse.json({
      error: 'Failed to get delivery information'
    }, { status: 500 })
  }
}