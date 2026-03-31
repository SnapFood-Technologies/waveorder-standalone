import { describe, it, expect } from 'vitest'
import { validateAmountAdjustmentReason } from '@/lib/delivery-earning-payment-sync'

describe('validateAmountAdjustmentReason', () => {
  it('rejects missing reason', () => {
    expect(validateAmountAdjustmentReason(undefined)).toBeTruthy()
    expect(validateAmountAdjustmentReason(null)).toBeTruthy()
    expect(validateAmountAdjustmentReason('')).toBeTruthy()
    expect(validateAmountAdjustmentReason('   ')).toBeTruthy()
  })

  it('rejects non-string', () => {
    expect(validateAmountAdjustmentReason(1)).toBeTruthy()
  })

  it('accepts non-empty trimmed string', () => {
    expect(validateAmountAdjustmentReason('Corrected fee per invoice')).toBeNull()
    expect(validateAmountAdjustmentReason('  ok  ')).toBeNull()
  })

  it('rejects overly long reason', () => {
    expect(validateAmountAdjustmentReason('x'.repeat(2001))).toBeTruthy()
  })
})
