/**
 * Backfill Product.visibleCountryCodes and Product.hiddenCountryCodes to explicit [] on MongoDB
 * documents where the field is missing, null, or not an array — so Prisma storefront filters
 * match reliably (same semantics as schema @default([])).
 *
 * Usage:
 *   DATABASE_URL=... npx tsx scripts/backfill-product-country-codes.ts
 *   DATABASE_URL=... npx tsx scripts/backfill-product-country-codes.ts --dry-run
 *
 * Safe to re-run: updates only rows that still need normalization.
 */

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

/** Matches legacy / bad BSON: absent, null, or non-array. */
const FILTER_VISIBLE_UNSET_OR_INVALID = {
  $or: [
    { visibleCountryCodes: { $exists: false } },
    { visibleCountryCodes: null },
    { visibleCountryCodes: { $not: { $type: 'array' } } },
  ],
} as const

const FILTER_HIDDEN_UNSET_OR_INVALID = {
  $or: [
    { hiddenCountryCodes: { $exists: false } },
    { hiddenCountryCodes: null },
    { hiddenCountryCodes: { $not: { $type: 'array' } } },
  ],
} as const

function parseArgs(): { dryRun: boolean } {
  const dryRun = process.argv.includes('--dry-run')
  return { dryRun }
}

function modifiedCount(res: unknown): number {
  const r = res as { nModified?: number; n?: number }
  return r.nModified ?? r.n ?? 0
}

async function countProducts(filter: object): Promise<number> {
  const res = await prisma.$runCommandRaw({
    count: 'Product',
    query: filter,
  })
  const n = (res as { n?: number }).n
  return typeof n === 'number' ? n : 0
}

async function main() {
  const { dryRun } = parseArgs()

  if (!process.env.DATABASE_URL) {
    console.error('DATABASE_URL is not set.')
    process.exit(1)
  }

  console.log('Product country codes backfill')
  console.log('==============================')
  console.log(dryRun ? 'Mode: DRY RUN (no writes)\n' : 'Mode: APPLY updates\n')

  const visibleNeed = await countProducts(FILTER_VISIBLE_UNSET_OR_INVALID)
  const hiddenNeed = await countProducts(FILTER_HIDDEN_UNSET_OR_INVALID)

  console.log(`Products needing visibleCountryCodes fix: ${visibleNeed}`)
  console.log(`Products needing hiddenCountryCodes fix:  ${hiddenNeed}`)

  if (dryRun) {
    console.log('\nDry run complete. Run without --dry-run to apply.')
    await prisma.$disconnect()
    process.exit(0)
  }

  if (visibleNeed === 0 && hiddenNeed === 0) {
    console.log('\nNothing to update.')
    await prisma.$disconnect()
    process.exit(0)
  }

  const updates: Array<{ label: string; q: object; field: string }> = [
    {
      label: 'visibleCountryCodes → []',
      q: FILTER_VISIBLE_UNSET_OR_INVALID,
      field: 'visibleCountryCodes',
    },
    {
      label: 'hiddenCountryCodes → []',
      q: FILTER_HIDDEN_UNSET_OR_INVALID,
      field: 'hiddenCountryCodes',
    },
  ]

  for (const { label, q, field } of updates) {
    const result = await prisma.$runCommandRaw({
      update: 'Product',
      updates: [
        {
          q,
          u: { $set: { [field]: [] } },
          multi: true,
        },
      ],
    })
    const n = modifiedCount(result)
    console.log(`\n${label}: modified ${n}`)
  }

  console.log('\nDone. Re-run with --dry-run to confirm zero remaining (or check counts above).')
  await prisma.$disconnect()
  process.exit(0)
}

main().catch(async (e) => {
  console.error(e)
  await prisma.$disconnect()
  process.exit(1)
})
