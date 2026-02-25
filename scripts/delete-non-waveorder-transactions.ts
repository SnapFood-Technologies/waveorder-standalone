/**
 * One-off script: Delete StripeTransaction records that belong to non-WaveOrder
 * subscriptions (e.g. lighthouseartscentre, other products on same Stripe account).
 *
 * Run: npx tsx scripts/delete-non-waveorder-transactions.ts
 */
import { PrismaClient } from '@prisma/client'
import { stripe, isWaveOrderSubscription } from '../src/lib/stripe'

const prisma = new PrismaClient()

async function main() {
  console.log('🔍 Finding non-WaveOrder StripeTransaction records...\n')

  const transactions = await prisma.stripeTransaction.findMany({
    where: { subscriptionId: { not: null } },
    select: {
      id: true,
      stripeId: true,
      customerEmail: true,
      customerName: true,
      amount: true,
      subscriptionId: true,
    },
  })

  console.log(`Found ${transactions.length} transactions with subscriptionId\n`)

  const toDelete: { id: string; stripeId: string; customerEmail: string | null }[] = []

  for (const t of transactions) {
    if (!t.subscriptionId) continue
    try {
      const sub = await stripe.subscriptions.retrieve(t.subscriptionId)
      if (!isWaveOrderSubscription(sub)) {
        toDelete.push({
          id: t.id,
          stripeId: t.stripeId,
          customerEmail: t.customerEmail,
        })
      }
    } catch (err) {
      // Subscription may no longer exist; treat as non-WaveOrder and delete
      toDelete.push({
        id: t.id,
        stripeId: t.stripeId,
        customerEmail: t.customerEmail,
      })
    }
  }

  if (toDelete.length === 0) {
    console.log('✅ No non-WaveOrder transactions found.')
    return
  }

  console.log(`Will delete ${toDelete.length} non-WaveOrder transaction(s):`)
  toDelete.forEach((t) =>
    console.log(`  - ${t.stripeId} (${t.customerEmail || 'unknown'})`)
  )
  console.log('')

  const ids = toDelete.map((t) => t.id)
  const result = await prisma.stripeTransaction.deleteMany({
    where: { id: { in: ids } },
  })

  console.log(`✅ Deleted ${result.count} record(s).`)
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
