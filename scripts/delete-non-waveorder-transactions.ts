/**
 * One-off script: Delete StripeTransaction records that don't belong to WaveOrder.
 * Uses a static list of stripeIds (invoice IDs) to delete.
 *
 * Run: npx tsx scripts/delete-non-waveorder-transactions.ts
 */
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// Static list of invoice IDs to delete (non-WaveOrder or test/dev)
const STRIPE_IDS_TO_DELETE = [
  'in_1T4SAQK9QDeYHZl0C8azG8LW', // Rob Power - lighthouseartscentre
  'in_1T4U6YK9QDeYHZl0CSqMo1jq', // Griseld anothertest
  'in_1T48P7K9QDeYHZl0h6LKzuYA', // Griseld testwork1
  'in_1T48F6K9QDeYHZl0PwAaaT29',
  'in_1T485OK9QDeYHZl0ZEsGnIRf',
  'in_1T482WK9QDeYHZl0qLgechfP',
  'in_1T481hK9QDeYHZl0eWJCIdD4',
  'in_1T4813K9QDeYHZl0DSw2rYrZ',
  'in_1T47poK9QDeYHZl0vzwfwa8c',
  'in_1T47icK9QDeYHZl0gGpwvOIO',
  'in_1T47b5K9QDeYHZl0q9oSFOVw',
  'in_1T47ZSK9QDeYHZl0uixQwPn2',
  'in_1T46gbK9QDeYHZl0Jq4aC25n', // Redi Frasheri - development
]

async function main() {
  console.log('🔍 Deleting static list of non-WaveOrder StripeTransaction records...\n')

  const found = await prisma.stripeTransaction.findMany({
    where: { stripeId: { in: STRIPE_IDS_TO_DELETE } },
    select: { stripeId: true, customerEmail: true, customerName: true },
  })

  console.log(`Found ${found.length} of ${STRIPE_IDS_TO_DELETE.length} records to delete:`)
  found.forEach((t) =>
    console.log(`  - ${t.stripeId} (${t.customerName || t.customerEmail || 'unknown'})`)
  )

  if (found.length === 0) {
    console.log('\n✅ Nothing to delete.')
    return
  }

  const result = await prisma.stripeTransaction.deleteMany({
    where: { stripeId: { in: STRIPE_IDS_TO_DELETE } },
  })

  console.log(`\n✅ Deleted ${result.count} record(s).`)
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
