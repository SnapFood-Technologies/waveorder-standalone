// scripts/migrate-free-to-starter.ts
import { PrismaClient } from '@prisma/client'
import { stripe } from '../src/lib/stripe'

const prisma = new PrismaClient()

async function main() {
  console.log('🚀 Starting migration: FREE → STARTER')
  console.log('=====================================\n')

  // Get environment variables
  const STARTER_MONTHLY_PRICE_ID = process.env.STRIPE_STARTER_PRICE_ID
  const STARTER_ANNUAL_PRICE_ID = process.env.STRIPE_STARTER_ANNUAL_PRICE_ID

  if (!STARTER_MONTHLY_PRICE_ID) {
    throw new Error('STRIPE_STARTER_PRICE_ID environment variable is not set!')
  }

  console.log('✅ Environment variables loaded')
  console.log(`   Monthly Price ID: ${STARTER_MONTHLY_PRICE_ID}`)
  if (STARTER_ANNUAL_PRICE_ID) {
    console.log(`   Annual Price ID: ${STARTER_ANNUAL_PRICE_ID}`)
  }
  console.log('')

  // Step 1: Update Database
  console.log('📊 Step 1: Updating database...')
  
  // Update Users - using type assertion since 'FREE' is no longer in the enum but may exist in DB
  const usersUpdated = await prisma.user.updateMany({
    where: { plan: 'FREE' as any },
    data: { plan: 'STARTER' as any }
  })
  console.log(`   ✅ Updated ${usersUpdated.count} users`)

  // Update Businesses - using type assertion since 'FREE' is no longer in the enum but may exist in DB
  const businessesUpdated = await prisma.business.updateMany({
    where: { subscriptionPlan: 'FREE' as any },
    data: { subscriptionPlan: 'STARTER' as any }
  })
  console.log(`   ✅ Updated ${businessesUpdated.count} businesses`)

  // Update Subscriptions in database - using type assertion since 'FREE' is no longer in the enum but may exist in DB
  const subscriptionsUpdated = await prisma.subscription.updateMany({
    where: { plan: 'FREE' as any },
    data: { plan: 'STARTER' as any }
  })
  console.log(`   ✅ Updated ${subscriptionsUpdated.count} subscriptions in database`)
  console.log('')

  // Step 2: Update Stripe Subscriptions
  console.log('💳 Step 2: Updating Stripe subscriptions...')
  
  // Find all subscriptions that were FREE (now STARTER) and have Stripe IDs
  // Using type assertion and filtering for non-null stripeId
  const subscriptions = await prisma.subscription.findMany({
    where: {
      plan: 'STARTER' as any
    },
    include: {
      users: true
    }
  })
  
  // Filter out any subscriptions without stripeId
  const subscriptionsWithStripe = subscriptions.filter(sub => sub.stripeId && sub.stripeId.trim() !== '')

  console.log(`   Found ${subscriptionsWithStripe.length} subscriptions to check in Stripe`)

  const oldFreePriceId = process.env.STRIPE_FREE_PRICE_ID
  if (oldFreePriceId) {
    console.log(`   Using STRIPE_FREE_PRICE_ID: ${oldFreePriceId}`)
    console.log(`   Will update subscriptions using this old price ID`)
  } else {
    console.log(`   ⚠️  STRIPE_FREE_PRICE_ID not set - will check ALL Starter subscriptions`)
    console.log(`   Will update any subscription NOT using the new Starter price ID`)
  }

  let updatedCount = 0
  let skippedCount = 0
  let errorCount = 0

  for (const subscription of subscriptionsWithStripe) {
    try {
      if (!subscription.stripeId) continue

      // Retrieve current subscription from Stripe
      const stripeSubscription = await stripe.subscriptions.retrieve(subscription.stripeId)
      
      // Get current price ID from Stripe
      const currentPriceId = stripeSubscription.items.data[0]?.price?.id
      const newStarterPriceId = STARTER_MONTHLY_PRICE_ID

      // Determine if we need to update:
      // 1. If STRIPE_FREE_PRICE_ID is set, only update subscriptions using that old price
      // 2. If STRIPE_FREE_PRICE_ID is NOT set, update any subscription NOT using the new Starter price
      const needsUpdate = oldFreePriceId
        ? currentPriceId === oldFreePriceId
        : currentPriceId !== newStarterPriceId

      if (needsUpdate) {
        console.log(`   🔄 Updating subscription ${subscription.stripeId}...`)

        // Update subscription to use new Starter price ID
        await stripe.subscriptions.update(subscription.stripeId, {
          items: [{
            id: stripeSubscription.items.data[0].id,
            price: STARTER_MONTHLY_PRICE_ID,
          }],
          metadata: {
            plan: 'STARTER',
            source: 'waveorder_platform',
            migrated_from: 'FREE'
          },
          // Don't prorate - this is a migration, not a plan change
          proration_behavior: 'none'
        })

        // Update price ID in database
        await prisma.subscription.update({
          where: { id: subscription.id },
          data: {
            priceId: STARTER_MONTHLY_PRICE_ID
          }
        })

        updatedCount++
        console.log(`   ✅ Updated subscription ${subscription.stripeId} from ${currentPriceId} to ${newStarterPriceId}`)
      } else {
        skippedCount++
        console.log(`   ⏭️  Subscription ${subscription.stripeId} already using correct price (${currentPriceId})`)
      }
    } catch (error: any) {
      errorCount++
      console.error(`   ❌ Error updating subscription ${subscription.stripeId}:`, error.message)
      // Continue with other subscriptions
    }
  }

  console.log('')
  console.log(`   ✅ Successfully updated ${updatedCount} Stripe subscriptions`)
  console.log(`   ⏭️  Skipped ${skippedCount} subscriptions (already using correct price)`)
  if (errorCount > 0) {
    console.log(`   ⚠️  ${errorCount} subscriptions had errors (check logs above)`)
  }
  console.log('')

  // Step 3: Verification
  console.log('🔍 Step 3: Verification...')
  
  const remainingFreeUsers = await prisma.user.count({
    where: { plan: 'FREE' as any }
  })
  const remainingFreeBusinesses = await prisma.business.count({
    where: { subscriptionPlan: 'FREE' as any }
  })
  const remainingFreeSubscriptions = await prisma.subscription.count({
    where: { plan: 'FREE' as any }
  })

  if (remainingFreeUsers === 0 && remainingFreeBusinesses === 0 && remainingFreeSubscriptions === 0) {
    console.log('   ✅ All database records migrated successfully!')
  } else {
    console.log('   ⚠️  Some records still have FREE plan:')
    console.log(`      Users: ${remainingFreeUsers}`)
    console.log(`      Businesses: ${remainingFreeBusinesses}`)
    console.log(`      Subscriptions: ${remainingFreeSubscriptions}`)
  }

  console.log('')
  console.log('✨ Migration completed!')
  console.log('')
  console.log('📝 Next steps:')
  console.log('   1. Verify all users can access their accounts')
  console.log('   2. Check Stripe Dashboard to confirm subscriptions are updated')
  console.log('   3. Test a new signup to ensure Starter plan works correctly')
  console.log('   4. Monitor for any errors in the next few days')
}

main()
  .catch((e) => {
    console.error('❌ Migration failed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
