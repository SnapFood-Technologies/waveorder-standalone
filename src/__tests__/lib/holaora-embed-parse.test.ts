import { describe, expect, it } from 'vitest'
import {
  parseHolaEmbedPaste,
  parseHolaIframeSnippet,
  parseHolaScriptSnippet,
} from '@/lib/holaora-embed-parse'

const WS = '56e25486-18e7-49ae-8db0-10725f151a6f'

describe('parseHolaScriptSnippet', () => {
  it('extracts workspace and attributes from a typical Hola script tag', () => {
    const html = `<script src="https://holaora.com/embed/chat.js"
  data-workspace="${WS}"
  data-primary-color="#FF6B35"
  data-position="bottom-right"
  data-title="HolaOra%20Assistant"
  data-greeting="Hi!%20How%20can%20I%20help%20you%20today%3F">
</script>`
    const p = parseHolaScriptSnippet(html)
    expect(p.workspaceId).toBe(WS)
    expect(p.kind).toBe('SCRIPT')
    expect(p.primaryColor).toBe('#FF6B35')
    expect(p.position).toBe('bottom-right')
    expect(p.title).toBe('HolaOra Assistant')
    expect(p.greeting).toBe('Hi! How can I help you today?')
  })

  it('returns empty when no workspace', () => {
    const p = parseHolaScriptSnippet('<script src="https://holaora.com/embed/chat.js"></script>')
    expect(p.workspaceId).toBeNull()
    expect(p.kind).toBeNull()
  })

  it('rejects invalid workspace string', () => {
    const p = parseHolaScriptSnippet(
      '<script src="https://holaora.com/embed/chat.js" data-workspace="not-a-uuid"></script>'
    )
    expect(p.workspaceId).toBeNull()
  })
})

describe('parseHolaIframeSnippet', () => {
  it('extracts workspace from iframe src query', () => {
    const html = `<iframe
  src="https://holaora.com/embed/window?workspace=${encodeURIComponent(WS)}"
  width="400"
  height="600"
  style="border: none;">
</iframe>`
    const p = parseHolaIframeSnippet(html)
    expect(p.workspaceId).toBe(WS)
    expect(p.kind).toBe('IFRAME')
    expect(p.iframeWidth).toBe(400)
    expect(p.iframeHeight).toBe(600)
  })

  it('falls back to UUID in HTML body', () => {
    const p = parseHolaIframeSnippet(`<div>${WS}</div>`)
    expect(p.workspaceId).toBe(WS)
    expect(p.kind).toBe('IFRAME')
  })

  it('returns null when no UUID found', () => {
    const p = parseHolaIframeSnippet('<iframe src="https://example.com/"></iframe>')
    expect(p.workspaceId).toBeNull()
    expect(p.kind).toBeNull()
  })

  it('parses bare embed/window URL', () => {
    const u = `https://holaora.com/embed/window?workspace=${encodeURIComponent(WS)}`
    const p = parseHolaIframeSnippet(u)
    expect(p.workspaceId).toBe(WS)
    expect(p.kind).toBe('IFRAME')
  })
})

describe('parseHolaEmbedPaste', () => {
  it('detects script snippet and fills title/greeting', () => {
    const html = `<script src="https://holaora.com/embed/chat.js"
  data-workspace="${WS}"
  data-primary-color="#0d9488"
  data-title="WaveOrder%20Help"
  data-greeting="Hi!">
</script>`
    const p = parseHolaEmbedPaste(html)
    expect(p.kind).toBe('SCRIPT')
    expect(p.workspaceId).toBe(WS)
    expect(p.title).toBe('WaveOrder Help')
    expect(p.greeting).toBe('Hi!')
  })

  it('detects iframe when pasted alone', () => {
    const html = `<iframe src="https://holaora.com/embed/window?workspace=${encodeURIComponent(WS)}" width="500" height="700"></iframe>`
    const p = parseHolaEmbedPaste(html)
    expect(p.kind).toBe('IFRAME')
    expect(p.iframeWidth).toBe(500)
    expect(p.iframeHeight).toBe(700)
  })
})
