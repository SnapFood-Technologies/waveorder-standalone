// api/superadmin/system/notifications/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

// GET - List businesses with SuperAdmin notification settings
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || session.user.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search') || ''
    const filter = searchParams.get('filter') || 'all' // all | enabled | disabled

    const where: any = {
      isActive: true,
      NOT: { testMode: true }
    }

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { slug: { contains: search, mode: 'insensitive' } }
      ]
    }

    if (filter === 'enabled') {
      where.superAdminNotificationSettings = {
        is: {
          OR: [
            { orderNotificationsEnabled: true },
            { bookingNotificationsEnabled: true },
            { serviceRequestNotificationsEnabled: true },
            { externalSyncNotificationsEnabled: true }
          ]
        }
      }
    }

    const businesses = await prisma.business.findMany({
      where,
      orderBy: { name: 'asc' },
      select: {
        id: true,
        name: true,
        slug: true,
        logo: true,
        businessType: true,
        superAdminNotificationSettings: {
          select: {
            id: true,
            notificationEmails: true,
            orderNotificationsEnabled: true,
            bookingNotificationsEnabled: true,
            serviceRequestNotificationsEnabled: true,
            externalSyncNotificationsEnabled: true
          }
        }
      }
    })

    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://waveorder.app'

    const items = businesses.map((b) => {
      const settings = b.superAdminNotificationSettings
      const hasAnyEnabled =
        settings?.orderNotificationsEnabled ||
        settings?.bookingNotificationsEnabled ||
        settings?.serviceRequestNotificationsEnabled ||
        settings?.externalSyncNotificationsEnabled
      const hasEmails = (settings?.notificationEmails?.length ?? 0) > 0

      return {
        id: b.id,
        name: b.name,
        slug: b.slug,
        logo: b.logo,
        businessType: b.businessType,
        storefrontUrl: `${baseUrl}/${b.slug}`,
        superAdminUrl: `${baseUrl}/superadmin/businesses/${b.id}`,
        settings: settings
          ? {
              id: settings.id,
              notificationEmails: settings.notificationEmails,
              orderNotificationsEnabled: settings.orderNotificationsEnabled,
              bookingNotificationsEnabled: settings.bookingNotificationsEnabled,
              serviceRequestNotificationsEnabled: settings.serviceRequestNotificationsEnabled,
              externalSyncNotificationsEnabled: settings.externalSyncNotificationsEnabled
            }
          : null,
        isConfigured: hasAnyEnabled && hasEmails
      }
    })

    return NextResponse.json({ businesses: items })
  } catch (error) {
    console.error('SuperAdmin notifications list error:', error)
    return NextResponse.json(
      { message: 'Failed to fetch notification settings' },
      { status: 500 }
    )
  }
}
