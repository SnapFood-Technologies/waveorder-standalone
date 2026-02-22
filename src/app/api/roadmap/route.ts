import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const category = searchParams.get('category') || 'all'

    const where: any = { isPublic: true }

    if (category !== 'all') {
      where.category = category.toUpperCase()
    }

    const items = await prisma.roadmapItem.findMany({
      where,
      select: {
        id: true,
        title: true,
        description: true,
        status: true,
        category: true,
        isPinned: true,
        upvoteCount: true,
        createdAt: true,
        _count: {
          select: { comments: true }
        }
      },
      orderBy: [
        { isPinned: 'desc' },
        { upvoteCount: 'desc' },
        { createdAt: 'desc' },
      ],
    })

    return NextResponse.json({ items })
  } catch (error) {
    console.error('Error fetching public roadmap:', error)
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 })
  }
}
