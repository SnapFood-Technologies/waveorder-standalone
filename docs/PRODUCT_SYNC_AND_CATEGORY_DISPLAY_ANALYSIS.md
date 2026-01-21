# Product Sync with OmniStack Gateway & Category Display Analysis

## Overview
This document analyzes how WaveOrder handles:
1. Product synchronization with OmniStack Gateway
2. Product variations and stock management
3. Simple vs variable products
4. Category display logic in the storefront

---

## 1. OmniStack Gateway Product Sync

### Architecture
- **Location**: `src/lib/omnigateway.ts`
- **Sync Trigger**: Automatic background sync after product create/update operations
- **API Endpoint**: `PUT /store-products/{productId}/waveorder-update`

### Product Identification Priority
When syncing a product to OmniStack Gateway, the system uses this priority order:

1. **`metadata.externalProductId`** (highest priority)
   - Used when product is linked to an external system
   - Stored in `Product.metadata.externalProductId`

2. **`SKU`** (fallback)
   - OmniStack Gateway can find products by SKU
   - Used if `externalProductId` is not available

3. **WaveOrder Internal ID** (last resort)
   - Used if neither `externalProductId` nor `SKU` exists
   - Less reliable for matching

### Sync Process Flow

```typescript
// 1. Product Create/Update in Admin
POST/PUT /api/admin/stores/[businessId]/products/[productId]

// 2. After successful DB operation, trigger background sync
syncProductToOmniGateway(product).catch(err => {
  console.error('[OmniGateway] Background sync failed:', err);
});

// 3. Prepare product data for OmniStack format
prepareProductForOmniGateway(product)

// 4. Send update to OmniStack Gateway
updateProductInOmniGateway(productId, updateData, clientApiKey)
```

### Key Functions

#### `prepareProductForOmniGateway(product)`
Converts WaveOrder product format to OmniStack Gateway format:

**Simple Products:**
- Sets `productType: 'simple'`
- Includes: name, description, price, stock, images, category
- Calculates `stockStatus`: `'instock'` if `trackInventory && stock > 0`, else `'outofstock'`

**Variable Products (with variants):**
- Sets `productType: 'variable'`
- Includes all simple product fields
- Adds `variations[]` array with variant details

#### `syncProductToOmniGateway(product, clientApiKey?)`
- Wraps `prepareProductForOmniGateway` and `updateProductInOmniGateway`
- Returns `null` if product cannot be identified (no ID, no SKU, no externalProductId)
- Errors are logged but don't break the main flow

---

## 2. Product Variations & Stock Handling

### Product Types

#### Simple Products
- **Definition**: Products without variants (`variants.length === 0`)
- **Stock Management**:
  - Stock tracked at product level (`Product.stock`)
  - Stock status calculated: `trackInventory && stock > 0 ? 'instock' : 'outofstock'`
  - Price stored at product level (`Product.price`)

#### Variable Products
- **Definition**: Products with variants (`variants.length > 0`)
- **Stock Management**:
  - Stock tracked at variant level (`ProductVariant.stock`)
  - Each variant has its own stock quantity
  - Variant stock status: `variant.stock > 0 ? 'instock' : 'outofstock'`
  - Price can vary per variant (`ProductVariant.price`)

### Variation Structure

```typescript
interface ProductVariant {
  id: string
  name: string              // e.g., "Small - Red"
  price: number             // Variant-specific price
  stock: number             // Variant-specific stock
  sku?: string              // Optional variant SKU
  metadata?: {
    image?: string
    articleNo?: string
    attributes?: Record<string, string>  // e.g., { "Size": "Small", "Color": "Red" }
    originalPrice?: number
    salePrice?: number
    dateSaleStart?: string
    dateSaleEnd?: string
  }
}
```

### Stock Sync Logic

#### For Simple Products:
```typescript
stockQuantity: product.stock || 0
stockStatus: product.trackInventory && product.stock > 0 ? 'instock' : 'outofstock'
```

#### For Variable Products:
Each variation includes:
```typescript
stockQuantity: variant.stock || 0
stockStatus: variant.stock > 0 ? 'instock' : 'outofstock'
```

### Variation Attributes Extraction

The system extracts variant attributes in this order:

1. **From `variant.metadata.attributes`** (preferred)
   - Structured object: `{ "Size": "Small", "Color": "Red" }`

2. **From variant name** (fallback parsing)
   - Parses names like "Small - Red" or "Size: Small, Color: Red"
   - Splits by `-`, `–`, `—`, or `,`
   - Assumes first part is "Size", second is "Color"
   - If single value, uses `{ "Variant": variant.name }`

### Price Handling

#### Simple Products:
- Regular price: `product.price`
- Sale price: `product.salePrice` (if `product.originalPrice` exists)
- Original price: `product.originalPrice` (if different from current price)

#### Variable Products:
- Each variant can have its own pricing:
  - `variant.price` - Regular price
  - `variant.metadata.salePrice` - Sale price
  - `variant.metadata.originalPrice` - Original price before sale

### Inventory Activity Tracking

When stock changes, the system creates `InventoryActivity` records:

**On Product Create:**
```typescript
if (productData.trackInventory && productData.stock > 0) {
  await prisma.inventoryActivity.create({
    type: 'RESTOCK',
    quantity: productData.stock,
    oldStock: 0,
    newStock: productData.stock,
    reason: 'Initial stock when creating product'
  })
}
```

**On Product Update:**
```typescript
if (productData.trackInventory && currentProduct.stock !== productData.stock) {
  const quantityChange = productData.stock - currentProduct.stock
  await prisma.inventoryActivity.create({
    type: quantityChange > 0 ? 'MANUAL_INCREASE' : 'MANUAL_DECREASE',
    quantity: quantityChange,
    oldStock: currentProduct.stock,
    newStock: productData.stock,
    reason: 'Manual adjustment from product edit'
  })
}
```

### Variant Management During Updates

When updating a product with variants:

1. **Delete all existing variants**:
   ```typescript
   await prisma.productVariant.deleteMany({
     where: { productId }
   })
   ```

2. **Create new variants** (if provided):
   ```typescript
   if (productData.variants && productData.variants.length > 0) {
     await prisma.productVariant.createMany({
       data: productData.variants.map(variant => ({
         productId,
         name: variant.name,
         price: variant.price,
         stock: variant.stock || 0,
         sku: variant.sku || null,
         metadata: variant.image ? { image: variant.image } : undefined
       }))
     })
   }
   ```

**Note**: Variants are completely replaced on each update (delete + recreate pattern).

---

## 3. Category Display Logic in Storefront

### Location
- **Component**: `src/components/storefront/StoreFront.tsx`
- **Category Tabs Section**: Lines ~2881-3050

### Category Structure

```typescript
interface Category {
  id: string
  name: string
  nameAl?: string
  parentId?: string
  hideParentInStorefront?: boolean
  children?: Array<{
    id: string
    name: string
    sortOrder: number
  }>
  products: Product[]
}
```

### Category Separation Logic

```typescript
// Separate parent and child categories
const parentCategories = storeData.categories.filter(cat => !cat.parentId)
const childCategories = storeData.categories.filter(cat => cat.parentId)
```

### Display Rules

#### 1. Parent Category Tabs
**Condition**: `!shouldShowOnlySubcategories`

**Display Logic**:
- Always shows "All" button
- Shows all parent categories in a scrollable horizontal container
- Uses `overflow-x-auto scrollbar-hide` for horizontal scrolling
- Each category button shows product count when searching

**Rendering**:
```tsx
{!shouldShowOnlySubcategories && (
  <div className="flex gap-1 overflow-x-auto scrollbar-hide -mx-4 px-4 md:mx-0 md:px-0">
    <button>All</button>
    {parentCategories.map(category => (
      <button key={category.id}>{category.name}</button>
    ))}
  </div>
)}
```

#### 2. Subcategory Tabs
**Condition**: `shouldShowOnlySubcategories || (selectedParentCategory && currentSubCategories.length > 0)`

**Display Logic**:
- Shows when:
  - Parent is hidden (`shouldShowOnlySubcategories === true`), OR
  - A parent category is selected AND it has subcategories
- Also scrollable horizontally
- Shows "All" button + all subcategories

**Rendering**:
```tsx
{(shouldShowOnlySubcategories || (selectedParentCategory && currentSubCategories.length > 0)) && (
  <div className="flex gap-1 overflow-x-auto scrollbar-hide -mx-4 px-4 md:mx-0 md:px-0">
    <button>All</button>
    {(shouldShowOnlySubcategories ? childCategories : currentSubCategories).map(subcategory => (
      <button key={subcategory.id}>{subcategory.name}</button>
    ))}
  </div>
)}
```

### When Categories Are Hidden

#### `shouldShowOnlySubcategories` Logic:

```typescript
const allCategoriesAreChildren = parentCategories.length === 0 && childCategories.length > 0
const shouldShowOnlySubcategories = allCategoriesAreChildren || 
  (parentCategories.length === 1 && parentCategories[0].hideParentInStorefront)
```

**Categories are hidden when**:
1. **All categories are children** (`parentCategories.length === 0 && childCategories.length > 0`)
   - This happens when the API returns only children (parent was hidden server-side)

2. **Single parent with `hideParentInStorefront === true`**
   - When there's exactly 1 parent category and it has `hideParentInStorefront: true`
   - In this case, only subcategories are shown

### Important Notes

#### Category Count Behavior
**Current Implementation**: 
- Categories are **always shown** in a scrollable container if `!shouldShowOnlySubcategories`
- There is **NO explicit logic** that hides categories when `parentCategories.length === 1`
- The scrollable container (`overflow-x-auto`) handles overflow gracefully

**If you want to hide categories when there's only 1**:
You would need to add a condition like:
```tsx
{!shouldShowOnlySubcategories && parentCategories.length > 1 && (
  <div className="flex gap-1 overflow-x-auto scrollbar-hide">
    {/* category tabs */}
  </div>
)}
```

**Current behavior**: Categories are shown even if there's only 1 parent category (it just won't scroll).

### Scrollable Implementation

Both parent and subcategory tabs use:
- `flex` layout with `gap-1`
- `overflow-x-auto` for horizontal scrolling
- `scrollbar-hide` class to hide scrollbar visually
- `whitespace-nowrap` on buttons to prevent wrapping
- Responsive padding: `-mx-4 px-4 md:mx-0 md:px-0` (negative margin on mobile for edge-to-edge scrolling)

---

## 4. Sync Triggers

### Automatic Sync Points

1. **Product Creation** (`POST /api/admin/stores/[businessId]/products`)
   - After product is created in database
   - Syncs in background (non-blocking)

2. **Product Update** (`PUT /api/admin/stores/[businessId]/products/[productId]`)
   - After product and variants are updated
   - Syncs in background (non-blocking)

3. **Stock Updates** (`POST /api/admin/stores/[businessId]/products/[productId]/inventory`)
   - After inventory activity is recorded
   - May trigger sync (check implementation)

### Sync Payload Structure

#### Simple Product:
```json
{
  "productId": "EXT-PROD-12345",
  "productType": "simple",
  "sku": "SKU-123",
  "name": "Product Name",
  "nameAl": "Product Name",
  "description": "Description",
  "price": 1000,
  "salePrice": null,
  "originalPrice": null,
  "isActive": true,
  "stockQuantity": 50,
  "stockStatus": "instock",
  "featured": false,
  "images": ["url1", "url2"],
  "categoryName": "Category",
  "metadata": {
    "_id": "waveorder-product-id",
    "updatedAt": "2024-01-01T00:00:00.000Z"
  }
}
```

#### Variable Product:
```json
{
  "productId": "EXT-PROD-12345",
  "productType": "variable",
  "sku": "SKU-123",
  "name": "Product Name",
  "price": 1000,
  "variations": [
    {
      "sku": "SKU-123-SMALL-RED",
      "articleNo": "ART-001",
      "price": 1000,
      "salePrice": null,
      "originalPrice": null,
      "stockQuantity": 10,
      "stockStatus": "instock",
      "image": "variant-image-url",
      "attributes": {
        "Size": "Small",
        "Color": "Red"
      },
      "dateSaleStart": null,
      "dateSaleEnd": null
    }
  ],
  "metadata": {
    "_id": "waveorder-product-id",
    "updatedAt": "2024-01-01T00:00:00.000Z"
  }
}
```

---

## 5. Key Implementation Details

### Error Handling
- Sync errors are logged but don't break the main flow
- Uses `.catch()` to handle errors gracefully
- Errors logged with `[OmniGateway]` prefix for easy filtering

### Background Processing
- All syncs run in background (non-blocking)
- Uses `.catch()` to prevent unhandled promise rejections
- Admin operations return immediately after DB operations

### Stock Calculation
- Simple products: Uses `Product.stock`
- Variable products: Uses `ProductVariant.stock` per variant
- Stock status: `'instock'` if stock > 0, else `'outofstock'`
- Respects `trackInventory` flag

### Price Rounding
- All prices are rounded to integers: `Math.round(price)`
- Ensures consistency with OmniStack Gateway format

### Metadata Preservation
- `metadata._id` stores WaveOrder product ID
- `metadata.clientId` stores optional client identifier
- `metadata.updatedAt` tracks last sync timestamp
- External product ID stored in `metadata.externalProductId`

---

## 6. Recommendations

### For Category Display
If you want to hide categories when there's only 1 parent category:

```tsx
{!shouldShowOnlySubcategories && parentCategories.length > 1 && (
  <div className="flex gap-1 overflow-x-auto scrollbar-hide">
    {/* category tabs */}
  </div>
)}
```

### For Product Sync
- Ensure `externalProductId` is properly stored in `metadata` when products are synced from external systems
- Consider adding retry logic for failed syncs
- Add monitoring/alerting for sync failures

### For Stock Management
- Consider adding stock reservation system for cart items
- Add low stock alerts based on `lowStockAlert` threshold
- Implement stock synchronization from external systems

---

## Summary

1. **Product Sync**: Automatic background sync to OmniStack Gateway after create/update operations
2. **Product Types**: Simple (no variants) vs Variable (with variants)
3. **Stock Management**: Product-level for simple, variant-level for variable products
4. **Category Display**: Scrollable tabs, hidden only when `hideParentInStorefront` is true or all categories are children
5. **Current Behavior**: Categories are shown even with 1 parent category (no auto-hide logic)
