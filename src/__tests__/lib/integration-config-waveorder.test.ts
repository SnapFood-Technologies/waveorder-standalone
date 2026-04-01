import { describe, expect, it } from 'vitest'
import { holaOraConfigSchema, normalizeIntegrationConfig } from '@/lib/integration-config'

const minimalHola = {
  holaOraBaseUrl: 'https://partner.example.com',
  entitlementStripePriceIds: [] as string[],
  defaultV1Scopes: ['products:read'] as string[],
}

describe('holaOraConfigSchema waveorderMarketingSite', () => {
  it('parses legacy config without waveorderMarketingSite', () => {
    const r = holaOraConfigSchema.safeParse(minimalHola)
    expect(r.success).toBe(true)
    if (r.success) expect(r.data.waveorderMarketingSite).toBeUndefined()
  })

  it('parses with waveorderMarketingSite', () => {
    const r = holaOraConfigSchema.safeParse({
      ...minimalHola,
      waveorderMarketingSite: {
        embedEnabled: true,
        embedKind: 'SCRIPT' as const,
        workspaceId: '56e25486-18e7-49ae-8db0-10725f151a6f',
      },
    })
    expect(r.success).toBe(true)
  })

  it('normalizeIntegrationConfig accepts merged config', () => {
    const n = normalizeIntegrationConfig('HOLAORA', {
      ...minimalHola,
      waveorderMarketingSite: {
        embedEnabled: false,
        embedKind: 'IFRAME',
      },
    })
    expect(n.ok).toBe(true)
  })
})
