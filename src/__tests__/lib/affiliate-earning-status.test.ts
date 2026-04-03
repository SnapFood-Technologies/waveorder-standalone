import { describe, expect, it } from 'vitest'
import {
  canTransitionEarningStatus,
  assertCanTransitionEarningStatus,
} from '@/lib/affiliate-earning-status'

describe('affiliate-earning-status', () => {
  it('allows PENDING → PAID and PENDING → CANCELLED', () => {
    expect(canTransitionEarningStatus('PENDING', 'PAID')).toBe(true)
    expect(canTransitionEarningStatus('PENDING', 'CANCELLED')).toBe(true)
  })

  it('allows PAID → PENDING and PAID → CANCELLED', () => {
    expect(canTransitionEarningStatus('PAID', 'PENDING')).toBe(true)
    expect(canTransitionEarningStatus('PAID', 'CANCELLED')).toBe(true)
  })

  it('allows CANCELLED → PENDING', () => {
    expect(canTransitionEarningStatus('CANCELLED', 'PENDING')).toBe(true)
  })

  it('rejects no-op and invalid transitions', () => {
    expect(canTransitionEarningStatus('PENDING', 'PENDING')).toBe(false)
    expect(canTransitionEarningStatus('CANCELLED', 'PAID')).toBe(false)
    expect(canTransitionEarningStatus('PAID', 'PAID')).toBe(false)
  })

  it('assertCanTransitionEarningStatus throws on invalid', () => {
    expect(() => assertCanTransitionEarningStatus('PENDING', 'PENDING')).toThrow()
    expect(() => assertCanTransitionEarningStatus('CANCELLED', 'PAID')).toThrow()
    expect(() => assertCanTransitionEarningStatus('PENDING', 'PAID')).not.toThrow()
  })
})
