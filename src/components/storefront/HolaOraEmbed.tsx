'use client'

import { useEffect, useRef } from 'react'

type HolaOraEmbedProps = {
  accountId: string
  /** When set, loads this script once (partner-provided embed loader URL). */
  scriptUrl?: string
}

/**
 * Mounts HolaOra storefront widget when configured. Without NEXT_PUBLIC_HOLAORA_EMBED_SCRIPT_URL,
 * renders an inert anchor for future partner scripts that key off data attributes.
 */
export function HolaOraEmbed({ accountId, scriptUrl }: HolaOraEmbedProps) {
  const injected = useRef(false)

  useEffect(() => {
    if (!scriptUrl || injected.current) return
    injected.current = true
    const s = document.createElement('script')
    s.src = scriptUrl
    s.async = true
    s.dataset.holaoraAccount = accountId
    document.body.appendChild(s)
    return () => {
      s.remove()
      injected.current = false
    }
  }, [accountId, scriptUrl])

  return (
    <div
      id="waveorder-holaora-embed"
      data-holaora-account-id={accountId}
      className="pointer-events-none fixed bottom-0 right-0 z-[60] h-0 w-0 overflow-visible"
      aria-hidden
    />
  )
}
