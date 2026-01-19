# Database Migration: FREE → STARTER

## Overview
This document explains how to migrate the database from `FREE` to `STARTER` plan enum values.

## Prisma Schema Changes
The Prisma schema has been updated:
- `enum SubscriptionPlan { FREE PRO }` → `enum SubscriptionPlan { STARTER PRO }`
- Default values changed from `@default(FREE)` to `@default(STARTER)`

## Database Migration Steps

### Option 1: MongoDB Direct Update (Recommended)

Since this is MongoDB, you can directly update the database:

```javascript
// Connect to your MongoDB database
// Then run these update commands:

// Update User collection
db.users.updateMany(
  { plan: "FREE" },
  { $set: { plan: "STARTER" } }
)

// Update Business collection
db.businesses.updateMany(
  { subscriptionPlan: "FREE" },
  { $set: { subscriptionPlan: "STARTER" } }
)

// Update Subscription collection
db.subscriptions.updateMany(
  { plan: "FREE" },
  { $set: { plan: "STARTER" } }
)
```

### Option 2: Using MongoDB Compass or Studio 3T

1. Open MongoDB Compass or Studio 3T
2. Connect to your database
3. Navigate to each collection:
   - `users` - Find documents with `plan: "FREE"` and change to `"STARTER"`
   - `businesses` - Find documents with `subscriptionPlan: "FREE"` and change to `"STARTER"`
   - `subscriptions` - Find documents with `plan: "FREE"` and change to `"STARTER"`

### Option 3: Using a Migration Script

Create a script file `scripts/migrate-free-to-starter.ts`:

```typescript
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('Starting migration: FREE → STARTER')
  
  // Update Users
  const usersUpdated = await prisma.user.updateMany({
    where: { plan: 'FREE' },
    data: { plan: 'STARTER' }
  })
  console.log(`Updated ${usersUpdated.count} users`)
  
  // Update Businesses
  const businessesUpdated = await prisma.business.updateMany({
    where: { subscriptionPlan: 'FREE' },
    data: { subscriptionPlan: 'STARTER' }
  })
  console.log(`Updated ${businessesUpdated.count} businesses`)
  
  // Update Subscriptions
  const subscriptionsUpdated = await prisma.subscription.updateMany({
    where: { plan: 'FREE' },
    data: { plan: 'STARTER' }
  })
  console.log(`Updated ${subscriptionsUpdated.count} subscriptions`)
  
  console.log('Migration completed!')
}

main()
  .catch((e) => {
    console.error('Migration failed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
```

Then run:
```bash
npx tsx scripts/migrate-free-to-starter.ts
```

## After Migration

1. **Regenerate Prisma Client:**
   ```bash
   npx prisma generate
   ```

2. **Verify the migration:**
   - Check that all `FREE` values have been changed to `STARTER`
   - Test the application to ensure everything works correctly

3. **Update Environment Variables (if needed):**
   - If you have `STRIPE_FREE_PRICE_ID`, consider renaming it to `STRIPE_STARTER_PRICE_ID` for clarity

## Important Notes

- **Backup your database** before running the migration
- The enum change in Prisma schema requires regenerating the Prisma client
- All code references have been updated from `'FREE'` to `'STARTER'`
- The migration is safe to run multiple times (it will only update documents that still have `FREE`)

## Verification Queries

After migration, verify with these queries:

```javascript
// Check for any remaining FREE values
db.users.find({ plan: "FREE" }).count()
db.businesses.find({ subscriptionPlan: "FREE" }).count()
db.subscriptions.find({ plan: "FREE" }).count()

// Should all return 0
```
