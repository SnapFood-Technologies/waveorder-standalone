import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { z } from 'zod'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { holaOraConfigSchema, normalizeIntegrationConfig } from '@/lib/integration-config'
import { encryptHolaPortalPassword, isHolaPortalCryptoConfigured } from '@/lib/holaora-portal-crypto'

const uuidLike = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

const patchBody = z
  .object({
    embedEnabled: z.boolean(),
    embedKind: z.enum(['SCRIPT', 'IFRAME']),
    workspaceId: z.union([z.string().max(128), z.literal('')]).optional(),
    primaryColor: z.union([z.string().max(64), z.literal('')]).optional(),
    position: z.union([z.string().max(64), z.literal('')]).optional(),
    title: z.union([z.string().max(200), z.literal('')]).optional(),
    greeting: z.union([z.string().max(500), z.literal('')]).optional(),
    iframeWidth: z.union([z.number().int().min(200).max(1200), z.null()]).optional(),
    iframeHeight: z.union([z.number().int().min(200).max(1200), z.null()]).optional(),
    savePortalLogin: z.boolean(),
    portalEmail: z.union([z.string().max(320), z.literal('')]).optional(),
    portalPassword: z.union([z.string().max(500), z.literal('')]).optional(),
  })
  .strict()

function stripPortalSecrets(site: Record<string, unknown> | undefined) {
  if (!site || typeof site !== 'object') return {}
  const { portalPasswordEnc: _, ...rest } = site as Record<string, unknown>
  return rest
}

/**
 * GET — SuperAdmin: WaveOrder marketing site Hola settings (no decrypted password).
 */
export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session || session.user.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
    }

    const integration = await prisma.integration.findFirst({ where: { kind: 'HOLAORA' } })
    if (!integration?.config) {
      return NextResponse.json({
        configured: false,
        waveorderMarketingSite: {
          embedEnabled: false,
          embedKind: 'SCRIPT' as const,
          workspaceId: null,
          primaryColor: null,
          position: null,
          title: null,
          greeting: null,
          iframeWidth: null,
          iframeHeight: null,
          portalEmail: null,
          portalPasswordSaved: false,
        },
      })
    }

    const parsed = holaOraConfigSchema.safeParse(integration.config)
    if (!parsed.success) {
      return NextResponse.json({ message: 'Invalid Hola integration config' }, { status: 500 })
    }

    const site = parsed.data.waveorderMarketingSite
    const enc = site?.portalPasswordEnc
    const safe = site
      ? {
          ...stripPortalSecrets(site as Record<string, unknown>),
          portalPasswordSaved: Boolean(enc),
        }
      : {
          embedEnabled: false,
          embedKind: 'SCRIPT' as const,
          workspaceId: null as string | null,
          primaryColor: null as string | null,
          position: null as string | null,
          title: null as string | null,
          greeting: null as string | null,
          iframeWidth: null as number | null,
          iframeHeight: null as number | null,
          portalEmail: null as string | null,
          portalPasswordSaved: false,
        }
    return NextResponse.json({
      configured: true,
      waveorderMarketingSite: safe,
    })
  } catch (e) {
    console.error('GET waveorder-website', e)
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 })
  }
}

/**
 * PATCH — SuperAdmin: update waveorderMarketingSite inside Integration.config.
 */
export async function PATCH(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || session.user.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
    }

    const integration = await prisma.integration.findFirst({ where: { kind: 'HOLAORA' } })
    if (!integration) {
      return NextResponse.json({ message: 'No HolaOra integration row' }, { status: 404 })
    }

    const body = await request.json()
    const parsed = patchBody.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ message: 'Invalid body', issues: parsed.error.flatten() }, { status: 400 })
    }

    const p = parsed.data
    const ws = (p.workspaceId ?? '').trim()
    if (p.embedEnabled) {
      if (!ws) {
        return NextResponse.json(
          { message: 'Set a Hola workspace UUID when the homepage chat is enabled.' },
          { status: 400 }
        )
      }
      if (!uuidLike.test(ws)) {
        return NextResponse.json({ message: 'Workspace ID must be a UUID from HolaOra embed code.' }, { status: 400 })
      }
    }

    const currentParsed = holaOraConfigSchema.safeParse(integration.config)
    if (!currentParsed.success) {
      return NextResponse.json(
        { message: 'Fix Hola integration config in All integrations before editing WaveOrder website.' },
        { status: 400 }
      )
    }

    const prev = currentParsed.data.waveorderMarketingSite ?? {}
    let portalEmail: string | null = prev.portalEmail ?? null
    let portalPasswordEnc: string | null = prev.portalPasswordEnc ?? null

    if (p.savePortalLogin === false) {
      portalEmail = null
      portalPasswordEnc = null
    } else {
      portalEmail = (p.portalEmail ?? '').trim() || null
      const pwd = p.portalPassword
      const hasNew = pwd !== undefined && pwd !== ''
      if (hasNew) {
        if (!isHolaPortalCryptoConfigured()) {
          return NextResponse.json(
            {
              message:
                'Set HOLAORA_PORTAL_CREDENTIALS_ENCRYPTION_KEY on the server to save passwords.',
            },
            { status: 503 }
          )
        }
        portalPasswordEnc = encryptHolaPortalPassword(pwd as string)
      }
    }

    const nextSite = {
      embedEnabled: p.embedEnabled,
      embedKind: p.embedKind,
      workspaceId: ws || null,
      primaryColor: (p.primaryColor ?? '').trim() || null,
      position: (p.position ?? '').trim() || null,
      title: (p.title ?? '').trim() || null,
      greeting: (p.greeting ?? '').trim() || null,
      iframeWidth: p.iframeWidth ?? null,
      iframeHeight: p.iframeHeight ?? null,
      portalEmail,
      portalPasswordEnc,
    }

    const mergedConfig = {
      ...currentParsed.data,
      waveorderMarketingSite: nextSite,
    }

    const norm = normalizeIntegrationConfig('HOLAORA', mergedConfig)
    if (!norm.ok) {
      return NextResponse.json({ message: norm.error }, { status: 400 })
    }

    await prisma.integration.update({
      where: { id: integration.id },
      data: { config: norm.value },
    })

    return NextResponse.json({
      success: true,
      waveorderMarketingSite: {
        ...stripPortalSecrets(nextSite as Record<string, unknown>),
        portalPasswordSaved: Boolean(nextSite.portalPasswordEnc),
      },
    })
  } catch (e) {
    console.error('PATCH waveorder-website', e)
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 })
  }
}
