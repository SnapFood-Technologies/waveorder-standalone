# External Product Sync Specification for WaveOrder

This document specifies the data format and structure that external systems should prepare when syncing products TO WaveOrder.

## Overview

WaveOrder accepts product data via the **Product Update API** (`PUT /api/v1/products/{productId}`). This API supports both **simple products** (no variations) and **variable products** (with variations/variants).

---

## Base URL

```
https://waveorder.app/api/v1
```

## Authentication

WaveOrder uses API key authentication. Your **Business ID** serves as your API key.

**Header Format:**
```
Authorization: Bearer {your_business_id}
```
OR
```
X-API-Key: {your_business_id}
```

---

## Endpoint

**Endpoint:** `PUT /api/v1/products/{externalProductId}`

- `{externalProductId}` = Your external system's unique product identifier
- This ID will be stored in WaveOrder's `metadata.externalProductId` for future matching

---

## Product Data Structure

### Simple Products (No Variations)

A simple product has no variants. Stock and price are managed at the product level.

#### Required Fields (First Sync)

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `sku` | string | **Yes** (first sync) | Product SKU - used for initial product matching |
| `name` or `nameAl` | string | **Yes** | Product name (English or Albanian) |
| `price` | number | **Yes** | Regular price (e.g., 100.00) |
| `categoryName` or `categoryId` | string | **Yes** | Category name (creates if doesn't exist) or existing category ID |

#### Optional Fields

| Field | Type | Description |
|-------|------|-------------|
| `name` | string | Product name (English) |
| `nameAl` | string | Product name (Albanian) |
| `description` | string | Product description (English, supports HTML) |
| `descriptionAl` | string | Product description (Albanian, supports HTML) |
| `salePrice` | number | Sale price (must be < `price`). If provided, product is on sale |
| `isActive` | boolean | Product status: `true` = active/published, `false` = inactive/draft (default: `true`) |
| `stockQuantity` | number | Stock quantity (non-negative integer, default: 0) |
| `stockStatus` | string | Stock status: `"instock"` or `"outofstock"`. If `"outofstock"`, sets stock to 0 |
| `images` | array of strings | Array of image URLs. First image is main image, rest are gallery images |
| `gallery` | array of strings | Alternative to `images` - treated the same way |
| `reason` | string | Reason for sync (e.g., "initial_sync", "product_update") |

#### Example: Simple Product

```json
{
  "sku": "PROD-001",
  "name": "Wireless Mouse",
  "nameAl": "Miuse pa tela",
  "description": "Ergonomic wireless mouse with 2-year battery life",
  "descriptionAl": "Miuse pa tela ergonomike me bateri 2 vjeçare",
  "price": 29.99,
  "salePrice": 24.99,
  "isActive": true,
  "stockQuantity": 50,
  "images": [
    "https://example.com/products/mouse/main.jpg",
    "https://example.com/products/mouse/gallery-1.jpg",
    "https://example.com/products/mouse/gallery-2.jpg"
  ],
  "categoryName": "Electronics",
  "reason": "initial_sync"
}
```

---

### Variable Products (With Variations)

A variable product has multiple variants (e.g., different sizes, colors). Each variant has its own price, stock, and optionally its own image.

#### Required Fields (First Sync)

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `sku` | string | **Yes** (first sync) | Product SKU - used for initial product matching |
| `name` or `nameAl` | string | **Yes** | Product name (English or Albanian) |
| `price` | number | **Yes** | Base/regular price (used as fallback for variants without price) |
| `categoryName` or `categoryId` | string | **Yes** | Category name or ID |
| `productType` | string | **Yes** | Must be `"variable"` |
| `variations` | array | **Yes** | Array of variation objects (see Variation Structure below) |

#### Optional Fields (Same as Simple Products)

All optional fields from simple products apply, plus:

| Field | Type | Description |
|-------|------|-------------|
| `images` | array of strings | Main product images (shown when no variant selected) |

#### Variation Structure

Each variation object in the `variations` array:

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `sku` | string | **Yes** | Variant SKU (unique identifier for this variation) |
| `price` | number | **Yes** | Variant-specific price |
| `stockQuantity` | number | **Yes** | Stock quantity for this variant |
| `salePrice` | number | No | Variant-specific sale price |
| `originalPrice` | number | No | Variant-specific original price (before sale) |
| `image` | string | No | Variant-specific image URL |
| `attributes` | object | No | Variant attributes (e.g., `{ "Size": "Small", "Color": "Red" }`) |
| `articleNo` | string | No | Article number for this variant |
| `dateSaleStart` | string | No | Sale start date (ISO 8601 format) |
| `dateSaleEnd` | string | No | Sale end date (ISO 8601 format) |

**Important Notes:**
- `sku` is the primary identifier for matching variants
- `attributes` object is used to generate the variant name (e.g., "Small - Red")
- If `attributes` is not provided, variant name defaults to the SKU
- Variant `image` is stored in `variant.metadata.image`
- All other variant metadata fields are stored in `variant.metadata`

#### Example: Variable Product

```json
{
  "sku": "TSHIRT-001",
  "name": "Classic T-Shirt",
  "nameAl": "T-Shirt Klasik",
  "description": "100% cotton classic t-shirt",
  "descriptionAl": "T-shirt klasik 100% pambuk",
  "price": 19.99,
  "isActive": true,
  "productType": "variable",
  "images": [
    "https://example.com/products/tshirt/main.jpg"
  ],
  "categoryName": "Clothing",
  "variations": [
    {
      "sku": "TSHIRT-001-SM-RED",
      "price": 19.99,
      "salePrice": 15.99,
      "stockQuantity": 25,
      "image": "https://example.com/products/tshirt/small-red.jpg",
      "attributes": {
        "Size": "Small",
        "Color": "Red"
      },
      "articleNo": "ART-001-SM-RED"
    },
    {
      "sku": "TSHIRT-001-MD-RED",
      "price": 19.99,
      "stockQuantity": 30,
      "image": "https://example.com/products/tshirt/medium-red.jpg",
      "attributes": {
        "Size": "Medium",
        "Color": "Red"
      },
      "articleNo": "ART-001-MD-RED"
    },
    {
      "sku": "TSHIRT-001-SM-BLUE",
      "price": 19.99,
      "stockQuantity": 15,
      "image": "https://example.com/products/tshirt/small-blue.jpg",
      "attributes": {
        "Size": "Small",
        "Color": "Blue"
      },
      "articleNo": "ART-001-SM-BLUE"
    }
  ],
  "reason": "initial_sync"
}
```

---

## Image Handling

### Product Images

- **Format**: Array of image URL strings
- **First Image**: Main product image (displayed prominently)
- **Remaining Images**: Gallery images (shown in product gallery)
- **Replacement**: Entire array is replaced on each update (not merged)
- **Validation**: Empty or invalid URLs are automatically filtered out

**Example:**
```json
{
  "images": [
    "https://example.com/products/main-image.jpg",    // Main image
    "https://example.com/products/gallery-1.jpg",     // Gallery image 1
    "https://example.com/products/gallery-2.jpg",     // Gallery image 2
    "https://example.com/products/gallery-3.jpg"      // Gallery image 3
  ]
}
```

**To remove all images:**
```json
{
  "images": []
}
```

### Variant Images

- **Field**: `variations[].image`
- **Format**: Single image URL string
- **Purpose**: Variant-specific image (overrides product image when variant is selected)
- **Storage**: Stored in `variant.metadata.image`

**Example:**
```json
{
  "variations": [
    {
      "sku": "VARIANT-001",
      "image": "https://example.com/variants/red-variant.jpg",
      "stockQuantity": 10
    }
  ]
}
```

---

## Stock Management

### Simple Products

- **Field**: `stockQuantity` (number)
- **Behavior**: Stock is tracked at product level
- **Stock Status**: Automatically calculated (`stockQuantity > 0` = `"instock"`, else `"outofstock"`)
- **Inventory Activity**: Created automatically when stock changes

**Example:**
```json
{
  "stockQuantity": 50,
  "stockStatus": "instock"  // Optional, auto-calculated
}
```

### Variable Products

- **Field**: `variations[].stockQuantity` (number, **required**)
- **Behavior**: Stock is tracked per variant
- **Stock Status**: Calculated per variant (`stockQuantity > 0` = `"instock"`)
- **Inventory Activity**: Created automatically when variant stock changes

**Example:**
```json
{
  "variations": [
    {
      "sku": "VARIANT-001",
      "stockQuantity": 25,  // Required
      "stockStatus": "instock"  // Optional, auto-calculated
    }
  ]
}
```

**Important:** For variable products, `stockQuantity` at the product level is ignored. Only variant-level stock is used.

---

## Price Handling

### Simple Products

**Regular Price:**
```json
{
  "price": 100.00
}
```

**On Sale:**
```json
{
  "price": 100.00,      // Regular price
  "salePrice": 80.00    // Sale price (must be < price)
}
```
- Current price = `salePrice` (80.00)
- Original price = `price` (100.00, stored in `originalPrice`)

**End Sale:**
```json
{
  "price": 100.00,
  "salePrice": 0        // Or omit salePrice
}
```

### Variable Products

**Base Price (Fallback):**
```json
{
  "price": 19.99  // Used if variant doesn't specify price
}
```

**Variant-Specific Pricing:**
```json
{
  "variations": [
    {
      "sku": "VARIANT-001",
      "price": 19.99,        // Variant regular price
      "salePrice": 15.99,     // Variant sale price
      "originalPrice": 19.99  // Optional, auto-set if salePrice provided
    }
  ]
}
```

**Price Priority:**
1. Variant `price` (if provided)
2. Product base `price` (fallback)

---

## Category Management

### By Category Name (Recommended)

```json
{
  "categoryName": "Electronics"
}
```
- Category is created automatically if it doesn't exist
- Case-insensitive matching

### By Category ID

```json
{
  "categoryId": "507f1f77bcf86cd799439011"
}
```
- Category must already exist in WaveOrder
- Returns error if category not found

**Note:** If both `categoryName` and `categoryId` are provided, `categoryId` takes precedence.

---

## Product Matching Logic

WaveOrder uses the following logic to match products:

### First Sync (Product Not Yet Linked)

1. **By SKU** (if `sku` provided in request body)
   - Matches existing product by SKU
   - Stores `externalProductId` in `metadata.externalProductId` for future lookups

2. **By External Product ID** (if product already linked)
   - Uses `metadata.externalProductId` for fast matching

3. **Fallback** (if SKU match fails)
   - Tries matching by WaveOrder internal ID (backwards compatibility)

### Subsequent Syncs

1. **By External Product ID** (fastest)
   - Uses stored `metadata.externalProductId`

2. **By SKU** (fallback)
   - If external ID match fails

**Important:** Always include `sku` on the first sync to ensure proper product matching.

---

## Complete Examples

### Example 1: Simple Product with Images and Sale

```json
{
  "sku": "LAPTOP-001",
  "name": "Gaming Laptop",
  "nameAl": "Laptop Gaming",
  "description": "High-performance gaming laptop with RTX 4060",
  "descriptionAl": "Laptop performancë të lartë gaming me RTX 4060",
  "price": 1299.99,
  "salePrice": 1099.99,
  "isActive": true,
  "stockQuantity": 15,
  "images": [
    "https://example.com/products/laptop/main.jpg",
    "https://example.com/products/laptop/side.jpg",
    "https://example.com/products/laptop/keyboard.jpg"
  ],
  "categoryName": "Computers",
  "reason": "initial_sync"
}
```

### Example 2: Variable Product with Multiple Variations

```json
{
  "sku": "SHOE-001",
  "name": "Running Shoes",
  "nameAl": "Këpucë Vrapimi",
  "description": "Lightweight running shoes",
  "descriptionAl": "Këpucë të lehta vrapimi",
  "price": 89.99,
  "isActive": true,
  "productType": "variable",
  "images": [
    "https://example.com/products/shoes/main.jpg"
  ],
  "categoryName": "Footwear",
  "variations": [
    {
      "sku": "SHOE-001-40-BLACK",
      "price": 89.99,
      "stockQuantity": 20,
      "image": "https://example.com/products/shoes/40-black.jpg",
      "attributes": {
        "Size": "40",
        "Color": "Black"
      },
      "articleNo": "SHOE-001-40-BLK"
    },
    {
      "sku": "SHOE-001-41-BLACK",
      "price": 89.99,
      "stockQuantity": 18,
      "image": "https://example.com/products/shoes/41-black.jpg",
      "attributes": {
        "Size": "41",
        "Color": "Black"
      },
      "articleNo": "SHOE-001-41-BLK"
    },
    {
      "sku": "SHOE-001-40-WHITE",
      "price": 89.99,
      "salePrice": 69.99,
      "stockQuantity": 12,
      "image": "https://example.com/products/shoes/40-white.jpg",
      "attributes": {
        "Size": "40",
        "Color": "White"
      },
      "articleNo": "SHOE-001-40-WHT",
      "dateSaleStart": "2024-01-01T00:00:00Z",
      "dateSaleEnd": "2024-12-31T23:59:59Z"
    }
  ],
  "reason": "initial_sync"
}
```

---

## API Request Examples

### cURL Example

```bash
curl -X PUT "https://waveorder.app/api/v1/products/EXT-PROD-12345" \
  -H "Authorization: Bearer YOUR_BUSINESS_ID" \
  -H "Content-Type: application/json" \
  -d '{
    "sku": "PROD-001",
    "name": "Product Name",
    "price": 100.00,
    "salePrice": 80.00,
    "stockQuantity": 50,
    "images": [
      "https://example.com/main.jpg"
    ],
    "categoryName": "Category Name",
    "productType": "variable",
    "variations": [
      {
        "sku": "PROD-001-VAR1",
        "price": 100.00,
        "stockQuantity": 25,
        "image": "https://example.com/variant1.jpg",
        "attributes": {
          "Size": "Small",
          "Color": "Red"
        }
      }
    ],
    "reason": "initial_sync"
  }'
```

### JavaScript Example

```javascript
const businessId = 'YOUR_BUSINESS_ID';
const externalProductId = 'EXT-PROD-12345';

const productData = {
  sku: 'PROD-001',
  name: 'Product Name',
  nameAl: 'Emër Produkti',
  description: 'Product description',
  price: 100.00,
  salePrice: 80.00,
  isActive: true,
  stockQuantity: 50,
  images: [
    'https://example.com/main.jpg',
    'https://example.com/gallery1.jpg'
  ],
  categoryName: 'Category Name',
  productType: 'variable',
  variations: [
    {
      sku: 'PROD-001-VAR1',
      price: 100.00,
      stockQuantity: 25,
      image: 'https://example.com/variant1.jpg',
      attributes: {
        Size: 'Small',
        Color: 'Red'
      }
    }
  ],
  reason: 'initial_sync'
};

const response = await fetch(`https://waveorder.app/api/v1/products/${externalProductId}`, {
  method: 'PUT',
  headers: {
    'Authorization': `Bearer ${businessId}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify(productData)
});

const result = await response.json();
console.log(result);
```

### Python Example

```python
import requests

business_id = "YOUR_BUSINESS_ID"
external_product_id = "EXT-PROD-12345"

url = f"https://waveorder.app/api/v1/products/{external_product_id}"

headers = {
    "Authorization": f"Bearer {business_id}",
    "Content-Type": "application/json"
}

product_data = {
    "sku": "PROD-001",
    "name": "Product Name",
    "nameAl": "Emër Produkti",
    "description": "Product description",
    "price": 100.00,
    "salePrice": 80.00,
    "isActive": True,
    "stockQuantity": 50,
    "images": [
        "https://example.com/main.jpg",
        "https://example.com/gallery1.jpg"
    ],
    "categoryName": "Category Name",
    "productType": "variable",
    "variations": [
        {
            "sku": "PROD-001-VAR1",
            "price": 100.00,
            "stockQuantity": 25,
            "image": "https://example.com/variant1.jpg",
            "attributes": {
                "Size": "Small",
                "Color": "Red"
            }
        }
    ],
    "reason": "initial_sync"
}

response = requests.put(url, headers=headers, json=product_data)
result = response.json()
print(result)
```

---

## Response Format

### Success Response (200 OK)

```json
{
  "success": true,
  "message": "Product updated successfully",
  "productId": "waveorder_internal_product_id",
  "product": {
    "id": "waveorder_internal_product_id",
    "name": "Product Name",
    "price": 80.00,
    "originalPrice": 100.00,
    "stock": 50,
    "isActive": true,
    "sku": "PROD-001",
    "images": [
      "https://example.com/main.jpg"
    ],
    "productType": "variable",
    "variations": [
      {
        "id": "variant_id",
        "sku": "PROD-001-VAR1",
        "name": "Small - Red",
        "price": 100.00,
        "stockQuantity": 25,
        "stockStatus": "instock",
        "image": "https://example.com/variant1.jpg",
        "attributes": {
          "Size": "Small",
          "Color": "Red"
        }
      }
    ]
  }
}
```

### Error Responses

See [EXTERNAL_API_PRODUCT_UPDATE_GUIDE.md](./EXTERNAL_API_PRODUCT_UPDATE_GUIDE.md) for complete error response details.

---

## Best Practices

### 1. First-Time Product Sync

Always include `sku` on the first sync:
```json
{
  "sku": "YOUR-SKU-CODE",
  "name": "Product Name",
  "price": 100.00,
  "categoryName": "Category"
}
```

### 2. Image URLs

- Use HTTPS URLs
- Ensure images are publicly accessible
- Recommended image formats: JPG, PNG, WebP
- Recommended max image size: 2MB per image

### 3. Variation Attributes

Use consistent attribute keys:
```json
{
  "attributes": {
    "Size": "Small",      // Use consistent capitalization
    "Color": "Red",       // Use consistent spelling
    "Material": "Cotton"  // Add more attributes as needed
  }
}
```

### 4. Stock Updates

For frequent stock updates, use the Stock Sync API (`PUT /api/v1/products/{productId}/stock`) instead of the Product Update API.

### 5. Partial Updates

Only send fields that changed:
```json
{
  "price": 120.00,
  "stockQuantity": 45
}
```

### 6. Reason Field

Use descriptive reasons:
- `"initial_sync"` - First time syncing product
- `"product_update"` - General product update
- `"price_change"` - Price update
- `"stock_update"` - Stock quantity change
- `"image_update"` - Image/gallery update
- `"status_change"` - Active/inactive status change

---

## Summary Checklist

### For Simple Products:
- [ ] `sku` (required on first sync)
- [ ] `name` or `nameAl` (required)
- [ ] `price` (required)
- [ ] `categoryName` or `categoryId` (required)
- [ ] `images` (array of URLs, optional)
- [ ] `stockQuantity` (optional, default: 0)
- [ ] `salePrice` (optional, if on sale)
- [ ] `isActive` (optional, default: true)

### For Variable Products:
- [ ] `sku` (required on first sync)
- [ ] `name` or `nameAl` (required)
- [ ] `price` (required, base price)
- [ ] `categoryName` or `categoryId` (required)
- [ ] `productType: "variable"` (required)
- [ ] `variations[]` (required, array of variation objects)
  - [ ] Each variation: `sku` (required)
  - [ ] Each variation: `price` (required, variant-specific price)
  - [ ] Each variation: `stockQuantity` (required)
  - [ ] Each variation: `image` (optional, variant-specific image)
  - [ ] Each variation: `attributes` (optional, e.g., `{ "Size": "Small", "Color": "Red" }`)

---

## Support

For questions or issues:
- **Email:** support@waveorder.app
- **Documentation:** See [EXTERNAL_API_PRODUCT_UPDATE_GUIDE.md](./EXTERNAL_API_PRODUCT_UPDATE_GUIDE.md) for detailed API reference
