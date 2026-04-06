import { beforeEach, describe, expect, it } from 'vitest'
import {
  normalizeStorefrontVisitorIso2,
  readInitialCatalogVisitorIso,
  resolveCatalogVisitorIsoFromClientState,
} from '@/lib/storefront-catalog-visitor'

describe('normalizeStorefrontVisitorIso2', () => {
  it('normalizes valid codes', () => {
    expect(normalizeStorefrontVisitorIso2('gr')).toBe('GR')
    expect(normalizeStorefrontVisitorIso2('  IT  ')).toBe('IT')
  })
  it('returns null for invalid', () => {
    expect(normalizeStorefrontVisitorIso2(null)).toBeNull()
    expect(normalizeStorefrontVisitorIso2('GRC')).toBeNull()
  })
})

describe('resolveCatalogVisitorIsoFromClientState', () => {
  beforeEach(() => {
    document.cookie = 'wo_visitor_country=; path=/; max-age=0'
  })
  it('returns null when disabled', () => {
    const sp = new URLSearchParams('cc=GR')
    expect(resolveCatalogVisitorIsoFromClientState(false, sp, 'IT')).toBeNull()
  })
  it('URL cc wins over server', () => {
    const sp = new URLSearchParams('cc=IT')
    expect(resolveCatalogVisitorIsoFromClientState(true, sp, 'GR')).toBe('IT')
  })
  it('cookie wins over server when no cc in URL', () => {
    document.cookie = 'wo_visitor_country=IT; path=/'
    const sp = new URLSearchParams()
    expect(resolveCatalogVisitorIsoFromClientState(true, sp, 'GR')).toBe('IT')
  })
  it('uses server when no URL and no cookie', () => {
    const sp = new URLSearchParams()
    expect(resolveCatalogVisitorIsoFromClientState(true, sp, 'GR')).toBe('GR')
  })
})

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
