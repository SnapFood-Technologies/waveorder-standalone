import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(
  request: NextRequest,
  { params }: { params: { itemId: string } }
) {
  try {
    const item = await prisma.roadmapItem.findUnique({
      where: { id: params.itemId, isPublic: true }
    })

    if (!item) {
      return NextResponse.json({ message: 'Item not found' }, { status: 404 })
    }

    const comments = await prisma.roadmapComment.findMany({
      where: { roadmapItemId: params.itemId },
      orderBy: { createdAt: 'desc' },
      take: 50,
    })

    return NextResponse.json({ comments })
  } catch (error) {
    console.error('Error fetching comments:', error)
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { itemId: string } }
) {
  try {
    const item = await prisma.roadmapItem.findUnique({
      where: { id: params.itemId, isPublic: true }
    })

    if (!item) {
      return NextResponse.json({ message: 'Item not found' }, { status: 404 })
    }

    const data = await request.json()

    if (!data.name?.trim()) {
      return NextResponse.json({ message: 'Name is required' }, { status: 400 })
    }

    if (!data.email?.trim()) {
      return NextResponse.json({ message: 'Email is required' }, { status: 400 })
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(data.email.trim())) {
      return NextResponse.json({ message: 'Invalid email format' }, { status: 400 })
    }

    if (!data.body?.trim()) {
      return NextResponse.json({ message: 'Comment is required' }, { status: 400 })
    }

    if (data.body.trim().length > 1000) {
      return NextResponse.json({ message: 'Comment must be under 1000 characters' }, { status: 400 })
    }

    const comment = await prisma.roadmapComment.create({
      data: {
        roadmapItemId: params.itemId,
        name: data.name.trim(),
        email: data.email.trim().toLowerCase(),
        body: data.body.trim(),
      }
    })

    return NextResponse.json({ success: true, comment }, { status: 201 })
  } catch (error) {
    console.error('Error creating comment:', error)
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 })
  }
}
