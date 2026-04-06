/**
 * Parse HolaOra dashboard snippets so merchants can paste full script or iframe (like Meta Pixel ID extraction).
 */

const UUID_RE = /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i

export type ParsedHolaSnippet = {
  workspaceId: string | null
  primaryColor: string | null
  position: string | null
  title: string | null
  greeting: string | null
  /** Script: data-launcher-icon (e.g. heart) */
  launcherIcon: string | null
  suggestionsEnabled?: boolean | null
  suggestions?: string[] | null
  kind: 'SCRIPT' | 'IFRAME' | null
  /** Set when kind is IFRAME and the snippet had width/height attributes */
  iframeWidth?: number | null
  iframeHeight?: number | null
}

function decodeAttr(raw: string | null | undefined): string | null {
  if (raw == null || raw === '') return null
  try {
    return decodeURIComponent(raw.replace(/\+/g, ' '))
  } catch {
    return raw
  }
}

/** Extract from Hola "Script tag (recommended)" HTML. */
export function parseHolaScriptSnippet(html: string): ParsedHolaSnippet {
  const empty: ParsedHolaSnippet = {
    workspaceId: null,
    primaryColor: null,
    position: null,
    title: null,
    greeting: null,
    launcherIcon: null,
    suggestionsEnabled: null,
    suggestions: null,
    kind: null,
    iframeWidth: null,
    iframeHeight: null,
  }
  if (!html?.trim()) return empty

  const ws =
    html.match(/data-workspace\s*=\s*["']([^"']+)["']/i)?.[1]?.trim() ??
    html.match(/data-workspace\s*=\s*([^\s/>]+)/i)?.[1]?.trim() ??
    null
  const workspaceId = ws && UUID_RE.test(ws) ? ws : null

  const primaryColor = html.match(/data-primary-color\s*=\s*["']([^"']+)["']/i)?.[1] ?? null
  const position = html.match(/data-position\s*=\s*["']([^"']+)["']/i)?.[1] ?? null
  const titleRaw = html.match(/data-title\s*=\s*["']([^"']+)["']/i)?.[1] ?? null
  const greetingRaw = html.match(/data-greeting\s*=\s*["']([^"']+)["']/i)?.[1] ?? null
  const launcherIconRaw =
    html.match(/data-launcher-icon\s*=\s*["']([^"']+)["']/i)?.[1] ??
    html.match(/data-launcher-icon\s*=\s*([^\s/>]+)/i)?.[1] ??
    null
  const sugEnRaw = html.match(/data-suggestions-enabled\s*=\s*["']([^"']+)["']/i)?.[1]?.trim().toLowerCase()
  const suggestionsEnabled =
    sugEnRaw === 'true' || sugEnRaw === '1' ? true : sugEnRaw === 'false' || sugEnRaw === '0' ? false : null
  const suggestionsAttr = html.match(/data-suggestions\s*=\s*["']([^"']+)["']/i)?.[1] ?? null
  let suggestions: string[] | null = null
  if (suggestionsAttr) {
    try {
      const decoded = decodeURIComponent(suggestionsAttr.replace(/\+/g, ' '))
      const arr = JSON.parse(decoded) as unknown
      if (Array.isArray(arr) && arr.every((x) => typeof x === 'string')) {
        suggestions = arr as string[]
      }
    } catch {
      /* ignore */
    }
  }

  return {
    workspaceId,
    primaryColor,
    position,
    title: decodeAttr(titleRaw),
    greeting: decodeAttr(greetingRaw),
    launcherIcon: launcherIconRaw ? decodeAttr(launcherIconRaw) : null,
    suggestionsEnabled,
    suggestions,
    kind: workspaceId ? 'SCRIPT' : null,
    iframeWidth: null,
    iframeHeight: null,
  }
}

/** Extract workspace from Hola iframe snippet (full tag, or bare embed/window URL). */
export function parseHolaIframeSnippet(html: string): ParsedHolaSnippet {
  const empty: ParsedHolaSnippet = {
    workspaceId: null,
    primaryColor: null,
    position: null,
    title: null,
    greeting: null,
    launcherIcon: null,
    suggestionsEnabled: null,
    suggestions: null,
    kind: null,
    iframeWidth: null,
    iframeHeight: null,
  }
  if (!html?.trim()) return empty

  let blob = html.trim()
  // Bare Hola window URL pasted without <iframe>
  if (/^https?:\/\//i.test(blob) && /holaora\.com\/embed\/window/i.test(blob)) {
    blob = `<iframe src="${blob.replace(/"/g, '&quot;')}"></iframe>`
  }

  const srcMatch = blob.match(/src\s*=\s*["']([^"']+)["']/i)
  const src = srcMatch?.[1] ?? ''
  const q = src.match(/[?&]workspace=([^&]+)/i)
  let workspaceId: string | null = null
  if (q?.[1]) {
    try {
      workspaceId = decodeURIComponent(q[1])
    } catch {
      workspaceId = q[1]
    }
  }
  if (!workspaceId || !UUID_RE.test(workspaceId)) {
    const m = blob.match(UUID_RE)
    workspaceId = m ? m[0] : null
  }

  const wAttr = blob.match(/\bwidth\s*=\s*["']?(\d+)/i)?.[1]
  const hAttr = blob.match(/\bheight\s*=\s*["']?(\d+)/i)?.[1]
  const iw = wAttr ? parseInt(wAttr, 10) : NaN
  const ih = hAttr ? parseInt(hAttr, 10) : NaN

  return {
    workspaceId,
    primaryColor: null,
    position: null,
    title: null,
    greeting: null,
    launcherIcon: null,
    suggestionsEnabled: null,
    suggestions: null,
    kind: workspaceId ? 'IFRAME' : null,
    iframeWidth: Number.isFinite(iw) ? iw : null,
    iframeHeight: Number.isFinite(ih) ? ih : null,
  }
}

/**
 * Paste anything Hola gives you: script tag, iframe tag, or bare embed/window URL.
 * Prefers script when it contains a valid workspace (more fields).
 */
export function parseHolaEmbedPaste(raw: string): ParsedHolaSnippet {
  const empty: ParsedHolaSnippet = {
    workspaceId: null,
    primaryColor: null,
    position: null,
    title: null,
    greeting: null,
    launcherIcon: null,
    suggestionsEnabled: null,
    suggestions: null,
    kind: null,
    iframeWidth: null,
    iframeHeight: null,
  }
  const html = raw?.trim() ?? ''
  if (!html) return empty

  const looksScript =
    /<script/i.test(html) &&
    (/holaora\.com\/embed\/chat\.js/i.test(html) || /data-workspace/i.test(html))
  if (looksScript) {
    const s = parseHolaScriptSnippet(html)
    if (s.workspaceId) return s
  }

  const looksIframe = /<iframe/i.test(html) || /holaora\.com\/embed\/window/i.test(html)
  if (looksIframe) {
    const i = parseHolaIframeSnippet(html)
    if (i.workspaceId) return i
  }

  const s2 = parseHolaScriptSnippet(html)
  if (s2.workspaceId) return s2

  return parseHolaIframeSnippet(html)
}
