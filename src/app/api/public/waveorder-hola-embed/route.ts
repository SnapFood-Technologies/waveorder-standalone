import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { holaOraConfigSchema } from '@/lib/integration-config'
import { getHolaoraEmbedScriptUrl } from '@/lib/holaora-embed-constants'

/**
 * Public: safe props for Hola chat on waveorder.app marketing site (no secrets).
 */
export async function GET() {
  try {
    const integration = await prisma.integration.findFirst({
      where: { kind: 'HOLAORA', isActive: true },
      select: { config: true },
    })

    if (!integration?.config) {
      return NextResponse.json({ enabled: false })
    }

    const parsed = holaOraConfigSchema.safeParse(integration.config)
    if (!parsed.success) {
      return NextResponse.json({ enabled: false })
    }

    const site = parsed.data.waveorderMarketingSite
    if (!site?.embedEnabled || !site.workspaceId?.trim()) {
      return NextResponse.json({ enabled: false })
    }

    return NextResponse.json(
      {
        enabled: true,
        kind: site.embedKind === 'IFRAME' ? 'IFRAME' : 'SCRIPT',
        workspaceId: site.workspaceId.trim(),
        scriptSrc: getHolaoraEmbedScriptUrl(),
        primaryColor: site.primaryColor ?? null,
        position: site.position ?? null,
        title: site.title ?? null,
        greeting: site.greeting ?? null,
        launcherIcon: site.launcherIcon ?? null,
        suggestionsEnabled: site.suggestionsEnabled ?? false,
        suggestions: Array.isArray(site.suggestions) ? site.suggestions : [],
        iframeWidth: site.iframeWidth ?? null,
        iframeHeight: site.iframeHeight ?? null,
      },
      {
        headers: {
          'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=120',
        },
      }
    )
  } catch (e) {
    console.error('GET waveorder-hola-embed', e)
    return NextResponse.json({ enabled: false }, { status: 200 })
  }
}
