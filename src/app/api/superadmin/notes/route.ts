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
    const type = searchParams.get('type') || 'all'
    const category = searchParams.get('category') || 'all'
    const status = searchParams.get('status') || 'all'
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const offset = (page - 1) * limit

    const where: any = {}

    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { content: { contains: search, mode: 'insensitive' } },
      ]
    }

    if (type !== 'all') {
      where.type = type.toUpperCase()
    }

    if (category !== 'all') {
      where.category = category.toUpperCase()
    }

    if (status === 'done') {
      where.isDone = true
    } else if (status === 'pending') {
      where.isDone = false
    } else if (status === 'overdue') {
      where.isDone = false
      where.dueDate = { lt: new Date() }
    }

    const [notes, total] = await Promise.all([
      prisma.superAdminNote.findMany({
        where,
        include: {
          createdBy: {
            select: { id: true, name: true, email: true }
          }
        },
        orderBy: { createdAt: 'desc' },
        skip: offset,
        take: limit,
      }),
      prisma.superAdminNote.count({ where }),
    ])

    return NextResponse.json({
      notes,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    console.error('Error fetching notes:', error)
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

    const note = await prisma.superAdminNote.create({
      data: {
        title: data.title.trim(),
        content: data.content?.trim() || null,
        type: data.type || 'INTERNAL',
        category: data.category || 'GENERAL',
        dueDate: data.dueDate ? new Date(data.dueDate) : null,
        createdById: session.user.id,
      },
      include: {
        createdBy: {
          select: { id: true, name: true, email: true }
        }
      }
    })

    return NextResponse.json({ success: true, note }, { status: 201 })
  } catch (error) {
    console.error('Error creating note:', error)
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 })
  }
}
