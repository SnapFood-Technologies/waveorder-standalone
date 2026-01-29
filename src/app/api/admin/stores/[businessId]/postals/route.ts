// src/app/api/admin/stores/[businessId]/postals/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { checkBusinessAccess } from '@/lib/api-helpers'
import { prisma } from '@/lib/prisma'

// GET - List all postal services for a business
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

    const postals = await prisma.postal.findMany({
      where: { businessId },
      orderBy: { createdAt: 'desc' },
      include: {
        _count: {
          select: { pricing: true }
        }
      }
    })

    return NextResponse.json({ postals })
  } catch (error) {
    console.error('Error fetching postals:', error)
    return NextResponse.json(
      { message: 'Failed to fetch postal services' },
      { status: 500 }
    )
  }
}

// POST - Create a new postal service
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

    const body = await request.json()
    const { name, nameAl, nameEl, type, description, descriptionAl, descriptionEl, deliveryTime, deliveryTimeAl, deliveryTimeEl, logo, isActive } = body

    if (!name || !name.trim()) {
      return NextResponse.json(
        { message: 'Postal service name is required' },
        { status: 400 }
      )
    }

    // Validate type
    if (type && !['normal', 'fast'].includes(type)) {
      return NextResponse.json(
        { message: 'Type must be "normal" or "fast"' },
        { status: 400 }
      )
    }

    const postal = await prisma.postal.create({
      data: {
        businessId,
        name: name.trim(),
        nameAl: nameAl?.trim() || null,
        nameEl: nameEl?.trim() || null,
        type: type || 'normal',
        description: description?.trim() || null,
        descriptionAl: descriptionAl?.trim() || null,
        descriptionEl: descriptionEl?.trim() || null,
        deliveryTime: deliveryTime?.trim() || null,
        deliveryTimeAl: deliveryTimeAl?.trim() || null,
        deliveryTimeEl: deliveryTimeEl?.trim() || null,
        logo: logo?.trim() || null,
        isActive: isActive !== undefined ? Boolean(isActive) : true
      }
    })

    return NextResponse.json({ postal }, { status: 201 })
  } catch (error: any) {
    console.error('Error creating postal:', error)
    
    // Handle unique constraint violation
    if (error.code === 'P2002') {
      return NextResponse.json(
        { message: 'A postal service with this name already exists' },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { message: 'Failed to create postal service' },
      { status: 500 }
    )
  }
}
