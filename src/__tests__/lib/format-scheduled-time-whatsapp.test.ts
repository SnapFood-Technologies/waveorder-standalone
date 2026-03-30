import { describe, it, expect } from 'vitest'
import { formatScheduledTimeForWhatsAppMessage } from '@/lib/format-scheduled-time-whatsapp'

describe('formatScheduledTimeForWhatsAppMessage', () => {
  it('returns empty string for null/undefined/empty', () => {
    expect(formatScheduledTimeForWhatsAppMessage(null, 'en-US', 'UTC')).toBe('')
    expect(formatScheduledTimeForWhatsAppMessage(undefined, 'en-US', 'UTC')).toBe('')
    expect(formatScheduledTimeForWhatsAppMessage('', 'en-US', 'UTC')).toBe('')
  })

  it('formats the same instant in business TZ vs UTC with different wall clocks', () => {
    // 2026-06-15 18:00:00 UTC
    const iso = '2026-06-15T18:00:00.000Z'
    const utcClock = formatScheduledTimeForWhatsAppMessage(iso, 'en-US', 'UTC')
    const barbadosClock = formatScheduledTimeForWhatsAppMessage(
      iso,
      'en-US',
      'America/Barbados'
    )
    expect(utcClock).not.toBe(barbadosClock)
    expect(barbadosClock).toMatch(/2026/)
  })

  it('falls back to UTC on invalid timezone string', () => {
    const iso = '2026-01-01T12:00:00.000Z'
    const out = formatScheduledTimeForWhatsAppMessage(iso, 'en-US', 'NotA/Real_Zone_XX')
    expect(out.length).toBeGreaterThan(0)
  })
})
