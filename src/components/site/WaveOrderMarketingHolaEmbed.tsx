'use client'

import { useEffect, useState } from 'react'
import { HolaOraEmbed } from '@/components/storefront/HolaOraEmbed'
import { getHolaoraEmbedScriptUrl } from '@/lib/holaora-embed-constants'

type EmbedPayload = {
  enabled: boolean
  kind?: 'SCRIPT' | 'IFRAME'
  workspaceId?: string
  scriptSrc?: string
  primaryColor?: string | null
  position?: string | null
  title?: string | null
  greeting?: string | null
  launcherIcon?: string | null
  suggestionsEnabled?: boolean
  suggestions?: string[]
  iframeWidth?: number | null
  iframeHeight?: number | null
}

/**
 * HolaOra chat on waveorder.app marketing homepage — config from SuperAdmin → HolaOra → WaveOrder website.
 */
export function WaveOrderMarketingHolaEmbed() {
  const [data, setData] = useState<EmbedPayload | null>(null)

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const res = await fetch('/api/public/waveorder-hola-embed')
        const json = (await res.json()) as EmbedPayload
        if (!cancelled) setData(json)
      } catch {
        if (!cancelled) setData({ enabled: false })
      }
    })()
    return () => {
      cancelled = true
    }
  }, [])

  if (!data?.enabled || !data.workspaceId) return null

  return (
    <HolaOraEmbed
      kind={data.kind === 'IFRAME' ? 'IFRAME' : 'SCRIPT'}
      workspaceId={data.workspaceId}
      scriptSrc={data.scriptSrc || getHolaoraEmbedScriptUrl()}
      primaryColor={data.primaryColor}
      position={data.position}
      title={data.title}
      greeting={data.greeting}
      launcherIcon={data.launcherIcon}
      suggestionsEnabled={data.suggestionsEnabled}
      suggestions={data.suggestions}
      iframeWidth={data.iframeWidth}
      iframeHeight={data.iframeHeight}
    />
  )
}
