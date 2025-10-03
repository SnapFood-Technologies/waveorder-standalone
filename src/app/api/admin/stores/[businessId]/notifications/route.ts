// app/api/admin/stores/[businessId]/notifications/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { checkBusinessAccess } from '@/lib/api-helpers'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

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

    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const offset = (page - 1) * limit

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