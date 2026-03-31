import { describe, expect, it } from 'vitest'
import { applyAiHolaMutex } from '@/lib/holaora-mutex'

describe('applyAiHolaMutex', () => {
  it('turning Hola embed on forces AI off', () => {
    expect(applyAiHolaMutex({ holaoraStorefrontEmbedEnabled: true })).toEqual({
      holaoraStorefrontEmbedEnabled: true,
      aiAssistantEnabled: false,
    })
  })

  it('turning AI on forces Hola embed off', () => {
    expect(applyAiHolaMutex({ aiAssistantEnabled: true })).toEqual({
      aiAssistantEnabled: true,
      holaoraStorefrontEmbedEnabled: false,
    })
  })

  it('embed off alone does not change AI', () => {
    expect(applyAiHolaMutex({ holaoraStorefrontEmbedEnabled: false })).toEqual({
      holaoraStorefrontEmbedEnabled: false,
    })
  })

  it('AI off alone does not change embed', () => {
    expect(applyAiHolaMutex({ aiAssistantEnabled: false })).toEqual({
      aiAssistantEnabled: false,
    })
  })
})
