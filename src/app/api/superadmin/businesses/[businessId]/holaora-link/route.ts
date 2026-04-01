import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { z } from 'zod'
import type { Prisma } from '@prisma/client'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import {
  HOLA_ENTITLEMENT_SOURCE_MANUAL,
  HOLA_ENTITLEMENT_SOURCE_STRIPE,
} from '@/lib/holaora-entitlement-source'
import { encryptHolaPortalPassword, isHolaPortalCryptoConfigured } from '@/lib/holaora-portal-crypto'

const patchSchema = z.object({
  holaoraAccountId: z.string().min(1).max(256).nullable().optional(),
  holaoraEntitled: z.boolean().optional(),
  holaoraEntitlementSource: z.enum([HOLA_ENTITLEMENT_SOURCE_STRIPE, HOLA_ENTITLEMENT_SOURCE_MANUAL]).optional(),
  holaoraProvisionBundleType: z.enum(['FREE', 'PAID']).nullable().optional(),
  /** When false, clears stored portal email + encrypted password. */
  saveHolaPortalCredentials: z.boolean().optional(),
  holaPortalEmail: z.union([z.string().max(320), z.literal('')]).optional(),
  /** New password; omit or empty to keep existing encrypted password when updating. */
  holaPortalPassword: z.union([z.string().max(500), z.literal('')]).optional(),
})

/**
 * SuperAdmin: link / update Hola fields for a business (manual id, entitlement source, bundle tier, optional portal login).
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
      select: { id: true, holaoraPortalPasswordEnc: true },
    })
    if (!exists) {
      return NextResponse.json({ message: 'Business not found' }, { status: 404 })
    }

    const p = parsed.data
    const data: Prisma.BusinessUpdateInput = {}

    if (p.holaoraAccountId !== undefined) data.holaoraAccountId = p.holaoraAccountId
    if (p.holaoraEntitled !== undefined) data.holaoraEntitled = p.holaoraEntitled
    if (p.holaoraEntitlementSource !== undefined) data.holaoraEntitlementSource = p.holaoraEntitlementSource
    if (p.holaoraProvisionBundleType !== undefined) data.holaoraProvisionBundleType = p.holaoraProvisionBundleType

    if (p.saveHolaPortalCredentials === false) {
      data.holaoraPortalEmail = null
      data.holaoraPortalPasswordEnc = null
    } else if (p.saveHolaPortalCredentials === true) {
      const pwd = p.holaPortalPassword
      const hasNewPassword = pwd !== undefined && pwd !== ''
      if (!hasNewPassword && !exists.holaoraPortalPasswordEnc) {
        return NextResponse.json(
          {
            message:
              'Enter the HolaOra portal password to save, or turn off “Save portal login on file”.',
          },
          { status: 400 }
        )
      }
      const email = (p.holaPortalEmail ?? '').trim()
      data.holaoraPortalEmail = email || null

      if (hasNewPassword) {
        if (!isHolaPortalCryptoConfigured()) {
          return NextResponse.json(
            {
              message:
                'Cannot save password: set HOLAORA_PORTAL_CREDENTIALS_ENCRYPTION_KEY on the server (see .env.example).',
            },
            { status: 503 }
          )
        }
        try {
          data.holaoraPortalPasswordEnc = encryptHolaPortalPassword(pwd as string)
        } catch (e) {
          console.error('encrypt portal password', e)
          return NextResponse.json({ message: 'Could not encrypt password' }, { status: 500 })
        }
      }
    }

    if (Object.keys(data).length === 0) {
      return NextResponse.json({ message: 'No fields to update' }, { status: 400 })
    }

    const updated = await prisma.business.update({
      where: { id: businessId },
      data,
      select: {
        id: true,
        name: true,
        slug: true,
        holaoraAccountId: true,
        holaoraEntitled: true,
        holaoraEntitlementSource: true,
        holaoraProvisionBundleType: true,
        holaoraStorefrontEmbedEnabled: true,
        holaoraEmbedKind: true,
        holaoraProvisioningStatus: true,
        holaoraPortalEmail: true,
        holaoraPortalPasswordEnc: true,
      },
    })

    const { holaoraPortalPasswordEnc: enc, ...rest } = updated

    return NextResponse.json({
      success: true,
      business: {
        ...rest,
        holaPortalPasswordSaved: Boolean(enc),
      },
    })
  } catch (error) {
    console.error('PATCH holaora-link:', error)
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 })
  }
}
