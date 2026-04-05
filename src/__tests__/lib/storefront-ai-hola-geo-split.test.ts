import { describe, it, expect } from 'vitest'
import {
  aiHolaMutexEnforced,
  computeStorefrontChatPresentation,
} from '@/lib/storefront-ai-hola-geo-split'

describe('aiHolaMutexEnforced', () => {
  it('enforces mutex when geo split off', () => {
    expect(aiHolaMutexEnforced(false, ['GR'])).toBe(true)
  })
  it('enforces mutex when geo split on but no countries', () => {
    expect(aiHolaMutexEnforced(true, [])).toBe(true)
    expect(aiHolaMutexEnforced(true, null)).toBe(true)
  })
  it('does not enforce when geo split on with countries', () => {
    expect(aiHolaMutexEnforced(true, ['GR'])).toBe(false)
  })
})

describe('computeStorefrontChatPresentation', () => {
  const base = {
    storefrontAiGeoSplitEnabled: false,
    aiAssistantVisitorCountryCodes: [] as string[],
    visitorCountryIso: 'GR' as string | null,
    aiAssistantEnabled: true,
    showHolaOraEmbed: true,
    holaoraAccountId: 'uuid',
  }

  it('legacy: only hola when both configured and mutex path', () => {
    const r = computeStorefrontChatPresentation(base)
    expect(r.showHolaEmbed).toBe(true)
    expect(r.showAiAssistant).toBe(false)
    expect(r.scrollToTopLeft).toBe(false)
  })

  it('legacy: only ai when hola off', () => {
    const r = computeStorefrontChatPresentation({ ...base, showHolaOraEmbed: false })
    expect(r.showHolaEmbed).toBe(false)
    expect(r.showAiAssistant).toBe(true)
  })

  it('geo split: GR visitor gets AI only', () => {
    const r = computeStorefrontChatPresentation({
      ...base,
      storefrontAiGeoSplitEnabled: true,
      aiAssistantVisitorCountryCodes: ['GR'],
      visitorCountryIso: 'GR',
    })
    expect(r.showHolaEmbed).toBe(false)
    expect(r.showAiAssistant).toBe(true)
    expect(r.scrollToTopLeft).toBe(false)
  })

  it('geo split: US visitor gets Hola and left scroll', () => {
    const r = computeStorefrontChatPresentation({
      ...base,
      storefrontAiGeoSplitEnabled: true,
      aiAssistantVisitorCountryCodes: ['GR'],
      visitorCountryIso: 'US',
    })
    expect(r.showHolaEmbed).toBe(true)
    expect(r.showAiAssistant).toBe(false)
    expect(r.scrollToTopLeft).toBe(true)
  })

  it('geo split: unknown visitor gets Hola path', () => {
    const r = computeStorefrontChatPresentation({
      ...base,
      storefrontAiGeoSplitEnabled: true,
      aiAssistantVisitorCountryCodes: ['GR'],
      visitorCountryIso: null,
    })
    expect(r.showHolaEmbed).toBe(true)
    expect(r.showAiAssistant).toBe(false)
    expect(r.scrollToTopLeft).toBe(true)
  })
})
