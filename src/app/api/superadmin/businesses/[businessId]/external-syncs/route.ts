import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

// GET - List all external syncs for a business
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ businessId: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || session.user.role !== 'SUPER_ADMIN') {
      return NextResponse.json(
        { message: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { businessId } = await params

    // Verify business exists
    const business = await prisma.business.findUnique({
      where: { id: businessId },
      select: { id: true }
    })

    if (!business) {
      return NextResponse.json(
        { message: 'Business not found' },
        { status: 404 }
      )
    }

    // Fetch all external syncs for this business
    const syncs = await prisma.externalSync.findMany({
      where: { businessId },
      orderBy: { createdAt: 'desc' }
    })

    return NextResponse.json({ syncs })
  } catch (error: any) {
    console.error('Error fetching external syncs:', error)
    return NextResponse.json(
      { message: 'Internal server error', error: error.message },
      { status: 500 }
    )
  }
}

// POST - Create a new external sync
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ businessId: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || session.user.role !== 'SUPER_ADMIN') {
      return NextResponse.json(
        { message: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { businessId } = await params
    const body = await request.json()

    // Verify business exists
    const business = await prisma.business.findUnique({
      where: { id: businessId },
      select: { id: true }
    })

    if (!business) {
      return NextResponse.json(
        { message: 'Business not found' },
        { status: 404 }
      )
    }

    // Validate required fields
    if (!body.name) {
      return NextResponse.json(
        { message: 'Name is required' },
        { status: 400 }
      )
    }

    // Create external sync
    const sync = await prisma.externalSync.create({
      data: {
        businessId,
        name: body.name,
        externalSystemName: body.externalSystemName || null,
        externalSystemBaseUrl: body.externalSystemBaseUrl || null,
        externalSystemApiKey: body.externalSystemApiKey || null,
        externalSystemEndpoints: body.externalSystemEndpoints || null,
        externalBrandIds: body.externalBrandIds || null,
        isActive: body.isActive !== undefined ? body.isActive : true
      }
    })

    return NextResponse.json({ sync }, { status: 201 })
  } catch (error: any) {
    console.error('Error creating external sync:', error)
    return NextResponse.json(
      { message: 'Internal server error', error: error.message },
      { status: 500 }
    )
  }
}
