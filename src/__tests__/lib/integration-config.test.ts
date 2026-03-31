import { describe, it, expect } from 'vitest'
import { normalizeIntegrationConfig, parseHolaOraConfig } from '@/lib/integration-config'

describe('normalizeIntegrationConfig', () => {
  it('accepts valid HolaOra config', () => {
    const r = normalizeIntegrationConfig('HOLAORA', {
      holaOraBaseUrl: 'https://api.example.com',
      entitlementStripePriceIds: ['price_123'],
      defaultV1Scopes: ['products:read', 'services:read'],
      documentedV1Paths: ['/api/v1/products'],
      rateLimitPerMinute: 120,
      setupNotes: 'notes',
    })
    expect(r.ok).toBe(true)
    if (r.ok) {
      expect((r.value as { holaOraBaseUrl: string }).holaOraBaseUrl).toBe('https://api.example.com')
    }
  })

  it('rejects HolaOra config with invalid scope', () => {
    const r = normalizeIntegrationConfig('HOLAORA', {
      holaOraBaseUrl: 'https://api.example.com',
      defaultV1Scopes: ['not-a-real-scope'],
    })
    expect(r.ok).toBe(false)
  })

  it('accepts generic null config', () => {
    const r = normalizeIntegrationConfig('GENERIC', null)
    expect(r.ok).toBe(true)
  })
})

describe('parseHolaOraConfig', () => {
  it('returns null for invalid payload', () => {
    expect(parseHolaOraConfig({})).toBeNull()
  })
})
