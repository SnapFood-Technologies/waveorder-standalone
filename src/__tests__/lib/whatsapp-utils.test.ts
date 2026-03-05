import { describe, it, expect } from 'vitest'
import { normalizePhone } from '@/lib/whatsapp-utils'

describe('normalizePhone', () => {
  it('strips whatsapp: prefix', () => {
    expect(normalizePhone('whatsapp:+15551234567')).toBe('+15551234567')
    expect(normalizePhone('WhatsApp:+15551234567')).toBe('+15551234567')
  })

  it('keeps digits and plus', () => {
    expect(normalizePhone('+15551234567')).toBe('+15551234567')
    expect(normalizePhone('15551234567')).toBe('+15551234567')
  })

  it('strips spaces and punctuation', () => {
    expect(normalizePhone('+1 (555) 123-4567')).toBe('+15551234567')
    expect(normalizePhone('  +15551234567  ')).toBe('+15551234567')
  })

  it('adds + when missing', () => {
    expect(normalizePhone('15551234567')).toBe('+15551234567')
    expect(normalizePhone('5551234567')).toBe('+5551234567')
  })
})
