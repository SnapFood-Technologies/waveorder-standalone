# Marketplace Infrastructure: ByBest Shop Model

## Overview

WaveOrder supports a **marketplace model** where one business (the **originator**) can display and sell products from multiple connected businesses (the **suppliers**). This document explains how this infrastructure works using **ByBest Shop** as a real-world example.

---

## Real-World Example: ByBest Shop

### Business Structure

```
ByBest Shop (Originator/Marketplace)
├── Own Products
├── Villeroy & Boch Products (Supplier)
├── Swarovski Products (Supplier)
├── Swatch Products (Supplier)
└── Other Suppliers...
```

**ByBest Shop** operates as a multi-brand marketplace, similar to:
- **Etsy** (marketplace with multiple sellers)
- **Amazon Marketplace** (platform showing products from third-party sellers)
- **Shopify Collective** (stores curating products from partner brands)

---

## Key Concepts

### 1. Originator (Marketplace Owner)

**ByBest Shop** is the **originator**:
- Has `connectedBusinesses: ["villeroy-boch-id", "swarovski-id", "swatch-id", ...]`
- Can see and manage products, categories, brands, collections, and groups from all connected suppliers
- Displays all products on its storefront in a unified catalog
- Customers place orders through ByBest Shop's storefront

### 2. Suppliers (Connected Businesses)

**Villeroy & Boch, Swarovski, Swatch** are **suppliers**:
- Have `connectedBusinesses: []` (empty array - one-way relationship)
- Only see and manage their own products, categories, brands, collections, and groups
- Cannot see ByBest Shop's data or other suppliers' data
- Their products appear on ByBest Shop's storefront when synced

---

## One-Way Relationship Model

### How It Works

```
┌─────────────────────────────────────────────┐
│  ByBest Shop (ORIGINATOR)                   │
│  connectedBusinesses: [                     │
│    "villeroy-boch-id",                      │
│    "swarovski-id",                          │
│    "swatch-id"                              │
│  ]                                           │
│  "I want to import products from these"     │
└─────────────────────────────────────────────┘
         │                │                │
         │ imports        │ imports        │ imports
         │ from           │ from           │ from
         ▼                ▼                ▼
┌──────────────┐  ┌──────────────┐  ┌──────────────┐
│ Villeroy &   │  │ Swarovski    │  │ Swatch       │
│ Boch         │  │              │  │              │
│ (Supplier)   │  │ (Supplier)   │  │ (Supplier)   │
│              │  │              │  │              │
│ connected-   │  │ connected-   │  │ connected-   │
│ Businesses:  │  │ Businesses:  │  │ Businesses:  │
│ []           │  │ []           │  │ []           │
└──────────────┘  └──────────────┘  └──────────────┘
```

**Important Rules:**
- ✅ ByBest Shop can see Villeroy & Boch, Swarovski, and Swatch products
- ❌ Villeroy & Boch, Swarovski, Swatch CANNOT see ByBest Shop's products
- ❌ Suppliers cannot see each other's products
- ✅ It's a supplier relationship, not a partnership

---

## Database Architecture

### Business Model

```prisma
model Business {
  id                  String   @id @default(auto()) @map("_id") @db.ObjectId
  name                String
  slug                String   @unique
  connectedBusinesses String[] @db.ObjectId  // Array of supplier IDs
  // ... other fields
}
```

**Example:**
- **ByBest Shop**: `connectedBusinesses: ["villeroy-boch-id", "swarovski-id", "swatch-id"]`
- **Swatch**: `connectedBusinesses: []` (empty)
- **Swarovski**: `connectedBusinesses: []` (empty)
- **Villeroy & Boch**: `connectedBusinesses: []` (empty)

### Product Model

```prisma
model Product {
  id                  String   @id @default(auto()) @map("_id") @db.ObjectId
  name                String
  businessId          String   @db.ObjectId  // Which business owns this product
  connectedBusinesses String[] @db.ObjectId  // Which originators can see this product
  categoryId          String   @db.ObjectId
  brandId             String?  @db.ObjectId
  collectionIds       String[] @db.ObjectId
  groupIds            String[] @db.ObjectId
  // ... other fields
}
```

**Example:**
- **Swatch Product**: 
  - `businessId: "swatch-id"` (owned by Swatch)
  - `connectedBusinesses: ["bybest-shop-id"]` (visible to ByBest Shop)
  - `categoryId: "watches-category-id"`
  - `brandId: "swatch-brand-id"`

---

## How Products Flow

### 1. External Sync (Swatch Syncs Products)

When **Swatch** syncs products from their external system:

```typescript
// 1. Find originators that want Swatch's products
const originators = await prisma.business.findMany({
  where: { connectedBusinesses: { has: "swatch-id" } }
})
// Result: [ByBest Shop]

// 2. Create/update products with connectedBusinesses
await prisma.product.create({
  data: {
    businessId: "swatch-id",
    connectedBusinesses: ["bybest-shop-id"],  // ByBest can see this
    name: "Swatch Watch",
    categoryId: "watches-category-id",
    brandId: "swatch-brand-id",
    // ... other fields
  }
})
```

**Result:**
- Product is owned by Swatch (`businessId: "swatch-id"`)
- Product is visible to ByBest Shop (`connectedBusinesses: ["bybest-shop-id"]`)
- ByBest Shop can see and sell this product on their storefront

### 2. Category/Brand/Collection/Group Sync

When syncing, all entities get the same `connectedBusinesses`:

```typescript
// Categories
await prisma.category.create({
  data: {
    businessId: "swatch-id",
    connectedBusinesses: ["bybest-shop-id"],
    name: "Watches",
    // ...
  }
})

// Brands
await prisma.brand.create({
  data: {
    businessId: "swatch-id",
    connectedBusinesses: ["bybest-shop-id"],
    name: "Swatch",
    // ...
  }
})

// Collections
await prisma.collection.create({
  data: {
    businessId: "swatch-id",
    connectedBusinesses: ["bybest-shop-id"],
    name: "The Eyes",
    // ...
  }
})

// Groups
await prisma.group.create({
  data: {
    businessId: "swatch-id",
    connectedBusinesses: ["bybest-shop-id"],
    name: "WOMEN",
    // ...
  }
})
```

---

## Admin Views

### ByBest Shop Admin (Originator)

When **ByBest Shop** views their admin:

#### Products (`/api/admin/stores/bybest-shop-id/products`)
```typescript
const products = await prisma.product.findMany({
  where: {
    OR: [
      { businessId: "bybest-shop-id" },           // ByBest's own products
      { businessId: { in: ["villeroy-boch-id", "swarovski-id", "swatch-id"] } }  // Suppliers' products
    ]
  },
  include: {
    business: { select: { id: true, name: true } }  // Shows badge: "Swatch", "Swarovski", etc.
  }
})
```

**Result:** ByBest sees:
- Their own products
- Villeroy & Boch products (with badge)
- Swarovski products (with badge)
- Swatch products (with badge)

#### Categories (`/api/admin/stores/bybest-shop-id/categories`)
```typescript
const categories = await prisma.category.findMany({
  where: {
    OR: [
      { businessId: "bybest-shop-id" },
      { businessId: { in: ["villeroy-boch-id", "swarovski-id", "swatch-id"] } }
    ]
  }
})
```

**Result:** ByBest sees:
- Their own categories
- Villeroy & Boch categories
- Swarovski categories
- Swatch categories (Watches, Gifts, Jewelry, etc.)

#### Brands (`/api/admin/stores/bybest-shop-id/brands`)
```typescript
const brands = await prisma.brand.findMany({
  where: {
    OR: [
      { businessId: "bybest-shop-id" },
      { businessId: { in: ["villeroy-boch-id", "swarovski-id", "swatch-id"] } }
    ]
  }
})
```

**Result:** ByBest sees:
- Their own brands
- Villeroy & Boch brand
- Swarovski brand
- Swatch brand

#### Collections (`/api/admin/stores/bybest-shop-id/collections`)
```typescript
const collections = await prisma.collection.findMany({
  where: {
    OR: [
      { businessId: "bybest-shop-id" },
      { businessId: { in: ["villeroy-boch-id", "swarovski-id", "swatch-id"] } }
    ]
  }
})
```

**Result:** ByBest sees all collections from all suppliers.

#### Groups (`/api/admin/stores/bybest-shop-id/groups`)
```typescript
const groups = await prisma.group.findMany({
  where: {
    OR: [
      { businessId: "bybest-shop-id" },
      { businessId: { in: ["villeroy-boch-id", "swarovski-id", "swatch-id"] } }
    ]
  }
})
```

**Result:** ByBest sees all groups from all suppliers (WOMEN, MEN, KIDS, etc. from Swatch).

### Swatch Admin (Supplier)

When **Swatch** views their admin:

#### Products (`/api/admin/stores/swatch-id/products`)
```typescript
const products = await prisma.product.findMany({
  where: {
    OR: [
      { businessId: "swatch-id" },
      { businessId: { in: [] } }  // Empty - no connected businesses
    ]
  }
})
// Simplified to: { businessId: "swatch-id" }
```

**Result:** Swatch sees ONLY their own products (914 products).

#### Categories (`/api/admin/stores/swatch-id/categories`)
```typescript
const categories = await prisma.category.findMany({
  where: {
    OR: [
      { businessId: "swatch-id" },
      { businessId: { in: [] } }  // Empty
    ]
  }
})
```

**Result:** Swatch sees ONLY their own categories (Watches, Gifts, Jewelry, etc.).

#### Brands (`/api/admin/stores/swatch-id/brands`)
```typescript
const brands = await prisma.brand.findMany({
  where: {
    OR: [
      { businessId: "swatch-id" },
      { businessId: { in: [] } }  // Empty
    ]
  }
})
```

**Result:** Swatch sees ONLY their own brand (Swatch).

**Same pattern for Collections and Groups** - Swatch only sees their own data.

---

## Product Counts Logic

### For Originator (ByBest Shop)

When counting products for a category/brand/collection/group:

```typescript
const productCount = await prisma.product.count({
  where: {
    OR: [
      { businessId: "bybest-shop-id" },           // ByBest's products
      { businessId: { in: ["villeroy-boch-id", "swarovski-id", "swatch-id"] } }  // Suppliers' products
    ],
    categoryId: "watches-category-id"  // Or brandId, collectionIds, groupIds
  }
})
```

**Result:** Counts products from ByBest + all suppliers.

### For Supplier (Swatch)

When counting products for a category/brand/collection/group:

```typescript
const productCount = await prisma.product.count({
  where: {
    OR: [
      { businessId: "swatch-id" },
      { businessId: { in: [] } }  // Empty
    ],
    categoryId: "watches-category-id"  // Or brandId, collectionIds, groupIds
  }
})
// Simplified to: { businessId: "swatch-id", categoryId: "watches-category-id" }
```

**Result:** Counts ONLY Swatch's products.

---

## Storefront Behavior

### ByBest Shop Storefront (`/api/storefront/bybest-shop`)

When customers visit **ByBest Shop's storefront**:

```typescript
const businessIds = ["bybest-shop-id", "villeroy-boch-id", "swarovski-id", "swatch-id"]

const products = await prisma.product.findMany({
  where: {
    businessId: { in: businessIds },  // All businesses
    isActive: true,
    price: { gt: 0 }
  }
})
```

**Result:** Customers see:
- ByBest Shop's products
- Villeroy & Boch products
- Swarovski products
- Swatch products (914 products)

All products appear in a **unified catalog** with consistent pricing and ordering.

### Swatch Storefront (`/api/storefront/swatch`)

When customers visit **Swatch's storefront**:

```typescript
const businessIds = ["swatch-id"]  // Only Swatch

const products = await prisma.product.findMany({
  where: {
    businessId: "swatch-id",  // Only Swatch
    isActive: true,
    price: { gt: 0 }
  }
})
```

**Result:** Customers see ONLY Swatch's products (914 products).

---

## Data Flow Summary

### 1. External Sync (Swatch → ByBest)

```
Swatch External System
    ↓ (sync)
Swatch Products Created/Updated
    ↓ (connectedBusinesses: ["bybest-shop-id"])
ByBest Shop Can See Products
    ↓ (storefront query)
Customers See Products on ByBest Storefront
```

### 2. Product Assignment

**Swatch Product:**
- `businessId: "swatch-id"` → Owned by Swatch
- `connectedBusinesses: ["bybest-shop-id"]` → Visible to ByBest
- `categoryId: "watches-id"` → In Swatch's "Watches" category
- `brandId: "swatch-brand-id"` → Swatch brand
- `collectionIds: ["the-eyes-id"]` → In "The Eyes" collection
- `groupIds: ["women-id"]` → In "WOMEN" group

**ByBest Shop View:**
- Sees product in admin with badge "Swatch"
- Sees "Watches" category (from Swatch)
- Sees "Swatch" brand
- Sees "The Eyes" collection
- Sees "WOMEN" group
- Product appears on storefront

**Swatch View:**
- Sees product in admin (no badge - it's their own)
- Sees "Watches" category
- Sees "Swatch" brand
- Sees "The Eyes" collection
- Sees "WOMEN" group
- Product appears on their storefront

---

## Key Rules

### 1. One-Way Relationship
- ✅ Originator (ByBest) sees suppliers' data
- ❌ Suppliers (Swatch, Swarovski, Villeroy & Boch) do NOT see originator's data
- ❌ Suppliers do NOT see each other's data

### 2. Data Ownership
- Products are **owned** by the supplier (`businessId: "swatch-id"`)
- Products are **visible** to originator (`connectedBusinesses: ["bybest-shop-id"]`)
- Categories, brands, collections, groups follow the same pattern

### 3. Admin Views
- **Originator Admin**: Sees all data (own + suppliers) with badges
- **Supplier Admin**: Sees only own data (no badges needed)

### 4. Storefront Views
- **Originator Storefront**: Shows all products (unified catalog)
- **Supplier Storefront**: Shows only own products

### 5. Product Counts
- **Originator**: Counts products from own + all suppliers
- **Supplier**: Counts only own products

---

## Example: Swatch Products on ByBest Shop

### Swatch Has:
- **914 products** (watches, jewelry, accessories)
- **12 categories** (Watches, Gifts, Jewelry, The Eyes, etc.)
- **1 brand** (Swatch)
- **7 collections** (The Eyes, big bold, irony chrono, etc.)
- **11 groups** (WOMEN: 773, MEN: 648, KIDS: 35, etc.)

### ByBest Shop Sees:
- **All 914 Swatch products** (plus their own + other suppliers)
- **All 12 Swatch categories** (plus their own + other suppliers)
- **Swatch brand** (plus their own + other suppliers)
- **All 7 Swatch collections** (plus their own + other suppliers)
- **All 11 Swatch groups** (plus their own + other suppliers)

### Swatch Sees:
- **Only their 914 products**
- **Only their 12 categories**
- **Only their Swatch brand**
- **Only their 7 collections**
- **Only their 11 groups**

---

## API Endpoints Behavior

### For Originator (ByBest Shop)

**GET `/api/admin/stores/bybest-shop-id/products`**
- Returns: ByBest products + Villeroy & Boch + Swarovski + Swatch products
- Each product includes `business` object for badge display

**GET `/api/admin/stores/bybest-shop-id/categories`**
- Returns: All categories from all businesses
- Product counts include products from all businesses

**GET `/api/admin/stores/bybest-shop-id/brands`**
- Returns: All brands from all businesses
- Product counts include products from all businesses

**GET `/api/admin/stores/bybest-shop-id/collections`**
- Returns: All collections from all businesses
- Product counts include products from all businesses

**GET `/api/admin/stores/bybest-shop-id/groups`**
- Returns: All groups from all businesses
- Product counts include products from all businesses

### For Supplier (Swatch)

**GET `/api/admin/stores/swatch-id/products`**
- Returns: Only Swatch products (914 products)

**GET `/api/admin/stores/swatch-id/categories`**
- Returns: Only Swatch categories (12 categories)
- Product counts: Only Swatch products

**GET `/api/admin/stores/swatch-id/brands`**
- Returns: Only Swatch brand (1 brand)
- Product count: Only Swatch products (500 products with Swatch brand)

**GET `/api/admin/stores/swatch-id/collections`**
- Returns: Only Swatch collections (7 collections)
- Product counts: Only Swatch products

**GET `/api/admin/stores/swatch-id/groups`**
- Returns: Only Swatch groups (11 groups)
- Product counts: Only Swatch products

---

## Storefront API Behavior

### ByBest Shop Storefront

**GET `/api/storefront/bybest-shop`**
- Returns storefront data with products from all businesses
- Categories include counts from all businesses
- Unified catalog experience

**GET `/api/storefront/bybest-shop/products`**
- Returns products from: ByBest + Villeroy & Boch + Swarovski + Swatch
- Filtering/search works across all products
- Customers can filter by any supplier's categories/brands/collections/groups

### Swatch Storefront

**GET `/api/storefront/swatch`**
- Returns storefront data with only Swatch products
- Categories include counts from only Swatch
- Swatch-only catalog

**GET `/api/storefront/swatch/products`**
- Returns only Swatch products (914 products)
- Filtering/search works only within Swatch products

---

## Summary

### ByBest Shop (Originator)
- **Role**: Marketplace owner
- **Connected Businesses**: [Villeroy & Boch, Swarovski, Swatch, ...]
- **Can See**: Own data + all suppliers' data
- **Storefront**: Unified catalog with all products
- **Admin**: Manages all products with supplier badges

### Swatch (Supplier)
- **Role**: Product supplier
- **Connected Businesses**: [] (empty)
- **Can See**: Only own data
- **Storefront**: Only own products
- **Admin**: Manages only own products (no badges)

### Key Principle
**One-way relationship**: Originator imports from suppliers, but suppliers remain independent and cannot see originator's data or other suppliers' data.

---

## Benefits

1. **Unified Catalog**: ByBest Shop customers see all products in one place
2. **Supplier Independence**: Swatch, Swarovski, Villeroy & Boch maintain their own stores
3. **Data Isolation**: Suppliers cannot see each other's data
4. **Flexible Management**: ByBest can manage all products, suppliers manage only their own
5. **Scalable**: Easy to add more suppliers to ByBest Shop's marketplace

---

**Status**: ✅ **Production Ready**

**Example**: ByBest Shop successfully operates as a multi-brand marketplace, displaying products from Swatch (914 products), Swarovski, Villeroy & Boch, and other suppliers with a unified shopping experience.
