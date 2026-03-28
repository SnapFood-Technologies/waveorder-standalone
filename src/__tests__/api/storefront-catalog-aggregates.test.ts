import { describe, expect, it, vi, beforeEach } from 'vitest'

vi.mock('@/lib/prisma', () => ({
  prisma: {
    business: {
      findUnique: vi.fn()
    },
    product: {
      findMany: vi.fn()
    }
  }
}))

import { prisma } from '@/lib/prisma'
import { getCatalogCountryAggregatesForBusiness } from '@/lib/catalog-country-aggregates'

describe('getCatalogCountryAggregatesForBusiness', () => {
  beforeEach(() => {
    vi.mocked(prisma.business.findUnique).mockResolvedValue({
      connectedBusinesses: [],
      countryBasedCatalogEnabled: true
    } as any)
  })

  it('returns empty rows when no products have country rules', async () => {
    vi.mocked(prisma.product.findMany).mockResolvedValue([])
    const out = await getCatalogCountryAggregatesForBusiness('biz1')
    expect(out.rows).toEqual([])
    expect(out.visibleCountryRows).toEqual([])
    expect(out.excludedCountryRows).toEqual([])
    expect(out.products).toEqual([])
    expect(out.summary.productsWithAnyCountryRule).toBe(0)
    expect(out.summary.distinctCountryCodes).toBe(0)
    expect(out.countryBasedCatalogEnabled).toBe(true)
  })

  it('reflects countryBasedCatalogEnabled from business', async () => {
    vi.mocked(prisma.business.findUnique).mockResolvedValue({
      connectedBusinesses: [],
      countryBasedCatalogEnabled: false
    } as any)
    vi.mocked(prisma.product.findMany).mockResolvedValue([])
    const out = await getCatalogCountryAggregatesForBusiness('biz1')
    expect(out.countryBasedCatalogEnabled).toBe(false)
  })

  it('aggregates visible and hidden counts per code', async () => {
    vi.mocked(prisma.product.findMany).mockResolvedValue([
      {
        id: 'p1',
        name: 'A',
        sku: null,
        visibleCountryCodes: ['ES', 'FR'],
        hiddenCountryCodes: ['DE']
      },
      {
        id: 'p2',
        name: 'B',
        sku: null,
        visibleCountryCodes: ['ES'],
        hiddenCountryCodes: []
      }
    ] as any)
    const out = await getCatalogCountryAggregatesForBusiness('biz1')
    const es = out.rows.find((r) => r.code === 'ES')
    expect(es?.visibleProductCount).toBe(2)
    const de = out.rows.find((r) => r.code === 'DE')
    expect(de?.hiddenProductCount).toBe(1)

    expect(out.visibleCountryRows.map((r) => r.code)).toEqual(['ES', 'FR'])
    const visEs = out.visibleCountryRows.find((r) => r.code === 'ES')
    expect(visEs?.productIds.sort()).toEqual(['p1', 'p2'])
    const visFr = out.visibleCountryRows.find((r) => r.code === 'FR')
    expect(visFr?.productIds).toEqual(['p1'])
    expect(visFr?.productCount).toBe(1)
    expect(out.excludedCountryRows.map((r) => r.code)).toEqual(['DE'])
    expect(out.excludedCountryRows[0]?.productIds).toEqual(['p1'])
    expect(out.excludedCountryRows[0]?.productCount).toBe(1)
  })
})
