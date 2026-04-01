import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { z } from 'zod'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import {
  HOLA_ENTITLEMENT_SOURCE_MANUAL,
  HOLA_ENTITLEMENT_SOURCE_STRIPE,
} from '@/lib/holaora-entitlement-source'
const patchSchema = z.object({
  holaoraAccountId: z.string().min(1).max(256).nullable().optional(),
  holaoraEntitled: z.boolean().optional(),
  holaoraEntitlementSource: z.enum([HOLA_ENTITLEMENT_SOURCE_STRIPE, HOLA_ENTITLEMENT_SOURCE_MANUAL]).optional(),
  holaoraProvisionBundleType: z.enum(['FREE', 'PAID']).nullable().optional(),
})

/**
 * SuperAdmin: link / update Hola fields for a business (manual id, entitlement source, bundle tier).
 */
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
    const parsed = patchSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { message: 'Invalid body', issues: parsed.error.flatten() },
        { status: 400 }
      )
    }

    const exists = await prisma.business.findUnique({
      where: { id: businessId },
      select: { id: true },
    })
    if (!exists) {
      return NextResponse.json({ message: 'Business not found' }, { status: 404 })
    }

    const data: Record<string, unknown> = {}
    const p = parsed.data
    if (p.holaoraAccountId !== undefined) data.holaoraAccountId = p.holaoraAccountId
    if (p.holaoraEntitled !== undefined) data.holaoraEntitled = p.holaoraEntitled
    if (p.holaoraEntitlementSource !== undefined)
      data.holaoraEntitlementSource = p.holaoraEntitlementSource
    if (p.holaoraProvisionBundleType !== undefined)
      data.holaoraProvisionBundleType = p.holaoraProvisionBundleType

    if (Object.keys(data).length === 0) {
      return NextResponse.json({ message: 'No fields to update' }, { status: 400 })
    }

    const updated = await prisma.business.update({
      where: { id: businessId },
      data: data as any,
      select: {
        id: true,
        name: true,
        slug: true,
        holaoraAccountId: true,
        holaoraEntitled: true,
        holaoraEntitlementSource: true,
        holaoraProvisionBundleType: true,
        holaoraStorefrontEmbedEnabled: true,
        holaoraProvisioningStatus: true,
      },
    })

    return NextResponse.json({ success: true, business: updated })
  } catch (error) {
    console.error('PATCH holaora-link:', error)
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 })
  }
}
