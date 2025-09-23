// app/api/admin/stores/[businessId]/settings/notifications/route.ts
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
      select: {
        orderNotificationsEnabled: true,
        orderNotificationEmail: true,
        orderNotificationLastUpdate: true,
        email: true,
        currency: true
      }
    })

    if (!business) {
      return NextResponse.json({ message: 'Business not found' }, { status: 404 })
    }

    return NextResponse.json({ business })

  } catch (error) {
    console.error('Error fetching notification settings:', error)
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 })
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ businessId: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
    }

    const { businessId } = await params
    const data = await request.json()

    // Verify user has access to business
    const existingBusiness = await prisma.business.findFirst({
      where: {
        id: businessId,
        users: {
          some: {
            user: {
              email: session.user.email
            }
          }
        }
      }
    })

    if (!existingBusiness) {
      return NextResponse.json({ message: 'Business not found' }, { status: 404 })
    }

    // Validate email if notifications are enabled
    if (data.orderNotificationsEnabled && !data.orderNotificationEmail?.trim()) {
      return NextResponse.json({ 
        message: 'Email address is required when notifications are enabled' 
      }, { status: 400 })
    }

    // Update notification settings
    const updatedBusiness = await prisma.business.update({
      where: { id: businessId },
      data: {
        orderNotificationsEnabled: data.orderNotificationsEnabled || false,
        orderNotificationEmail: data.orderNotificationsEnabled 
          ? data.orderNotificationEmail?.trim() || null 
          : null,
        orderNotificationLastUpdate: new Date(),
        updatedAt: new Date()
      },
      select: {
        orderNotificationsEnabled: true,
        orderNotificationEmail: true,
        orderNotificationLastUpdate: true,
        email: true,
        currency: true
      }
    })

    return NextResponse.json({ business: updatedBusiness })

  } catch (error) {
    console.error('Error updating notification settings:', error)
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 })
  }
}