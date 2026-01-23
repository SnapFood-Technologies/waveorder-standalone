import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// GET - Get all connected businesses for this business
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ businessId: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email! }
    })

    if (!user || user.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Forbidden - SuperAdmin access required' }, { status: 403 })
    }

    const { businessId } = await params

    // Get current business with connected businesses
    const business = await prisma.business.findUnique({
      where: { id: businessId },
      select: {
        id: true,
        connectedBusinesses: true
      }
    })

    if (!business) {
      return NextResponse.json({ error: 'Business not found' }, { status: 404 })
    }

    // Get details of connected businesses
    const connectedBusinessDetails = await prisma.business.findMany({
      where: {
        id: { in: business.connectedBusinesses }
      },
      select: {
        id: true,
        name: true,
        slug: true,
        logo: true,
        businessType: true,
        isActive: true
      }
    })

    return NextResponse.json({ 
      connectedBusinesses: connectedBusinessDetails 
    })

  } catch (error) {
    console.error('Error fetching connected businesses:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST - Connect businesses (bidirectional)
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ businessId: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email! }
    })

    if (!user || user.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Forbidden - SuperAdmin access required' }, { status: 403 })
    }

    const { businessId } = await params
    const body = await request.json()
    const { targetBusinessId } = body

    if (!targetBusinessId) {
      return NextResponse.json({ error: 'Target business ID is required' }, { status: 400 })
    }

    if (targetBusinessId === businessId) {
      return NextResponse.json({ error: 'Cannot connect business to itself' }, { status: 400 })
    }

    // Check if target business exists
    const targetBusiness = await prisma.business.findUnique({
      where: { id: targetBusinessId }
    })

    if (!targetBusiness) {
      return NextResponse.json({ error: 'Target business not found' }, { status: 404 })
    }

    // Get current business
    const currentBusiness = await prisma.business.findUnique({
      where: { id: businessId },
      select: { connectedBusinesses: true }
    })

    if (!currentBusiness) {
      return NextResponse.json({ error: 'Business not found' }, { status: 404 })
    }

    // Check if already connected
    if (currentBusiness.connectedBusinesses.includes(targetBusinessId)) {
      return NextResponse.json({ error: 'Already connected to this business' }, { status: 400 })
    }

    // BIDIRECTIONAL CONNECTION:
    await prisma.$transaction([
      prisma.business.update({
        where: { id: businessId },
        data: {
          connectedBusinesses: {
            push: targetBusinessId
          }
        }
      }),
      prisma.business.update({
        where: { id: targetBusinessId },
        data: {
          connectedBusinesses: {
            push: businessId
          }
        }
      })
    ])

    return NextResponse.json({ 
      success: true,
      message: 'Successfully connected businesses',
      connectedBusinessId: targetBusinessId
    })

  } catch (error) {
    console.error('Error connecting businesses:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// DELETE - Disconnect businesses (bidirectional)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ businessId: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email! }
    })

    if (!user || user.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Forbidden - SuperAdmin access required' }, { status: 403 })
    }

    const { businessId } = await params
    const { searchParams } = new URL(request.url)
    const targetBusinessId = searchParams.get('targetBusinessId')

    if (!targetBusinessId) {
      return NextResponse.json({ error: 'Target business ID is required' }, { status: 400 })
    }

    // Get businesses
    const currentBusiness = await prisma.business.findUnique({
      where: { id: businessId },
      select: { connectedBusinesses: true }
    })

    const targetBusiness = await prisma.business.findUnique({
      where: { id: targetBusinessId },
      select: { connectedBusinesses: true }
    })

    if (!currentBusiness || !targetBusiness) {
      return NextResponse.json({ error: 'Business not found' }, { status: 404 })
    }

    // Check if connected
    if (!currentBusiness.connectedBusinesses.includes(targetBusinessId)) {
      return NextResponse.json({ error: 'Businesses are not connected' }, { status: 400 })
    }

    // BIDIRECTIONAL DISCONNECTION:
    await prisma.$transaction([
      prisma.business.update({
        where: { id: businessId },
        data: {
          connectedBusinesses: currentBusiness.connectedBusinesses.filter(
            (id) => id !== targetBusinessId
          )
        }
      }),
      prisma.business.update({
        where: { id: targetBusinessId },
        data: {
          connectedBusinesses: targetBusiness.connectedBusinesses.filter(
            (id) => id !== businessId
          )
        }
      })
    ])

    return NextResponse.json({ 
      success: true,
      message: 'Successfully disconnected businesses'
    })

  } catch (error) {
    console.error('Error disconnecting businesses:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
