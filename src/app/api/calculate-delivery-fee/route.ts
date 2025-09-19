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

async function calculateDeliveryFee(
  storeId: string, 
  customerLat: number, 
  customerLng: number
): Promise<{ 
  deliveryFee: number
  distance: number
  zone: string
  isWithinRadius: boolean 
}> {
  const business = await prisma.business.findUnique({
    where: { id: storeId },
    select: {
      deliveryFee: true,
      deliveryRadius: true,
      storeLatitude: true,
      storeLongitude: true,
    }
  })

  if (!business) {
    throw new Error('Business not found')
  }

  const storeLatitude = business.storeLatitude || 41.3275
  const storeLongitude = business.storeLongitude || 19.8187
  
  const distanceKm = calculateDistance(
    storeLatitude,
    storeLongitude,
    customerLat,
    customerLng
  )

  const isWithinRadius = distanceKm <= business.deliveryRadius
  
  if (!isWithinRadius) {
    throw new Error(`Address is outside delivery area (${business.deliveryRadius}km radius)`)
  }

  let deliveryFee = business.deliveryFee
  let zone = 'Zone 1'

  if (distanceKm <= 2) {
    deliveryFee = business.deliveryFee
    zone = 'Zone 1 (0-2km)'
  } else if (distanceKm <= 5) {
    deliveryFee = Math.round(business.deliveryFee * 1.5 * 100) / 100
    zone = 'Zone 2 (2-5km)'
  } else if (distanceKm <= 10) {
    deliveryFee = Math.round(business.deliveryFee * 2 * 100) / 100
    zone = 'Zone 3 (5-10km)'
  } else {
    deliveryFee = Math.round(business.deliveryFee * 2.5 * 100) / 100
    zone = 'Zone 4 (10km+)'
  }

  return {
    deliveryFee,
    distance: Math.round(distanceKm * 100) / 100,
    zone,
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

    const result = await calculateDeliveryFee(storeId, customerLat, customerLng)

    return NextResponse.json({
      success: true,
      deliveryFee: result.deliveryFee,
      distance: result.distance,
      zone: result.zone,
      message: `Delivery fee calculated for ${result.zone}`
    })

  } catch (error) {
    console.error('Delivery fee calculation error:', error)
    
    if (error instanceof Error) {
      if (error.message.includes('outside delivery area')) {
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
        deliveryFee: true,
        deliveryRadius: true,
        deliveryEnabled: true,
        address: true,
        name: true,
        storeLatitude: true,
        storeLongitude: true,
      }
    })

    if (!business || !business.deliveryEnabled) {
      return NextResponse.json({ 
        error: 'Delivery not available for this store' 
      }, { status: 404 })
    }

    const zones = [
      {
        name: 'Zone 1 (0-2km)',
        maxDistance: 2,
        fee: business.deliveryFee,
        description: 'Close delivery area'
      },
      {
        name: 'Zone 2 (2-5km)',
        maxDistance: 5,
        fee: Math.round(business.deliveryFee * 1.5 * 100) / 100,
        description: 'Medium distance delivery'
      },
      {
        name: 'Zone 3 (5-10km)',
        maxDistance: 10,
        fee: Math.round(business.deliveryFee * 2 * 100) / 100,
        description: 'Far delivery area'
      }
    ]

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
      zones: zones.filter(zone => zone.maxDistance <= business.deliveryRadius)
    })

  } catch (error) {
    console.error('Get delivery zones error:', error)
    return NextResponse.json({
      error: 'Failed to get delivery information'
    }, { status: 500 })
  }
}