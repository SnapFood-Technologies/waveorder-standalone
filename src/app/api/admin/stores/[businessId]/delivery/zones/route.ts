// app/api/admin/stores/[businessId]/delivery/zones/route.ts
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
        name: true,
        address: true,
        deliveryFee: true,
        deliveryRadius: true,
        storeLatitude: true,
        storeLongitude: true,
        currency: true,
        deliveryZones: {
          orderBy: { sortOrder: 'asc' },
          select: {
            id: true,
            name: true,
            description: true,
            maxDistance: true,
            fee: true,
            isActive: true,
            sortOrder: true
          }
        }
      }
    })

    if (!business) {
      return NextResponse.json({ message: 'Business not found' }, { status: 404 })
    }

    return NextResponse.json({ 
      business: {
        id: business.id,
        name: business.name,
        address: business.address,
        deliveryFee: business.deliveryFee,
        deliveryRadius: business.deliveryRadius,
        currency: business.currency,
        storeLatitude: business.storeLatitude,
        storeLongitude: business.storeLongitude
      },
      zones: business.deliveryZones
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
    const { businessId } = await params

    const access = await checkBusinessAccess(businessId)
    
    if (!access.authorized) {
      return NextResponse.json({ message: access.error }, { status: access.status })
    }

    const { zones } = await request.json()

    const business = await prisma.business.findUnique({
      where: { id: businessId },
      select: {
        deliveryRadius: true
      }
    })

    if (!business) {
      return NextResponse.json({ message: 'Business not found' }, { status: 404 })
    }

    if (!Array.isArray(zones) || zones.length === 0) {
      return NextResponse.json({ message: 'At least one delivery zone is required' }, { status: 400 })
    }

    for (const zone of zones) {
      if (!zone.name?.trim()) {
        return NextResponse.json({ message: 'Zone name is required' }, { status: 400 })
      }

      if (typeof zone.maxDistance !== 'number' || zone.maxDistance <= 0) {
        return NextResponse.json({ message: 'Zone distance must be greater than 0' }, { status: 400 })
      }

      if (zone.maxDistance > business.deliveryRadius) {
        return NextResponse.json({ 
          message: `Zone distance cannot exceed delivery radius (${business.deliveryRadius}km)` 
        }, { status: 400 })
      }

      if (typeof zone.fee !== 'number' || zone.fee < 0) {
        return NextResponse.json({ message: 'Zone fee cannot be negative' }, { status: 400 })
      }
    }

    await prisma.deliveryZone.deleteMany({
      where: { businessId }
    })

    await prisma.deliveryZone.createMany({
      data: zones.map((zone: any, index: number) => ({
        businessId,
        name: zone.name.trim(),
        description: zone.description?.trim() || null,
        maxDistance: zone.maxDistance,
        fee: zone.fee,
        isActive: zone.isActive !== false,
        sortOrder: zone.sortOrder || index + 1
      }))
    })

    const savedZones = await prisma.deliveryZone.findMany({
      where: { businessId },
      orderBy: { sortOrder: 'asc' },
      select: {
        id: true,
        name: true,
        description: true,
        maxDistance: true,
        fee: true,
        isActive: true,
        sortOrder: true
      }
    })

    return NextResponse.json({ 
      message: 'Zones saved successfully',
      zones: savedZones 
    })

  } catch (error) {
    console.error('Error saving delivery zones:', error)
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 })
  }
}