import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { checkBusinessAccess } from '@/lib/api-helpers'
import { logSystemEvent, getActualRequestUrl } from '@/lib/systemLog'
import {
  mergeWebsiteEmbedSettings,
  sanitizeWebsiteEmbedSettingsForSave,
} from '@/lib/website-embed-settings'

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
        websiteEmbedEnabled: true,
        websiteEmbedSettingsJson: true,
      },
    })

    if (!business) {
      return NextResponse.json({ message: 'Business not found' }, { status: 404 })
    }

    const settings = mergeWebsiteEmbedSettings(business.websiteEmbedSettingsJson)

    return NextResponse.json({
      websiteEmbedEnabled: business.websiteEmbedEnabled ?? false,
      settings,
    })
  } catch (error) {
    console.error('GET website-embed settings:', error)
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

    const body = await request.json()
    const settings = sanitizeWebsiteEmbedSettingsForSave(body.settings)

    const business = await prisma.business.findUnique({
      where: { id: businessId },
      select: { id: true, name: true, slug: true, websiteEmbedEnabled: true },
    })

    if (!business) {
      return NextResponse.json({ message: 'Business not found' }, { status: 404 })
    }

    if (!business.websiteEmbedEnabled) {
      return NextResponse.json(
        { message: 'Website embed is not enabled for this store' },
        { status: 400 }
      )
    }

    await prisma.business.update({
      where: { id: businessId },
      data: { websiteEmbedSettingsJson: settings as object },
    })

    const email = access.session?.user?.email ?? 'unknown'

    await logSystemEvent({
      logType: 'website_embed_settings_saved',
      severity: 'info',
      endpoint: `/api/admin/stores/${businessId}/settings/website-embed`,
      method: 'PUT',
      url: getActualRequestUrl(request),
      businessId,
      slug: business.slug,
      errorMessage: `Website embed settings saved for ${business.name} by ${email}`,
      metadata: {
        action: 'website_embed_settings_save',
        businessName: business.name,
        businessSlug: business.slug,
        updatedBy: email,
      },
    })

    return NextResponse.json({ success: true, settings })
  } catch (error) {
    console.error('PUT website-embed settings:', error)
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 })
  }
}
