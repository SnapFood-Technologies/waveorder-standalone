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
  kind: 'SCRIPT' | 'IFRAME' | null
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
    kind: null,
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

  return {
    workspaceId,
    primaryColor,
    position,
    title: decodeAttr(titleRaw),
    greeting: decodeAttr(greetingRaw),
    kind: workspaceId ? 'SCRIPT' : null,
  }
}

/** Extract workspace from Hola iframe snippet. */
export function parseHolaIframeSnippet(html: string): ParsedHolaSnippet {
  const empty: ParsedHolaSnippet = {
    workspaceId: null,
    primaryColor: null,
    position: null,
    title: null,
    greeting: null,
    kind: null,
  }
  if (!html?.trim()) return empty

  const srcMatch = html.match(/src\s*=\s*["']([^"']+)["']/i)
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
    const m = html.match(UUID_RE)
    workspaceId = m ? m[0] : null
  }

  return {
    workspaceId,
    primaryColor: null,
    position: null,
    title: null,
    greeting: null,
    kind: workspaceId ? 'IFRAME' : null,
  }
}
