import { describe, it, expect } from 'vitest'
import { isStorefrontPhoneComplete } from '@/lib/storefront-phone'

describe('isStorefrontPhoneComplete', () => {
  it('rejects empty', () => {
    expect(isStorefrontPhoneComplete('')).toBe(false)
  })

  it('accepts plausible Greece numbers', () => {
    expect(isStorefrontPhoneComplete('+306912345678')).toBe(true)
  })

  it('rejects too-short Greece', () => {
    expect(isStorefrontPhoneComplete('+30691')).toBe(false)
  })
})
