// app/api/admin/stores/[businessId]/notifications/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { PrismaClient } from '@prisma/client'
import { authOptions } from '@/lib/auth'

const prisma = new PrismaClient()

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ businessId: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
    }

    const { businessId } = await params
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const offset = (page - 1) * limit

    // Verify user has access to business
    const business = await prisma.business.findFirst({
      where: {
        id: businessId,
        users: {
          some: {
            user: {
              email: session.user.email
            }
          }
        }
      },
      select: { id: true }
    })

    if (!business) {
      return NextResponse.json({ message: 'Business not found' }, { status: 404 })
    }

    // Fetch notifications with pagination
    const [notifications, total] = await Promise.all([
      prisma.orderNotification.findMany({
        where: { businessId },
        orderBy: { notifiedAt: 'desc' },
        skip: offset,
        take: limit,
        select: {
          id: true,
          orderNumber: true,
          orderStatus: true,
          customerName: true,
          total: true,
          notifiedAt: true,
          emailSent: true,
          emailError: true
        }
      }),
      prisma.orderNotification.count({
        where: { businessId }
      })
    ])

    return NextResponse.json({
      notifications,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    })

  } catch (error) {
    console.error('Error fetching notifications:', error)
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 })
  }
}