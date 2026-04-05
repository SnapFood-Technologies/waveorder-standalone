'use client'

import { useEffect, useRef } from 'react'
import { HOLAORA_EMBED_IFRAME_BASE } from '@/lib/holaora-embed-constants'
import { cssAlignHolaLauncherWithStorefrontFab } from '@/lib/holaora-widget-storefront-css'

export type HolaOraEmbedKind = 'SCRIPT' | 'IFRAME'

const HOLA_SUPPRESS_STYLE_ID = 'waveorder-holaora-suppress-floating-style'
const HOLA_BOTTOM_ALIGN_STYLE_ID = 'waveorder-holaora-bottom-align-style'
const BODY_CLASS_SUPPRESS_HOLA = 'wo-holaora-suppress-floating'

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
  /**
   * Hide Hola’s launcher + panel (same idea as hiding AI bubble / scroll-to-top during modals).
   * Script embed: body class + CSS on #holaora-widget-container. Iframe: wrapper visibility.
   */
  suppressFloating?: boolean
  /**
   * Override Hola’s default bottom: 20px so the launcher matches storefront scroll-to-top FAB
   * (2.5rem / 6rem — Tailwind bottom-10 / bottom-24).
   */
  alignBottomWithStorefrontFab?: boolean
  /** When alignBottomWithStorefrontFab, use 6rem (elevated bar) vs 2.5rem. */
  storefrontFabElevated?: boolean
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
  suppressFloating = false,
  alignBottomWithStorefrontFab = false,
  storefrontFabElevated = false,
}: HolaOraEmbedProps) {
  const injected = useRef(false)

  // One-time rule: hide widget when body has suppress class (script injects #holaora-widget-container).
  useEffect(() => {
    if (kind !== 'SCRIPT') return
    if (document.getElementById(HOLA_SUPPRESS_STYLE_ID)) return
    const el = document.createElement('style')
    el.id = HOLA_SUPPRESS_STYLE_ID
    el.textContent = `body.${BODY_CLASS_SUPPRESS_HOLA} #holaora-widget-container { visibility: hidden !important; pointer-events: none !important; }`
    document.head.appendChild(el)
  }, [kind])

  useEffect(() => {
    if (kind !== 'SCRIPT') {
      document.body.classList.remove(BODY_CLASS_SUPPRESS_HOLA)
      return
    }
    if (!suppressFloating) {
      document.body.classList.remove(BODY_CLASS_SUPPRESS_HOLA)
      return
    }
    document.body.classList.add(BODY_CLASS_SUPPRESS_HOLA)
    return () => {
      document.body.classList.remove(BODY_CLASS_SUPPRESS_HOLA)
    }
  }, [kind, suppressFloating])

  useEffect(() => {
    if (kind !== 'SCRIPT' || !alignBottomWithStorefrontFab) {
      document.getElementById(HOLA_BOTTOM_ALIGN_STYLE_ID)?.remove()
      return
    }
    let el = document.getElementById(HOLA_BOTTOM_ALIGN_STYLE_ID) as HTMLStyleElement | null
    if (!el) {
      el = document.createElement('style')
      el.id = HOLA_BOTTOM_ALIGN_STYLE_ID
      document.head.appendChild(el)
    }
    el.textContent = cssAlignHolaLauncherWithStorefrontFab(storefrontFabElevated)
    return () => {
      document.getElementById(HOLA_BOTTOM_ALIGN_STYLE_ID)?.remove()
    }
  }, [kind, alignBottomWithStorefrontFab, storefrontFabElevated])

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
    const bottomClass = alignBottomWithStorefrontFab
      ? storefrontFabElevated
        ? 'bottom-24'
        : 'bottom-10'
      : 'bottom-4'
    return (
      <div
        className={`fixed right-4 z-[60] max-w-[100vw] pointer-events-auto ${bottomClass} ${
          suppressFloating ? 'invisible pointer-events-none' : ''
        }`}
      >
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
