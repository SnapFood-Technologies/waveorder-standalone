import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || session.user.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search') || ''
    const status = searchParams.get('status') || 'all'
    const category = searchParams.get('category') || 'all'
    const visibility = searchParams.get('visibility') || 'all'
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const offset = (page - 1) * limit

    const where: any = {}

    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ]
    }

    if (status !== 'all') {
      where.status = status.toUpperCase()
    }

    if (category !== 'all') {
      where.category = category.toUpperCase()
    }

    if (visibility === 'public') {
      where.isPublic = true
    } else if (visibility === 'internal') {
      where.isPublic = false
    }

    const [items, total] = await Promise.all([
      prisma.roadmapItem.findMany({
        where,
        include: {
          _count: {
            select: {
              votes: true,
              comments: true,
            }
          }
        },
        orderBy: [
          { isPinned: 'desc' },
          { createdAt: 'desc' },
        ],
        skip: offset,
        take: limit,
      }),
      prisma.roadmapItem.count({ where }),
    ])

    return NextResponse.json({
      items,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    console.error('Error fetching roadmap items:', error)
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || session.user.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
    }

    const data = await request.json()

    if (!data.title?.trim()) {
      return NextResponse.json({ message: 'Title is required' }, { status: 400 })
    }

    const validStatuses = ['IDEA', 'THINKING', 'PLANNED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED']
    const validCategories = ['STOREFRONT', 'ADMIN', 'PAYMENTS', 'WHATSAPP_FLOWS', 'INTEGRATIONS', 'ANALYTICS', 'PERFORMANCE', 'MOBILE', 'OTHER']

    if (data.status && !validStatuses.includes(data.status)) {
      return NextResponse.json({ message: 'Invalid status' }, { status: 400 })
    }

    if (data.category && !validCategories.includes(data.category)) {
      return NextResponse.json({ message: 'Invalid category' }, { status: 400 })
    }

    const item = await prisma.roadmapItem.create({
      data: {
        title: data.title.trim(),
        description: data.description?.trim() || null,
        status: data.status || 'IDEA',
        category: data.category || 'OTHER',
        isPublic: data.isPublic ?? false,
        isPinned: data.isPinned ?? false,
      },
    })

    return NextResponse.json({ success: true, item }, { status: 201 })
  } catch (error) {
    console.error('Error creating roadmap item:', error)
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 })
  }
}
