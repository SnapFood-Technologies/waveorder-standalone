import { describe, expect, it } from 'vitest'
import { readInitialCatalogVisitorIso } from '@/lib/storefront-catalog-visitor'

describe('readInitialCatalogVisitorIso', () => {
  it('returns null when country catalog is disabled', () => {
    const sp = new URLSearchParams('cc=GR')
    expect(readInitialCatalogVisitorIso(false, sp)).toBeNull()
  })

  it('reads cc from search params (case-normalized)', () => {
    const sp = new URLSearchParams('cc=gr')
    expect(readInitialCatalogVisitorIso(true, sp)).toBe('GR')
  })

  it('reads visitorCountry when cc is absent', () => {
    const sp = new URLSearchParams('visitorCountry=DE')
    expect(readInitialCatalogVisitorIso(true, sp)).toBe('DE')
  })

  it('returns null for invalid codes when no browser', () => {
    const sp = new URLSearchParams('cc=GRC')
    expect(readInitialCatalogVisitorIso(true, sp)).toBeNull()
  })
})
