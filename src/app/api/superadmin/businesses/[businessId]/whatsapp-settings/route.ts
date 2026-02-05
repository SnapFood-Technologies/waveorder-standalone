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

    // Validate input
    if (typeof data.whatsappDirectNotifications !== 'boolean') {
      return NextResponse.json(
        { message: 'Invalid whatsappDirectNotifications value' },
        { status: 400 }
      )
    }

    // Check if business exists
    const existingBusiness = await prisma.business.findUnique({
      where: { id: businessId },
      select: { id: true, name: true, slug: true, whatsappDirectNotifications: true }
    })

    if (!existingBusiness) {
      return NextResponse.json({ message: 'Business not found' }, { status: 404 })
    }

    // Update the setting
    const updatedBusiness = await prisma.business.update({
      where: { id: businessId },
      data: {
        whatsappDirectNotifications: data.whatsappDirectNotifications
      },
      select: {
        id: true,
        name: true,
        whatsappDirectNotifications: true
      }
    })

    // Construct actual URL from headers
    const host = request.headers.get('host') || request.headers.get('x-forwarded-host')
    const protocol = request.headers.get('x-forwarded-proto') || (process.env.NODE_ENV === 'production' ? 'https' : 'http')
    const actualUrl = host ? `${protocol}://${host}${new URL(request.url).pathname}` : request.url

    // Log the action
    await logSystemEvent({
      logType: 'admin_action',
      severity: 'info',
      endpoint: `/api/superadmin/businesses/${businessId}/whatsapp-settings`,
      method: 'PATCH',
      url: actualUrl,
      businessId,
      errorMessage: `WhatsApp direct notifications ${data.whatsappDirectNotifications ? 'enabled' : 'disabled'} for ${existingBusiness.name} by ${session.user.email}`,
      metadata: {
        action: 'whatsapp_settings_update',
        businessName: existingBusiness.name,
        businessSlug: existingBusiness.slug,
        updatedBy: session.user.email,
        previousValue: existingBusiness.whatsappDirectNotifications,
        newValue: data.whatsappDirectNotifications
      }
    })

    return NextResponse.json({
      success: true,
      business: updatedBusiness
    })

  } catch (error) {
    console.error('Error updating WhatsApp settings:', error)
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    )
  }
}
