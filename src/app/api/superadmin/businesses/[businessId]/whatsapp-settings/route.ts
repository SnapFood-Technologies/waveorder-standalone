// app/api/superadmin/businesses/[businessId]/whatsapp-settings/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { logSystemEvent } from '@/lib/systemLog'

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

    const hasDirect = typeof data.whatsappDirectNotifications === 'boolean'
    const hasMix = typeof data.orderWhatsAppMixEnabled === 'boolean'

    if (!hasDirect && !hasMix) {
      return NextResponse.json(
        { message: 'Provide whatsappDirectNotifications and/or orderWhatsAppMixEnabled' },
        { status: 400 }
      )
    }

    const existingBusiness = await prisma.business.findUnique({
      where: { id: businessId },
      select: {
        id: true,
        name: true,
        slug: true,
        whatsappDirectNotifications: true,
        orderWhatsAppMixEnabled: true,
      },
    })

    if (!existingBusiness) {
      return NextResponse.json({ message: 'Business not found' }, { status: 404 })
    }

    const nextDirect = hasDirect
      ? data.whatsappDirectNotifications
      : existingBusiness.whatsappDirectNotifications

    let nextMix = hasMix ? data.orderWhatsAppMixEnabled : existingBusiness.orderWhatsAppMixEnabled
    if (!nextDirect) {
      nextMix = false
    }
    if (nextMix && !nextDirect) {
      return NextResponse.json(
        { message: 'Mix requires direct new-order WhatsApp delivery to be enabled first' },
        { status: 400 }
      )
    }

    const updatedBusiness = await prisma.business.update({
      where: { id: businessId },
      data: {
        ...(hasDirect ? { whatsappDirectNotifications: data.whatsappDirectNotifications } : {}),
        ...(hasMix || hasDirect
          ? {
              orderWhatsAppMixEnabled: nextMix,
            }
          : {}),
      },
      select: {
        id: true,
        name: true,
        whatsappDirectNotifications: true,
        orderWhatsAppMixEnabled: true,
      },
    })

    const host = request.headers.get('host') || request.headers.get('x-forwarded-host')
    const protocol = request.headers.get('x-forwarded-proto') || (process.env.NODE_ENV === 'production' ? 'https' : 'http')
    const actualUrl = host ? `${protocol}://${host}${new URL(request.url).pathname}` : request.url

    await logSystemEvent({
      logType: 'admin_action',
      severity: 'info',
      endpoint: `/api/superadmin/businesses/${businessId}/whatsapp-settings`,
      method: 'PATCH',
      url: actualUrl,
      businessId,
      errorMessage: `WhatsApp settings updated for ${existingBusiness.name} by ${session.user.email}`,
      metadata: {
        action: 'whatsapp_settings_update',
        businessName: existingBusiness.name,
        businessSlug: existingBusiness.slug,
        updatedBy: session.user.email,
        whatsappDirectNotifications: updatedBusiness.whatsappDirectNotifications,
        orderWhatsAppMixEnabled: updatedBusiness.orderWhatsAppMixEnabled,
      },
    })

    return NextResponse.json({
      success: true,
      business: updatedBusiness,
    })
  } catch (error) {
    console.error('Error updating WhatsApp settings:', error)
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 })
  }
}
