import { describe, it, expect } from 'vitest'
import { isWithinBusinessHours } from '@/lib/whatsapp-flow-engine'

describe('isWithinBusinessHours', () => {
  it('returns true when no hours configured (always open)', () => {
    expect(
      isWithinBusinessHours({
        businessHoursStart: null,
        businessHoursEnd: null,
        businessHoursTimezone: null,
        businessDays: [1, 2, 3, 4, 5]
      })
    ).toBe(true)
  })

  it('returns false when businessDays is empty (never open)', () => {
    expect(
      isWithinBusinessHours({
        businessHoursStart: '09:00',
        businessHoursEnd: '17:00',
        businessHoursTimezone: 'UTC',
        businessDays: []
      })
    ).toBe(false)
  })

  it('returns a boolean for valid weekday config', () => {
    const result = isWithinBusinessHours({
      businessHoursStart: '00:00',
      businessHoursEnd: '23:59',
      businessHoursTimezone: 'UTC',
      businessDays: [1, 2, 3, 4, 5, 6, 7]
    })
    expect(typeof result).toBe('boolean')
  })
})
