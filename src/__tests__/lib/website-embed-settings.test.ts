import { describe, it, expect } from 'vitest'
import { mergeWebsiteEmbedSettings, DEFAULT_WEBSITE_EMBED_SETTINGS } from '@/lib/website-embed-settings'

describe('mergeWebsiteEmbedSettings', () => {
  it('returns defaults when stored is null', () => {
    expect(mergeWebsiteEmbedSettings(null)).toEqual(DEFAULT_WEBSITE_EMBED_SETTINGS)
  })

  it('merges partial stored values', () => {
    const m = mergeWebsiteEmbedSettings({
      utmSource: 'site',
      buttonLabel: 'Order',
      rounded: false,
      size: 'lg',
    })
    expect(m.utmSource).toBe('site')
    expect(m.utmMedium).toBe('')
    expect(m.buttonLabel).toBe('Order')
    expect(m.rounded).toBe(false)
    expect(m.size).toBe('lg')
  })

  it('ignores invalid size', () => {
    const m = mergeWebsiteEmbedSettings({ size: 'xl' as any })
    expect(m.size).toBe(DEFAULT_WEBSITE_EMBED_SETTINGS.size)
  })
})
