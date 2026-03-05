import { describe, it, expect } from 'vitest'
import { estimateCampaignCost } from '@/lib/whatsapp-campaign-sender'

describe('estimateCampaignCost (Phase 7)', () => {
  it('returns 0 for 0 recipients', () => {
    expect(estimateCampaignCost(0)).toBe(0)
  })

  it('returns cost proportional to recipient count', () => {
    expect(estimateCampaignCost(100)).toBe(5) // 100 * 0.05
    expect(estimateCampaignCost(1000)).toBe(50)
  })
})
