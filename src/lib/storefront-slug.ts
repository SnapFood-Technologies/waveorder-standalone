import type { Prisma } from '@prisma/client'

/**
 * Case-insensitive match for `Business.slug` so URLs like `/Swarovski` resolve when
 * the stored slug is `swarovski` (MongoDB + Prisma).
 */
export function businessSlugFilter(slug: string): Prisma.StringFilter {
  return {
    equals: slug,
    mode: 'insensitive'
  }
}
