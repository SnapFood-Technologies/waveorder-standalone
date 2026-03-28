import { describe, expect, it } from 'vitest'
import {
  mergeProductWhereVisitorCountry,
  normalizeCountryCodeList,
  parseVisitorCountryFromSearchParams,
  productVisibleForVisitorCountry
} from '@/lib/visitor-country-catalog'

describe('productVisibleForVisitorCountry', () => {
  it('returns true when visitor is null (no geo — show catalog)', () => {
    expect(productVisibleForVisitorCountry(['ES'], [''], null)).toBe(true)
  })

  it('exclude list wins: hidden includes visitor → false', () => {
    expect(productVisibleForVisitorCountry([], ['ES'], 'ES')).toBe(false)
    expect(productVisibleForVisitorCountry(['ES'], ['ES'], 'ES')).toBe(false)
  })

  it('empty visible = worldwide when not hidden', () => {
    expect(productVisibleForVisitorCountry([], [], 'DE')).toBe(true)
  })

  it('non-empty visible: only listed countries', () => {
    expect(productVisibleForVisitorCountry(['ES', 'FR'], [], 'ES')).toBe(true)
    expect(productVisibleForVisitorCountry(['ES', 'FR'], [], 'DE')).toBe(false)
  })

  it('is case-insensitive for codes', () => {
    expect(productVisibleForVisitorCountry(['es'], [], 'ES')).toBe(true)
    expect(productVisibleForVisitorCountry([], ['de'], 'DE')).toBe(false)
  })
})

describe('mergeProductWhereVisitorCountry', () => {
  it('no-ops when disabled', () => {
    const w: Record<string, unknown> = { isActive: true }
    mergeProductWhereVisitorCountry(w, { enabled: false, visitorIso: 'ES' })
    expect(w.AND).toBeUndefined()
  })

  it('no-ops when enabled but no visitor', () => {
    const w: Record<string, unknown> = { isActive: true }
    mergeProductWhereVisitorCountry(w, { enabled: true, visitorIso: null })
    expect(w.AND).toBeUndefined()
  })

  it('appends country AND when enabled with visitor', () => {
    const w: Record<string, unknown> = { businessId: 'x' }
    mergeProductWhereVisitorCountry(w, { enabled: true, visitorIso: 'GR' })
    expect(Array.isArray(w.AND)).toBe(true)
    const and = w.AND as unknown[]
    expect(and).toHaveLength(1)
    expect(and[0]).toMatchObject({
      AND: [
        {
          OR: [
            { visibleCountryCodes: { has: 'GR' } },
            { visibleCountryCodes: { isEmpty: true } },
            { visibleCountryCodes: { equals: [] } },
            { visibleCountryCodes: { equals: null } }
          ]
        },
        { NOT: { hiddenCountryCodes: { has: 'GR' } } }
      ]
    })
  })

  it('appends to existing AND array', () => {
    const w: Record<string, unknown> = {
      AND: [{ OR: [{ name: 'a' }] }]
    }
    mergeProductWhereVisitorCountry(w, { enabled: true, visitorIso: 'ES' })
    const and = w.AND as unknown[]
    expect(and).toHaveLength(2)
    expect(and[0]).toEqual({ OR: [{ name: 'a' }] })
  })
})

describe('parseVisitorCountryFromSearchParams', () => {
  it('reads cc or visitorCountry', () => {
    expect(parseVisitorCountryFromSearchParams(new URLSearchParams('cc=de'))).toBe('DE')
    expect(parseVisitorCountryFromSearchParams(new URLSearchParams('visitorCountry=fr'))).toBe('FR')
  })
})

describe('normalizeCountryCodeList', () => {
  it('returns undefined when input undefined', () => {
    expect(normalizeCountryCodeList(undefined)).toBeUndefined()
  })

  it('filters invalid entries and uppercases', () => {
    expect(normalizeCountryCodeList(['es', 'Z', '  fr ', 'toolong', 1])).toEqual(['ES', 'FR'])
  })

  it('dedupes', () => {
    expect(normalizeCountryCodeList(['ES', 'es', 'ES'])).toEqual(['ES'])
  })

  it('allows empty array', () => {
    expect(normalizeCountryCodeList([])).toEqual([])
  })
})
