import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ itemId: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || session.user.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
    }

    const { itemId } = await params

    const item = await prisma.roadmapItem.findUnique({
      where: { id: itemId },
      include: {
        comments: {
          orderBy: { createdAt: 'desc' },
          take: 50,
        },
        _count: {
          select: { votes: true, comments: true }
        }
      }
    })

    if (!item) {
      return NextResponse.json({ message: 'Item not found' }, { status: 404 })
    }

    return NextResponse.json({ item })
  } catch (error) {
    console.error('Error fetching roadmap item:', error)
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 })
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ itemId: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || session.user.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
    }

    const { itemId } = await params
    const data = await request.json()

    const existing = await prisma.roadmapItem.findUnique({
      where: { id: itemId }
    })

    if (!existing) {
      return NextResponse.json({ message: 'Item not found' }, { status: 404 })
    }

    const updateData: any = {}

    if (data.title !== undefined) updateData.title = data.title.trim()
    if (data.description !== undefined) updateData.description = data.description?.trim() || null
    if (data.status !== undefined) updateData.status = data.status
    if (data.category !== undefined) updateData.category = data.category
    if (data.isPublic !== undefined) updateData.isPublic = data.isPublic
    if (data.isPinned !== undefined) updateData.isPinned = data.isPinned

    const item = await prisma.roadmapItem.update({
      where: { id: itemId },
      data: updateData,
    })

    return NextResponse.json({ success: true, item })
  } catch (error) {
    console.error('Error updating roadmap item:', error)
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ itemId: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || session.user.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
    }

    const { itemId } = await params

    const existing = await prisma.roadmapItem.findUnique({
      where: { id: itemId }
    })

    if (!existing) {
      return NextResponse.json({ message: 'Item not found' }, { status: 404 })
    }

    await prisma.roadmapItem.delete({
      where: { id: itemId }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting roadmap item:', error)
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 })
  }
}
