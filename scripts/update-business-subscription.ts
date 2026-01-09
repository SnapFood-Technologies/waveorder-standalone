// scripts/update-business-subscription.ts
// Script to update a business subscription to PRO directly in the database

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// Business ID to upgrade to PRO
const PRO_BUSINESS_ID = '695fe009d364dfb42d4c3bfc'

async function updateBusinessSubscription(businessId: string) {
  try {
    console.log('🚀 Starting subscription update...')
    console.log(`Business ID: ${businessId}\n`)

    // Find the business
    const business = await prisma.business.findUnique({
      where: { id: businessId },
      include: {
        users: {
          include: {
            user: {
              select: {
                id: true,
                email: true,
                plan: true
              }
            }
          }
        }
      }
    })

    if (!business) {
      console.error(`❌ Business not found with ID: ${businessId}`)
      process.exit(1)
    }

    console.log(`✅ Found business: ${business.name}`)
    console.log(`   Current plan: ${business.subscriptionPlan}`)
    console.log(`   Current status: ${business.subscriptionStatus}`)
    console.log(`   Users associated: ${business.users.length}\n`)

    // Update the business subscription
    const updatedBusiness = await prisma.business.update({
      where: { id: businessId },
      data: {
        subscriptionPlan: 'PRO',
        subscriptionStatus: 'ACTIVE'
      },
      select: {
        id: true,
        name: true,
        subscriptionPlan: true,
        subscriptionStatus: true
      }
    })

    console.log(`✅ Business subscription updated successfully!`)
    console.log(`   New plan: ${updatedBusiness.subscriptionPlan}`)
    console.log(`   New status: ${updatedBusiness.subscriptionStatus}\n`)

    // Optionally update user plans if they exist
    if (business.users.length > 0) {
      console.log(`📝 Updating associated user plans...`)
      const userIds = business.users.map(bu => bu.userId)
      
      // Get users to show before/after
      const users = await prisma.user.findMany({
        where: { id: { in: userIds } },
        select: { id: true, email: true, plan: true }
      })

      console.log(`   Found ${users.length} user(s) associated with this business:`)
      users.forEach(user => {
        console.log(`   - ${user.email}: ${user.plan} → PRO`)
      })

      const updatedUsers = await prisma.user.updateMany({
        where: {
          id: { in: userIds }
        },
        data: {
          plan: 'PRO'
        }
      })

      console.log(`\n   ✅ Updated ${updatedUsers.count} user(s) to PRO plan\n`)
    } else {
      console.log(`ℹ️  No users found associated with this business\n`)
    }

    console.log('\n' + '='.repeat(50))
    console.log('✅ Subscription update completed successfully!')
    console.log('='.repeat(50))
    console.log(`\nBusiness "${business.name}" is now on PRO plan.`)
    console.log('Note: This is a database-only update. No Stripe subscription was created.')

  } catch (error) {
    console.error('\n❌ Error updating subscription:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

// Main execution
async function main() {
  // Use hardcoded business ID or allow override via command line
  const businessId = process.argv[2] || PRO_BUSINESS_ID

  await updateBusinessSubscription(businessId)
}

// Run the script
main()
  .then(() => {
    console.log('\n✅ Script completed successfully')
    process.exit(0)
  })
  .catch((error) => {
    console.error('\n❌ Script failed:', error)
    process.exit(1)
  })
