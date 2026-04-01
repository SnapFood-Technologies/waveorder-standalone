import { describe, expect, it } from 'vitest'
import {
  HOLA_ENTITLEMENT_SOURCE_MANUAL,
  isStripeManagedHolaEntitlement,
} from '@/lib/holaora-entitlement-source'

describe('isStripeManagedHolaEntitlement', () => {
  it('returns false for MANUAL', () => {
    expect(isStripeManagedHolaEntitlement(HOLA_ENTITLEMENT_SOURCE_MANUAL)).toBe(false)
  })

  it('returns true for STRIPE and unknown / empty', () => {
    expect(isStripeManagedHolaEntitlement('STRIPE')).toBe(true)
    expect(isStripeManagedHolaEntitlement(undefined)).toBe(true)
    expect(isStripeManagedHolaEntitlement(null)).toBe(true)
    expect(isStripeManagedHolaEntitlement('')).toBe(true)
  })
})
