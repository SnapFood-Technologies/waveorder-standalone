// src/app/api/admin/stores/[businessId]/packaging/types/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { checkBusinessAccess } from '@/lib/api-helpers'

// GET - Fetch all packaging types for a business
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

    // Check if packaging tracking is enabled
    const business = await prisma.business.findUnique({
      where: { id: businessId },
      select: { packagingTrackingEnabled: true }
    })

    if (!business?.packagingTrackingEnabled) {
      return NextResponse.json({ message: 'Packaging tracking is not enabled for this business' }, { status: 403 })
    }

    const packagingTypes = await prisma.packagingType.findMany({
      where: { businessId },
      orderBy: { createdAt: 'desc' }
    })

    return NextResponse.json({ packagingTypes })

  } catch (error) {
    console.error('Error fetching packaging types:', error)
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 })
  }
}

// POST - Create a new packaging type
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

    // Check if packaging tracking is enabled
    const business = await prisma.business.findUnique({
      where: { id: businessId },
      select: { packagingTrackingEnabled: true }
    })

    if (!business?.packagingTrackingEnabled) {
      return NextResponse.json({ message: 'Packaging tracking is not enabled for this business' }, { status: 403 })
    }

    const { name, description, unit } = await request.json()

    if (!name?.trim()) {
      return NextResponse.json({ message: 'Packaging type name is required' }, { status: 400 })
    }

    const packagingType = await prisma.packagingType.create({
      data: {
        businessId,
        name: name.trim(),
        description: description?.trim() || null,
        unit: unit || 'piece',
        isActive: true
      }
    })

    return NextResponse.json({ packagingType }, { status: 201 })

  } catch (error) {
    console.error('Error creating packaging type:', error)
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 })
  }
}
