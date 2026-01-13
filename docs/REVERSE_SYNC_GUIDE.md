# WaveOrder Reverse Sync API Guide

**Complete guide for WaveOrder to update products in OmniStack Gateway**

---

## Overview

This guide explains how WaveOrder can send product updates to OmniStack Gateway when products are created or updated in WaveOrder. This ensures both systems stay in sync bidirectionally.

**Base URL:** `https://apigtw.omnistackhub.xyz/`

---

## API Endpoint

### Update Product

**Endpoint:** `PUT /store-products/:productId/waveorder-update`

**URL Parameter:**
- `:productId` - The OmniStack StoreProduct `_id` (this is the external product ID that WaveOrder stores in `metadata.externalProductId`)

**Example:**
```
PUT /store-products/EXT-PROD-12345/waveorder-update
```

---

## Authentication

WaveOrder must authenticate using the client's API key.

**Headers Required:**
```
x-api-key: gwy_3kjg9KdJ37sdL4hF8Tk2sXnY5LzW8Rv
client-x-api-key: sk_3c577716586da676b0ded8530b6df92288f70c1275a687d45306c3c71c0f53b3
```

**Note:** Currently using static credentials. In production, the client API key should be stored per business/client.

**Example Request:**
```bash
curl -X PUT "https://apigtw.omnistackhub.xyz/store-products/EXT-PROD-12345/waveorder-update" \
  -H "x-api-key: gwy_3kjg9KdJ37sdL4hF8Tk2sXnY5LzW8Rv" \
  -H "client-x-api-key: sk_3c577716586da676b0ded8530b6df92288f70c1275a687d45306c3c71c0f53b3" \
  -H "Content-Type: application/json" \
  -d '{ ... }'
```

---

## Request Body

### Full Product Update

Send all product fields that should be updated:

```json
{
  "productId": "EXT-PROD-12345",
  "sku": "SKU-001",
  "name": "Seafood pot 18cm",
  "nameAl": "Seafood pot 18cm",
  "description": "Seafood pot 18cm. Quality product for your kitchen and home.",
  "descriptionAl": "Seafood pot 18cm. Quality product for your kitchen and home.",
  "price": 599.00,
  "salePrice": null,
  "originalPrice": null,
  "isActive": true,
  "stockQuantity": 60,
  "stockStatus": "instock",
  "featured": false,
  "images": [
    "https://example.com/images/seafood-pot-18cm-main.jpg",
    "https://example.com/images/seafood-pot-18cm-gallery-1.jpg"
  ],
  "categoryName": "Cookware",
  "categoryNameAl": "Cookware",
  "metadata": {
    "_id": "67890abcdef1234567890123",
    "clientId": "679cd85f2468feb16f7c57ba",
    "updatedAt": "2026-01-11T16:58:00.000Z"
  }
}
```

### Partial Update (Stock Only)

You can send only the fields that changed:

```json
{
  "productId": "EXT-PROD-12345",
  "stockQuantity": 59,
  "stockStatus": "instock",
  "metadata": {
    "_id": "67890abcdef1234567890123",
    "updatedAt": "2026-01-11T17:00:00.000Z"
  }
}
```

### Price Update (Sale Started)

```json
{
  "productId": "EXT-PROD-12345",
  "price": 80.00,
  "salePrice": 80.00,
  "originalPrice": 100.00,
  "metadata": {
    "_id": "67890abcdef1234567890123",
    "updatedAt": "2026-01-11T17:05:00.000Z"
  }
}
```

---

## Field Mapping (WaveOrder → OmniStack)

| WaveOrder Field | OmniStack Field | Type | Notes |
|----------------|-----------------|------|-------|
| `nameAl` | `titleAl` | string | **Preferred** - Albanian product name |
| `name` | `titleAl` | string | Fallback if `nameAl` not provided |
| `descriptionAl` | `descriptionAl` | string | **Preferred** - Albanian description (HTML allowed) |
| `description` | `description` | string | Fallback if `descriptionAl` not provided |
| `price` (when `originalPrice` is null) | `priceAl` | number | Regular price (rounded to whole number) |
| `originalPrice` | `priceAl` | number | Regular price when product is on sale |
| `price` (when `originalPrice` exists) | `salePriceAl` | number | Sale price (rounded to whole number) |
| `salePrice` | `salePriceAl` | number | Sale price (if provided separately) |
| `isActive` | `productStatus` | boolean | `true` = ACTIVE (1), `false` = INACTIVE (0) |
| `stockQuantity` | `stockQuantity` | number | Current stock quantity |
| `stockStatus` | `enableStock` | string | `"instock"` = true, `"outofstock"` = false |
| `featured` | `featured` | boolean | Featured product flag |
| `sku` | `productSku` | string | Product SKU |
| `images[0]` | `imagePath` | string | Main product image URL |
| `images[1..n]` | `gallery` | array | Gallery image URLs |
| `images: []` | `imagePath: null`, `gallery: []` | array | **Clears all images** |
| `categoryNameAl` | Category (find/create) | string | **Preferred** - Albanian category name |
| `categoryName` | Category (find/create) | string | Fallback if `categoryNameAl` not provided |
| `metadata._id` | `waveorder.productId` | string | WaveOrder's internal product ID (stored automatically) |

### Price Logic

**Regular Price (No Sale):**
```json
{
  "price": 599.00,
  "originalPrice": null
}
```
→ OmniStack: `priceAl = 599`, `salePriceAl = null`

**On Sale:**
```json
{
  "price": 80.00,
  "originalPrice": 100.00
}
```
→ OmniStack: `priceAl = 100` (regular), `salePriceAl = 80` (sale)

**Sale Ended:**
```json
{
  "price": 100.00,
  "originalPrice": 100.00  // Same as price = sale ended
}
```
→ OmniStack: `priceAl = 100`, `salePriceAl = null`

### Image Handling

**Update Images:**
```json
{
  "images": [
    "https://example.com/main.jpg",
    "https://example.com/gallery1.jpg",
    "https://example.com/gallery2.jpg"
  ]
}
```
→ OmniStack: `imagePath = "main.jpg"`, `gallery = ["gallery1.jpg", "gallery2.jpg"]`

**Clear Images:**
```json
{
  "images": []
}
```
→ OmniStack: `imagePath = null`, `gallery = []`

**No Images Field:**
If `images` field is not sent, images remain unchanged in OmniStack.

### Category Handling

- OmniStack will find existing category by name (prefers Albanian name)
- If category doesn't exist, OmniStack will create it automatically
- Category is linked to the product (replaces existing categories)

---

## Product Identification

### Primary Method: StoreProduct `_id` (URL Path)

WaveOrder should use the **OmniStack StoreProduct `_id`** as the `productId` in the URL path. This is the value stored in WaveOrder's `metadata.externalProductId` field.

**Example:**
- WaveOrder stores: `metadata.externalProductId = "EXT-PROD-12345"`
- WaveOrder calls: `PUT /store-products/EXT-PROD-12345/waveorder-update`

### Fallback Method: WaveOrder Internal ID

If the product is not found by StoreProduct `_id`, OmniStack will automatically try to find it by WaveOrder's internal ID (`metadata._id`). This is useful if the `externalProductId` mapping is missing or incorrect.

**Note:** OmniStack automatically stores WaveOrder's internal ID (`metadata._id`) in `waveorder.productId` for future lookups.

---

## Response Format

### Success Response (200 OK)

```json
{
  "success": true,
  "message": "Product updated successfully from WaveOrder",
  "product": {
    "_id": "EXT-PROD-12345",
    "titleAl": "Seafood pot 18cm",
    "priceAl": 599,
    "stockQuantity": 60,
    "waveorder": {
      "productId": "67890abcdef1234567890123",
      "lastSyncAt": "2026-01-11T17:00:00.000Z",
      "syncStatus": "synced"
    },
    ...
  }
}
```

### Error Responses

#### Product Not Found (404)

```json
{
  "statusCode": 404,
  "message": "Product with ID EXT-PROD-12345 not found (also tried WaveOrder ID: 67890abcdef1234567890123)"
}
```

**Possible causes:**
- Product was deleted in OmniStack
- `productId` in URL doesn't match any product
- WaveOrder `metadata._id` doesn't match any stored `waveorder.productId`

#### Unauthorized (401)

```json
{
  "statusCode": 401,
  "message": "Invalid client API key"
}
```

**Solution:** Verify the `client-x-api-key` header is correct.

#### Bad Request (400)

```json
{
  "statusCode": 400,
  "message": "Failed to update product from WaveOrder: <error details>"
}
```

**Possible causes:**
- Invalid data format
- Missing required fields
- Validation errors

---

## When to Trigger Reverse Sync

WaveOrder should trigger reverse sync when:

### 1. Product Created
- New product is created in WaveOrder
- Product is linked to OmniStack (has `metadata.externalProductId`)

### 2. Product Updated
Any of these fields change:
- `name`, `nameAl`
- `description`, `descriptionAl`
- `price`, `originalPrice`, `salePrice`
- `isActive`
- `stock` (stock quantity)
- `stockStatus`
- `featured`
- `images`
- `categoryId` (category change)
- `sku`

### 3. Stock Changed
- Stock quantity changes (via inventory activities)
- Stock status changes (instock ↔ outofstock)

### 4. Manual Sync
- Admin triggers manual sync from WaveOrder dashboard

---

## Implementation

### Using the OmniGateway Service

WaveOrder includes a service module for easy integration:

**File:** `src/lib/omnigateway.ts`

**Example Usage:**

```typescript
import { updateProductInOmniGateway, OmniGatewayProductUpdate } from '@/lib/omnigateway';

// Full product update
const updateData: OmniGatewayProductUpdate = {
  productId: 'EXT-PROD-12345',
  nameAl: 'Seafood pot 18cm',
  descriptionAl: 'Quality product for your kitchen and home.',
  price: 599,
  isActive: true,
  stockQuantity: 60,
  stockStatus: 'instock',
  images: [
    'https://example.com/main.jpg',
    'https://example.com/gallery1.jpg'
  ],
  categoryNameAl: 'Cookware',
  metadata: {
    _id: 'waveorder-product-id',
    updatedAt: new Date().toISOString()
  }
};

try {
  const result = await updateProductInOmniGateway('EXT-PROD-12345', updateData);
  console.log('Product synced successfully:', result);
} catch (error) {
  console.error('Failed to sync product:', error);
}

// Stock-only update
await updateProductInOmniGateway('EXT-PROD-12345', {
  stockQuantity: 59,
  stockStatus: 'instock',
  metadata: {
    _id: 'waveorder-product-id',
    updatedAt: new Date().toISOString()
  }
});
```

---

## Best Practices

### 1. Send Only Changed Fields

For better performance, send only the fields that changed:

```json
// ✅ Good: Only stock changed
{
  "stockQuantity": 59,
  "stockStatus": "instock"
}

// ❌ Avoid: Sending all fields when only stock changed
{
  "name": "...",
  "description": "...",
  "price": 599,
  "stockQuantity": 59,  // Only this changed
  ...
}
```

### 2. Include Metadata

Always include `metadata._id` (WaveOrder's internal ID) in the request:

```json
{
  "metadata": {
    "_id": "67890abcdef1234567890123",
    "updatedAt": "2026-01-11T17:00:00.000Z"
  }
}
```

This allows OmniStack to:
- Store the mapping for future lookups
- Find products if `productId` in URL doesn't match
- Track sync status

### 3. Handle Image Updates Carefully

**To update images:**
```json
{
  "images": ["https://new-main.jpg", "https://gallery1.jpg"]
}
```

**To clear images:**
```json
{
  "images": []
}
```

**To leave images unchanged:**
```json
{
  // Don't include "images" field at all
}
```

### 4. Use Albanian Fields When Available

Always prefer Albanian fields (`nameAl`, `descriptionAl`, `categoryNameAl`) as they are the primary display language:

```json
// ✅ Good
{
  "nameAl": "Seafood pot 18cm",
  "descriptionAl": "Quality product...",
  "categoryNameAl": "Cookware"
}

// ⚠️ Acceptable (fallback)
{
  "name": "Seafood pot 18cm",
  "description": "Quality product...",
  "categoryName": "Cookware"
}
```

### 5. Round Prices

OmniStack rounds ALL prices to whole numbers (no cents/subunits). WaveOrder should send prices as whole numbers:

```json
// ✅ Good
{
  "price": 599
}

// ⚠️ Acceptable (will be rounded)
{
  "price": 599.99  // Will become 600
}
```

### 6. Error Handling

Implement retry logic with exponential backoff:

```typescript
async function updateProductInOmniStack(
  productId: string,
  data: OmniGatewayProductUpdate,
  retries = 3
): Promise<any> {
  for (let i = 0; i < retries; i++) {
    try {
      const result = await updateProductInOmniGateway(productId, data);
      return result;
    } catch (error: any) {
      // Don't retry on 404 (product not found)
      if (error.message?.includes('404') || error.message?.includes('not found')) {
        throw error;
      }

      // Retry on 5xx errors
      if (i < retries - 1) {
        await sleep(Math.pow(2, i) * 1000); // Exponential backoff
        continue;
      }

      throw error;
    }
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}
```

### 7. Rate Limiting

Respect rate limits:
- Default: 60 requests per minute per client
- Implement exponential backoff for rate limit errors (429)
- Queue sync requests if rate limit is exceeded

---

## Testing

Before implementing reverse sync, test with:

1. **Single product update** - Update one product and verify it syncs
2. **Bulk product updates** - Update multiple products
3. **Stock-only updates** - Update only stock quantity
4. **Price changes** - Regular → Sale → Regular
5. **Image updates** - Add, remove, replace images
6. **Category changes** - Change product category
7. **Product activation/deactivation** - Toggle `isActive`
8. **Product not found** - Test with invalid `productId`
9. **Authentication errors** - Test with invalid API key

---

## Troubleshooting

### Product Not Found (404)

**Problem:** Product not found even though it exists in OmniStack.

**Solutions:**
1. Verify `metadata.externalProductId` in WaveOrder matches the StoreProduct `_id` in OmniStack
2. Check if product was deleted in OmniStack (`deletedAt` field)
3. Verify the `productId` in the URL path is correct
4. OmniStack will try to find by WaveOrder `metadata._id` as fallback

### Authentication Failed (401)

**Problem:** API key is rejected.

**Solutions:**
1. Verify `client-x-api-key` header is correct
2. Check if API key is active in OmniStack
3. Ensure header name is exactly `client-x-api-key` (case-sensitive)

### Images Not Updating

**Problem:** Images don't update in OmniStack.

**Solutions:**
1. Ensure image URLs are publicly accessible (not behind authentication)
2. Use full URLs (https://...) not relative paths
3. Send empty array `[]` to clear images
4. First image in array becomes main image

### Category Not Found

**Problem:** Category is not created or linked.

**Solutions:**
1. OmniStack automatically creates categories if they don't exist
2. Use `categoryNameAl` (preferred) or `categoryName`
3. Category names are case-sensitive

---

## Support

For questions or issues:
- Contact OmniStack support team
- Provide product IDs and error messages
- Include request/response examples

---

**Document Version:** 1.0  
**Last Updated:** January 11, 2026  
**API Version:** Compatible with OmniStack Gateway v1.0+
