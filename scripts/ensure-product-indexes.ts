/**
 * Script to ensure MongoDB indexes exist for Product and ProductVariant collections
 * This script creates indexes that are critical for storefront product query performance
 * 
 * Uses Prisma's $runCommandRaw to avoid needing the mongodb package dependency
 * 
 * Run with: npx tsx scripts/ensure-product-indexes.ts
 * Or: yarn tsx scripts/ensure-product-indexes.ts
 */

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function ensureIndexes() {
  try {
    console.log('🔍 Connecting to MongoDB via Prisma...')
    console.log('📊 Ensuring indexes for Product and ProductVariant collections...\n')

    // Product collection indexes
    console.log('📦 Creating Product collection indexes...')
    
    // Single field indexes
    await prisma.$runCommandRaw({
      createIndexes: 'Product',
      indexes: [
        { key: { businessId: 1 }, name: 'businessId_1' },
        { key: { categoryId: 1 }, name: 'categoryId_1' },
        { key: { brandId: 1 }, name: 'brandId_1' },
        // Compound indexes
        { key: { businessId: 1, isActive: 1 }, name: 'businessId_1_isActive_1' },
        { key: { businessId: 1, isActive: 1, price: 1 }, name: 'businessId_1_isActive_1_price_1' },
        { key: { businessId: 1, categoryId: 1, isActive: 1 }, name: 'businessId_1_categoryId_1_isActive_1' },
        { key: { businessId: 1, isActive: 1, featured: 1 }, name: 'businessId_1_isActive_1_featured_1' },
        { key: { businessId: 1, isActive: 1, price: 1, name: 1 }, name: 'businessId_1_isActive_1_price_1_name_1' }
      ]
    })
    console.log('  ✅ All Product indexes created')

    // ProductVariant collection indexes
    console.log('📦 Creating ProductVariant collection indexes...')
    
    await prisma.$runCommandRaw({
      createIndexes: 'ProductVariant',
      indexes: [
        { key: { productId: 1 }, name: 'productId_1' }
      ]
    })
    console.log('  ✅ All ProductVariant indexes created')

    console.log('\n✅ All indexes created successfully!')
    console.log('📈 Storefront product queries should now be significantly faster.\n')

  } catch (error: any) {
    console.error('❌ Error creating indexes:', error)
    
    // If indexes already exist, MongoDB returns an error but that's okay
    if (error.message?.includes('already exists') || error.code === 85 || error.code === 86) {
      console.log('\n⚠️  Some indexes may already exist (this is normal)')
      console.log('✅ Script completed - existing indexes are preserved\n')
    } else {
      console.error('\n💡 If you see connection errors, check your DATABASE_URL environment variable\n')
      process.exit(1)
    }
  } finally {
    await prisma.$disconnect()
    process.exit(0)
  }
}

// Run the script
ensureIndexes()
