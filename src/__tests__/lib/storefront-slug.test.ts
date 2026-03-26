import { describe, it, expect } from 'vitest'
import { businessSlugFilter } from '@/lib/storefront-slug'

describe('businessSlugFilter', () => {
  it('uses insensitive mode for Prisma', () => {
    expect(businessSlugFilter('Swarovski')).toEqual({
      equals: 'Swarovski',
      mode: 'insensitive'
    })
  })
})
