// app/api/admin/stores/[businessId]/settings/notifications/route.ts
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

    const business = await prisma.business.findUnique({
      where: { id: businessId },
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
    const { businessId } = await params

    const access = await checkBusinessAccess(businessId)
    
    if (!access.authorized) {
      return NextResponse.json({ message: access.error }, { status: access.status })
    }

    const data = await request.json()

    if (data.orderNotificationsEnabled && !data.orderNotificationEmail?.trim()) {
      return NextResponse.json({ 
        message: 'Email address is required when notifications are enabled' 
      }, { status: 400 })
    }

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