// api/superadmin/system/notifications/[businessId]/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

// GET - Fetch SuperAdmin notification settings for a business
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ businessId: string }> }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || session.user.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
    }

    const { businessId } = await params

    const business = await prisma.business.findUnique({
      where: { id: businessId },
      select: {
        id: true,
        name: true,
        businessType: true,
        superAdminNotificationSettings: true
      }
    })

    if (!business) {
      return NextResponse.json({ message: 'Business not found' }, { status: 404 })
    }

    return NextResponse.json({
      business: {
        id: business.id,
        name: business.name,
        businessType: business.businessType
      },
      settings: business.superAdminNotificationSettings
    })
  } catch (error) {
    console.error('SuperAdmin notification settings GET error:', error)
    return NextResponse.json(
      { message: 'Failed to fetch settings' },
      { status: 500 }
    )
  }
}

// PATCH - Update SuperAdmin notification settings for a business
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ businessId: string }> }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || session.user.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
    }

    const { businessId } = await params
    const body = await request.json()

    // Validate emails
    const notificationEmails = Array.isArray(body.notificationEmails)
      ? body.notificationEmails
          .map((e: string) => String(e).trim().toLowerCase())
          .filter((e: string) => e && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e))
      : undefined

    const orderNotificationsEnabled =
      typeof body.orderNotificationsEnabled === 'boolean'
        ? body.orderNotificationsEnabled
        : undefined
    const bookingNotificationsEnabled =
      typeof body.bookingNotificationsEnabled === 'boolean'
        ? body.bookingNotificationsEnabled
        : undefined
    const serviceRequestNotificationsEnabled =
      typeof body.serviceRequestNotificationsEnabled === 'boolean'
        ? body.serviceRequestNotificationsEnabled
        : undefined
    const externalSyncNotificationsEnabled =
      typeof body.externalSyncNotificationsEnabled === 'boolean'
        ? body.externalSyncNotificationsEnabled
        : undefined

    const business = await prisma.business.findUnique({
      where: { id: businessId },
      select: { id: true, superAdminNotificationSettings: true }
    })

    if (!business) {
      return NextResponse.json({ message: 'Business not found' }, { status: 404 })
    }

    const updateData: {
      notificationEmails?: string[]
      orderNotificationsEnabled?: boolean
      bookingNotificationsEnabled?: boolean
      serviceRequestNotificationsEnabled?: boolean
      externalSyncNotificationsEnabled?: boolean
    } = {}

    if (notificationEmails !== undefined) updateData.notificationEmails = notificationEmails
    if (orderNotificationsEnabled !== undefined)
      updateData.orderNotificationsEnabled = orderNotificationsEnabled
    if (bookingNotificationsEnabled !== undefined)
      updateData.bookingNotificationsEnabled = bookingNotificationsEnabled
    if (serviceRequestNotificationsEnabled !== undefined)
      updateData.serviceRequestNotificationsEnabled = serviceRequestNotificationsEnabled
    if (externalSyncNotificationsEnabled !== undefined)
      updateData.externalSyncNotificationsEnabled = externalSyncNotificationsEnabled

    let settings

    if (business.superAdminNotificationSettings) {
      settings = await prisma.superAdminNotificationSettings.update({
        where: { id: business.superAdminNotificationSettings.id },
        data: updateData
      })
    } else {
      settings = await prisma.superAdminNotificationSettings.create({
        data: {
          businessId,
          notificationEmails: updateData.notificationEmails ?? [],
          orderNotificationsEnabled: updateData.orderNotificationsEnabled ?? false,
          bookingNotificationsEnabled: updateData.bookingNotificationsEnabled ?? false,
          serviceRequestNotificationsEnabled:
            updateData.serviceRequestNotificationsEnabled ?? false,
          externalSyncNotificationsEnabled:
            updateData.externalSyncNotificationsEnabled ?? false
        }
      })
    }

    return NextResponse.json({ settings })
  } catch (error) {
    console.error('SuperAdmin notification settings PATCH error:', error)
    return NextResponse.json(
      { message: 'Failed to update settings' },
      { status: 500 }
    )
  }
}
