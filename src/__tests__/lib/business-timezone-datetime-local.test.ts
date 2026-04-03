import { describe, it, expect } from 'vitest'
import {
  datetimeLocalInTimeZoneToIsoUtc,
  instantToDatetimeLocalInTimeZone,
} from '@/lib/business-timezone-datetime-local'

describe('instantToDatetimeLocalInTimeZone', () => {
  it('maps UTC instant to America/Barbados wall time (April uses AST, UTC-4)', () => {
    const iso = '2026-04-04T14:00:00.000Z'
    expect(instantToDatetimeLocalInTimeZone(iso, 'America/Barbados')).toBe('2026-04-04T10:00')
  })

  it('uses UTC when timezone omitted', () => {
    expect(instantToDatetimeLocalInTimeZone('2026-04-04T14:00:00.000Z', null)).toBe(
      '2026-04-04T14:00'
    )
  })
})

describe('datetimeLocalInTimeZoneToIsoUtc', () => {
  it('round-trips with America/Barbados', () => {
    const iso = datetimeLocalInTimeZoneToIsoUtc('2026-04-04T10:00', 'America/Barbados')
    expect(instantToDatetimeLocalInTimeZone(iso, 'America/Barbados')).toBe('2026-04-04T10:00')
  })

  it('treats wall time as UTC when timezone omitted', () => {
    const iso = datetimeLocalInTimeZoneToIsoUtc('2026-04-04T10:00', null)
    expect(iso).toBe('2026-04-04T10:00:00.000Z')
  })
})
