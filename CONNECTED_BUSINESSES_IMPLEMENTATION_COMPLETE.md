# Connected Businesses Implementation - Complete

## ✅ COMPLETED TASKS:

### 1. **Connections API** - ONE-WAY Relationships
**File:** `/src/app/api/superadmin/businesses/[businessId]/connections/route.ts`
- ✅ Removed bidirectional logic from POST (connect)
- ✅ Removed bidirectional logic from DELETE (disconnect)
- ✅ Only updates the originating business's `connectedBusinesses` array

### 2. **Admin API Routes** - Include Connected Business Entities
Updated all admin API routes to fetch entities from both own business and connected businesses:

- ✅ **Products** (`/api/admin/stores/[businessId]/products/route.ts`)
- ✅ **Categories** (`/api/admin/stores/[businessId]/categories/route.ts`)
- ✅ **Brands** (`/api/admin/stores/[businessId]/brands/route.ts`)
- ✅ **Collections** (`/api/admin/stores/[businessId]/collections/route.ts`)
- ✅ **Groups** (`/api/admin/stores/[businessId]/groups/route.ts`)

**Query Pattern:**
```typescript
// Fetch connected businesses
const business = await prisma.business.findUnique({
  where: { id: businessId },
  select: { connectedBusinesses: true }
})

// Query entities from own + connected businesses
const entities = await prisma.entity.findMany({
  where: {
    OR: [
      { businessId: businessId },
      { businessId: { in: business?.connectedBusinesses || [] } }
    ]
  },
  include: {
    business: { select: { id: true, name: true } }
  }
})
```

### 3. **Admin UI** - Show Business Owner Badge
Updated all admin UI components to show which business owns each entity:

- ✅ **Products** (`/components/admin/products/ProductsManagement.tsx`)
- ✅ **Categories** (`/components/admin/categories/CategoriesManagement.tsx`)
- ✅ **Brands** (`/app/admin/stores/[businessId]/brands/page.tsx`)
- ✅ **Collections** (`/app/admin/stores/[businessId]/collections/page.tsx`)
- ✅ **Groups** (`/app/admin/stores/[businessId]/groups/page.tsx`)

**UI Pattern:**
```tsx
{entity.business.id !== businessId && (
  <span className="px-2 py-0.5 text-xs font-medium bg-blue-100 text-blue-800 rounded">
    {entity.business.name}
  </span>
)}
```

---

## 🚧 PENDING TASKS:

### 4. **Storefront API** - Show Products from Connected Businesses
**File:** `/src/app/api/storefront/[slug]/route.ts`

**Current Implementation (Line 149-197):**
```typescript
const business = await prisma.business.findUnique({
  where: { slug, isActive: true, setupWizardCompleted: true },
  include: {
    categories: {
      where: { isActive: true },
      include: {
        products: {
          where: { isActive: true },
          include: { variants: true, modifiers: true }
        }
      }
    }
  }
})
```

**NEEDED CHANGES:**
```typescript
// Step 1: Fetch business with connectedBusinesses
const business = await prisma.business.findUnique({
  where: { slug, isActive: true, setupWizardCompleted: true },
  select: {
    id: true,
    connectedBusinesses: true,
    // ... all other business fields
  }
})

// Step 2: Fetch categories from own + connected businesses
const categories = await prisma.category.findMany({
  where: {
    OR: [
      { businessId: business.id },
      { businessId: { in: business.connectedBusinesses || [] } }
    ],
    isActive: true
  },
  include: {
    parent: { ... },
    children: { ... },
    products: {
      where: {
        OR: [
          { businessId: business.id },
          { businessId: { in: business.connectedBusinesses || [] } }
        ],
        isActive: true,
        price: { gt: 0 } // Don't show zero-price products
      },
      include: { variants: true, modifiers: true }
    }
  }
})

// Step 3: Attach categories to business object
business.categories = categories
```

### 5. **External Sync** - Set `connectedBusinesses` During Sync
**File:** `/src/app/api/superadmin/businesses/[businessId]/external-syncs/[syncId]/sync/route.ts`

**NEEDED CHANGES:**

#### A. Fetch business with connections (around line 68):
```typescript
const business = await prisma.business.findUnique({
  where: { id: businessId },
  select: { 
    id: true, 
    name: true,
    connectedBusinesses: true  // ← ADD THIS!
  }
})
```

#### B. Update Categories (in `processExternalProduct` function, around line 493):
```typescript
const categoryData: any = {
  businessId,
  name: categoryNameEn,
  nameAl: categoryNameSq || categoryNameEn || null,
  parentId: parentCategoryId,
  sortOrder: 0,
  isActive: true,
  connectedBusinesses: business?.connectedBusinesses || []  // ← ADD THIS!
}
```

#### C. Update Products (around line 658):
```typescript
const productData: any = {
  businessId,
  categoryId,
  name: productNameEn,
  // ... all other product fields ...
  connectedBusinesses: business?.connectedBusinesses || [],  // ← ADD THIS!
  metadata: productMetadata
}
```

#### D. Handle Brands (NEW - when `brand_info` exists in external product):
```typescript
// Extract brand from external product
if (externalProduct.brand_info && externalProduct.brand_info.id) {
  const externalBrandId = externalProduct.brand_info.id.toString()
  const brandNames = extractName(externalProduct.brand_info.name)
  
  // Find or create brand
  let brand = await prisma.brand.findFirst({
    where: {
      businessId,
      metadata: {
        path: ['externalBrandId'],
        equals: externalBrandId
      }
    }
  })
  
  if (!brand) {
    brand = await prisma.brand.create({
      data: {
        businessId,
        name: brandNames.en || 'Unknown Brand',
        nameAl: brandNames.sq || brandNames.en || null,
        sortOrder: 0,
        isActive: true,
        connectedBusinesses: business?.connectedBusinesses || [],  // ← ADD THIS!
        metadata: {
          externalBrandId: externalBrandId,
          externalSyncId: syncId,
          externalData: externalProduct.brand_info
        }
      }
    })
  } else {
    // Update existing brand
    await prisma.brand.update({
      where: { id: brand.id },
      data: {
        connectedBusinesses: business?.connectedBusinesses || []  // ← OVERWRITE!
      }
    })
  }
  
  // Add brandId to productData
  productData.brandId = brand.id
}
```

#### E. Handle Collections (NEW - when `collections` exists in external product):
```typescript
// Extract collections from external product
const collectionIds: string[] = []
if (Array.isArray(externalProduct.collections) && externalProduct.collections.length > 0) {
  for (const extCollection of externalProduct.collections) {
    if (typeof extCollection === 'string') {
      // Handle string format (collection name only)
      const collectionName = extCollection
      
      let collection = await prisma.collection.findFirst({
        where: {
          businessId,
          name: collectionName
        }
      })
      
      if (!collection) {
        collection = await prisma.collection.create({
          data: {
            businessId,
            name: collectionName,
            sortOrder: 0,
            isActive: true,
            featured: false,
            connectedBusinesses: business?.connectedBusinesses || []  // ← ADD THIS!
          }
        })
      } else {
        await prisma.collection.update({
          where: { id: collection.id },
          data: {
            connectedBusinesses: business?.connectedBusinesses || []  // ← OVERWRITE!
          }
        })
      }
      
      collectionIds.push(collection.id)
    } else if (typeof extCollection === 'object' && extCollection.name) {
      // Handle object format with id
      const externalCollectionId = extCollection.id?.toString()
      const collectionNames = extractName(extCollection.name)
      
      let collection = await prisma.collection.findFirst({
        where: {
          businessId,
          ...(externalCollectionId && {
            metadata: {
              path: ['externalCollectionId'],
              equals: externalCollectionId
            }
          })
        }
      })
      
      if (!collection) {
        collection = await prisma.collection.create({
          data: {
            businessId,
            name: collectionNames.en || 'Unnamed Collection',
            nameAl: collectionNames.sq || collectionNames.en || null,
            sortOrder: 0,
            isActive: true,
            featured: false,
            connectedBusinesses: business?.connectedBusinesses || [],  // ← ADD THIS!
            ...(externalCollectionId && {
              metadata: {
                externalCollectionId: externalCollectionId,
                externalSyncId: syncId,
                externalData: extCollection
              }
            })
          }
        })
      } else {
        await prisma.collection.update({
          where: { id: collection.id },
          data: {
            connectedBusinesses: business?.connectedBusinesses || []  // ← OVERWRITE!
          }
        })
      }
      
      collectionIds.push(collection.id)
    }
  }
}

// Add collectionIds to productData
if (collectionIds.length > 0) {
  productData.collectionIds = collectionIds
}
```

#### F. Handle Groups (NEW - when `groups` exists in external product):
```typescript
// Extract groups from external product
const groupIds: string[] = []
if (Array.isArray(externalProduct.groups) && externalProduct.groups.length > 0) {
  for (const extGroup of externalProduct.groups) {
    const externalGroupId = extGroup.id?.toString()
    const groupNames = extractName(extGroup.name)
    
    let group = await prisma.group.findFirst({
      where: {
        businessId,
        metadata: {
          path: ['externalGroupId'],
          equals: externalGroupId
        }
      }
    })
    
    if (!group) {
      group = await prisma.group.create({
        data: {
          businessId,
          name: groupNames.en || 'Unnamed Group',
          nameAl: groupNames.sq || groupNames.en || null,
          sortOrder: 0,
          isActive: true,
          connectedBusinesses: business?.connectedBusinesses || [],  // ← ADD THIS!
          metadata: {
            externalGroupId: externalGroupId,
            externalSyncId: syncId,
            externalData: extGroup
          }
        }
      })
    } else {
      await prisma.group.update({
        where: { id: group.id },
        data: {
          connectedBusinesses: business?.connectedBusinesses || []  // ← OVERWRITE!
        }
      })
    }
    
    groupIds.push(group.id)
  }
}

// Add groupIds to productData
if (groupIds.length > 0) {
  productData.groupIds = groupIds
}
```

---

## SUMMARY:

**✅ COMPLETED (3/5):**
1. Connections API - One-way relationships
2. Admin API routes - Include connected business entities
3. Admin UI - Show business owner badge

**🚧 PENDING (2/5):**
4. Storefront API - Show products from connected businesses
5. External Sync - Set `connectedBusinesses` during sync (for products, categories, brands, collections, groups)

**NEXT STEPS:**
1. Update storefront API route to fetch categories/products from connected businesses
2. Update external sync to set `connectedBusinesses` for all entities
3. Sync brands, collections, and groups from external system during sync
