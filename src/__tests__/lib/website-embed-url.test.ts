import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { buildWebsiteEmbedOrderUrl, getPublicSiteBaseUrl } from '@/lib/website-embed-url'

describe('buildWebsiteEmbedOrderUrl', () => {
  it('includes embed_waveorder=1 and path slug', () => {
    const u = buildWebsiteEmbedOrderUrl('https://waveorder.app', 'my-store', {})
    expect(u).toBe('https://waveorder.app/my-store?embed_waveorder=1')
  })

  it('trims base URL trailing slash', () => {
    const u = buildWebsiteEmbedOrderUrl('https://example.com/', 'slug', {})
    expect(u).toBe('https://example.com/slug?embed_waveorder=1')
  })

  it('adds utm params when provided', () => {
    const u = buildWebsiteEmbedOrderUrl('https://waveorder.app', 's', {
      source: 'site',
      medium: 'embed',
      campaign: 'summer',
    })
    expect(u).toContain('embed_waveorder=1')
    expect(u).toContain('utm_source=site')
    expect(u).toContain('utm_medium=embed')
    expect(u).toContain('utm_campaign=summer')
  })

  it('ignores blank utm fields', () => {
    const u = buildWebsiteEmbedOrderUrl('https://waveorder.app', 's', {
      source: '   ',
      medium: '',
    })
    expect(u).toBe('https://waveorder.app/s?embed_waveorder=1')
  })

  it('encodes slug', () => {
    const u = buildWebsiteEmbedOrderUrl('https://waveorder.app', 'my store', {})
    expect(u).toContain('my%20store')
  })
})

describe('getPublicSiteBaseUrl', () => {
  const prev = process.env.NEXT_PUBLIC_BASE_URL

  beforeEach(() => {
    delete process.env.NEXT_PUBLIC_BASE_URL
  })

  afterEach(() => {
    if (prev === undefined) delete process.env.NEXT_PUBLIC_BASE_URL
    else process.env.NEXT_PUBLIC_BASE_URL = prev
  })

  it('returns default when env unset', () => {
    expect(getPublicSiteBaseUrl()).toBe('https://waveorder.app')
  })

  it('strips trailing slash from env', () => {
    process.env.NEXT_PUBLIC_BASE_URL = 'https://custom.example/'
    expect(getPublicSiteBaseUrl()).toBe('https://custom.example')
  })
})
