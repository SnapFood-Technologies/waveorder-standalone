'use client'

import { useEffect, useRef } from 'react'
import { HOLAORA_EMBED_IFRAME_BASE } from '@/lib/holaora-embed-constants'

export type HolaOraEmbedKind = 'SCRIPT' | 'IFRAME'

export type HolaOraEmbedProps = {
  kind: HolaOraEmbedKind
  /** Hola workspace UUID (same as data-workspace / ?workspace=). */
  workspaceId: string
  /** Usually https://holaora.com/embed/chat.js — passed from storefront API. */
  scriptSrc: string
  primaryColor?: string | null
  position?: string | null
  title?: string | null
  greeting?: string | null
  /** Script: data-suggestions-enabled */
  suggestionsEnabled?: boolean | null
  /** Script: data-suggestions — JSON array of quick-reply labels */
  suggestions?: string[] | null
  iframeWidth?: number | null
  iframeHeight?: number | null
}

/**
 * HolaOra storefront embed: official script tag (recommended) or iframe alternative.
 * @see https://holaora.com — paste from dashboard into Admin → Settings → HolaOra.
 */
export function HolaOraEmbed({
  kind,
  workspaceId,
  scriptSrc,
  primaryColor,
  position,
  title,
  greeting,
  suggestionsEnabled,
  suggestions,
  iframeWidth,
  iframeHeight,
}: HolaOraEmbedProps) {
  const injected = useRef(false)

  useEffect(() => {
    if (kind !== 'SCRIPT' || !scriptSrc || !workspaceId || injected.current) return
    injected.current = true
    const s = document.createElement('script')
    s.src = scriptSrc
    s.async = true
    s.dataset.workspace = workspaceId
    if (primaryColor) s.dataset.primaryColor = primaryColor
    if (position) s.dataset.position = position
    if (title) s.setAttribute('data-title', encodeURIComponent(title))
    if (greeting) s.setAttribute('data-greeting', encodeURIComponent(greeting))
    if (suggestionsEnabled) {
      s.setAttribute('data-suggestions-enabled', 'true')
      const list = Array.isArray(suggestions) ? suggestions : []
      s.setAttribute('data-suggestions', encodeURIComponent(JSON.stringify(list)))
    }
    document.body.appendChild(s)
    return () => {
      s.remove()
      injected.current = false
    }
  }, [kind, workspaceId, scriptSrc, primaryColor, position, title, greeting, suggestionsEnabled, suggestions])

  if (kind === 'IFRAME') {
    const w = iframeWidth ?? 400
    const h = iframeHeight ?? 600
    const src = `${HOLAORA_EMBED_IFRAME_BASE}?workspace=${encodeURIComponent(workspaceId)}`
    return (
      <div className="fixed bottom-4 right-4 z-[60] max-w-[100vw] pointer-events-auto">
        <iframe
          title="HolaOra chat"
          src={src}
          width={w}
          height={h}
          className="border-0 rounded-xl shadow-lg"
          style={{ boxShadow: '0 4px 24px rgba(0,0,0,0.1)' }}
        />
      </div>
    )
  }

  return (
    <div
      id="waveorder-holaora-embed"
      data-hola-workspace={workspaceId}
      className="pointer-events-none fixed bottom-0 right-0 z-[60] h-0 w-0 overflow-visible"
      aria-hidden
    />
  )
}
