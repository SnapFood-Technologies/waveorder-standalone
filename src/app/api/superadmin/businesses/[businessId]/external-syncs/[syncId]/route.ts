import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

// GET - Get a specific external sync
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ businessId: string; syncId: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || session.user.role !== 'SUPER_ADMIN') {
      return NextResponse.json(
        { message: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { businessId, syncId } = await params

    const sync = await prisma.externalSync.findFirst({
      where: {
        id: syncId,
        businessId
      }
    })

    if (!sync) {
      return NextResponse.json(
        { message: 'External sync not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({ sync })
  } catch (error: any) {
    console.error('Error fetching external sync:', error)
    return NextResponse.json(
      { message: 'Internal server error', error: error.message },
      { status: 500 }
    )
  }
}

// PUT - Update an external sync
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ businessId: string; syncId: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || session.user.role !== 'SUPER_ADMIN') {
      return NextResponse.json(
        { message: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { businessId, syncId } = await params
    const body = await request.json()

    // Verify sync exists and belongs to business
    const existingSync = await prisma.externalSync.findFirst({
      where: {
        id: syncId,
        businessId
      }
    })

    if (!existingSync) {
      return NextResponse.json(
        { message: 'External sync not found' },
        { status: 404 }
      )
    }

    // Update sync
    const sync = await prisma.externalSync.update({
      where: { id: syncId },
      data: {
        name: body.name !== undefined ? body.name : existingSync.name,
        externalSystemName: body.externalSystemName !== undefined ? body.externalSystemName : existingSync.externalSystemName,
        externalSystemBaseUrl: body.externalSystemBaseUrl !== undefined ? body.externalSystemBaseUrl : existingSync.externalSystemBaseUrl,
        externalSystemApiKey: body.externalSystemApiKey !== undefined ? body.externalSystemApiKey : existingSync.externalSystemApiKey,
        externalSystemEndpoints: body.externalSystemEndpoints !== undefined ? body.externalSystemEndpoints : existingSync.externalSystemEndpoints,
        externalBrandIds: body.externalBrandIds !== undefined ? body.externalBrandIds : existingSync.externalBrandIds,
        isActive: body.isActive !== undefined ? body.isActive : existingSync.isActive
      }
    })

    return NextResponse.json({ sync })
  } catch (error: any) {
    console.error('Error updating external sync:', error)
    return NextResponse.json(
      { message: 'Internal server error', error: error.message },
      { status: 500 }
    )
  }
}

// PATCH - Partial update (mainly for isActive toggle)
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ businessId: string; syncId: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || session.user.role !== 'SUPER_ADMIN') {
      return NextResponse.json(
        { message: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { businessId, syncId } = await params
    const body = await request.json()

    // Verify sync exists and belongs to business
    const existingSync = await prisma.externalSync.findFirst({
      where: {
        id: syncId,
        businessId
      }
    })

    if (!existingSync) {
      return NextResponse.json(
        { message: 'External sync not found' },
        { status: 404 }
      )
    }

    // Update sync with provided fields
    const sync = await prisma.externalSync.update({
      where: { id: syncId },
      data: body
    })

    return NextResponse.json({ sync })
  } catch (error: any) {
    console.error('Error updating external sync:', error)
    return NextResponse.json(
      { message: 'Internal server error', error: error.message },
      { status: 500 }
    )
  }
}

// DELETE - Delete an external sync
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ businessId: string; syncId: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || session.user.role !== 'SUPER_ADMIN') {
      return NextResponse.json(
        { message: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { businessId, syncId } = await params

    // Verify sync exists and belongs to business
    const existingSync = await prisma.externalSync.findFirst({
      where: {
        id: syncId,
        businessId
      }
    })

    if (!existingSync) {
      return NextResponse.json(
        { message: 'External sync not found' },
        { status: 404 }
      )
    }

    // Delete sync
    await prisma.externalSync.delete({
      where: { id: syncId }
    })

    return NextResponse.json({ message: 'External sync deleted successfully' })
  } catch (error: any) {
    console.error('Error deleting external sync:', error)
    return NextResponse.json(
      { message: 'Internal server error', error: error.message },
      { status: 500 }
    )
  }
}
