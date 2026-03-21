import { describe, it, expect } from 'vitest'
import { canEditMemberProfile } from '@/lib/permissions'

describe('canEditMemberProfile', () => {
  const ownerId = 'u-owner'
  const otherId = 'u-other'

  it('allows owner to edit manager/staff/delivery', () => {
    expect(
      canEditMemberProfile('OWNER', 'MANAGER', otherId, ownerId).canEdit
    ).toBe(true)
    expect(
      canEditMemberProfile('OWNER', 'STAFF', otherId, ownerId).canEdit
    ).toBe(true)
    expect(
      canEditMemberProfile('OWNER', 'DELIVERY', otherId, ownerId).canEdit
    ).toBe(true)
  })

  it('denies editing self', () => {
    expect(canEditMemberProfile('OWNER', 'MANAGER', ownerId, ownerId).canEdit).toBe(
      false
    )
  })

  it('denies editing another owner', () => {
    expect(
      canEditMemberProfile('OWNER', 'OWNER', otherId, ownerId).canEdit
    ).toBe(false)
  })

  it('denies non-owner manager', () => {
    expect(
      canEditMemberProfile('MANAGER', 'STAFF', otherId, ownerId).canEdit
    ).toBe(false)
  })
})
