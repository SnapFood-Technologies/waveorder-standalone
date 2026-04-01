/** Official HolaOra embed URLs (override script URL only if Hola gives a different CDN per env). */
export const HOLAORA_EMBED_SCRIPT_DEFAULT = 'https://holaora.com/embed/chat.js'
export const HOLAORA_EMBED_IFRAME_BASE = 'https://holaora.com/embed/window'

export function getHolaoraEmbedScriptUrl(): string {
  if (typeof process !== 'undefined' && process.env?.NEXT_PUBLIC_HOLAORA_EMBED_SCRIPT_URL?.trim()) {
    return process.env.NEXT_PUBLIC_HOLAORA_EMBED_SCRIPT_URL.trim()
  }
  return HOLAORA_EMBED_SCRIPT_DEFAULT
}
