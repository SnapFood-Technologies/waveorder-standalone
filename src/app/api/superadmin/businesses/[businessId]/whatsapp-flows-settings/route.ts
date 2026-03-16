// SuperAdmin: Toggle WaveOrder Flows (WhatsAppSettings.isEnabled) for a business

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { logSystemEvent } from '@/lib/systemLog'
import { ensureDefaultFlows } from '@/lib/whatsapp-default-flows'

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
    const data = await request.json()

    if (typeof data.isEnabled !== 'boolean') {
      return NextResponse.json(
        { message: 'Invalid isEnabled value' },
        { status: 400 }
      )
    }

    const business = await prisma.business.findUnique({
      where: { id: businessId },
      select: { id: true, name: true, slug: true, subscriptionPlan: true, whatsappNumber: true }
    })

    if (!business) {
      return NextResponse.json({ message: 'Business not found' }, { status: 404 })
    }

    if (business.subscriptionPlan !== 'PRO' && business.subscriptionPlan !== 'BUSINESS') {
      return NextResponse.json(
        { message: 'WaveOrder Flows requires Pro or Business plan' },
        { status: 400 }
      )
    }

    const existing = await prisma.whatsAppSettings.findUnique({
      where: { businessId }
    })

    const settings = await prisma.whatsAppSettings.upsert({
      where: { businessId },
      create: {
        businessId,
        isEnabled: data.isEnabled,
        phoneNumber: business.whatsappNumber,
        welcomeFlowEnabled: true,
        awayFlowEnabled: true,
        businessHoursStart: '09:00',
        businessHoursEnd: '22:00',
        businessHoursTimezone: 'UTC',
        businessDays: [1, 2, 3, 4, 5]
      },
      update: { isEnabled: data.isEnabled }
    })

    if (data.isEnabled) {
      try {
        await ensureDefaultFlows(businessId)
      } catch (err) {
        console.error('[superadmin] ensureDefaultFlows:', err)
      }
    }

    const host = request.headers.get('host') || request.headers.get('x-forwarded-host')
    const protocol = request.headers.get('x-forwarded-proto') || (process.env.NODE_ENV === 'production' ? 'https' : 'http')
    const actualUrl = host ? `${protocol}://${host}${new URL(request.url).pathname}` : request.url

    await logSystemEvent({
      logType: 'admin_action',
      severity: 'info',
      endpoint: `/api/superadmin/businesses/${businessId}/whatsapp-flows-settings`,
      method: 'PATCH',
      url: actualUrl,
      businessId,
      errorMessage: `WaveOrder Flows ${data.isEnabled ? 'enabled' : 'disabled'} for ${business.name} by ${session.user.email}`,
      metadata: {
        action: 'whatsapp_flows_settings_update',
        businessName: business.name,
        businessSlug: business.slug,
        updatedBy: session.user.email,
        previousValue: existing?.isEnabled ?? false,
        newValue: data.isEnabled
      }
    })

    return NextResponse.json({
      success: true,
      settings: { isEnabled: settings.isEnabled }
    })
  } catch (error) {
    console.error('[superadmin] whatsapp-flows-settings:', error)
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    )
  }
}
