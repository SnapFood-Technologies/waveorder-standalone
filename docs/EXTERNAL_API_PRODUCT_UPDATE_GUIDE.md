# WaveOrder Product Update API - Integration Guide

This guide explains how external systems can update product information in WaveOrder using our Product Update API.

> **Note:** This endpoint is separate from the Stock Sync API. Use this endpoint to update product details (price, status, images, etc.), and use the Stock Sync API (`PUT /api/v1/products/{productId}/stock`) for stock quantity updates.

## Base URL

```
https://waveorder.app/api/v1
```

## Authentication

WaveOrder uses API key authentication. Your **Business ID** serves as your API key.

### API Key Format

You can send the API key in one of two ways:

**Option 1: Bearer Token (Recommended)**
```
Authorization: Bearer {your_business_id}
```

**Option 2: X-API-Key Header**
```
X-API-Key: {your_business_id}
```

> **Note:** Your Business ID is the unique identifier for your WaveOrder business account. Contact WaveOrder support to obtain your Business ID.

## Endpoint

### Update Product

**Endpoint:** `PUT /api/v1/products/{productId}`

Updates product information in WaveOrder. This endpoint supports partial updates - only send the fields you want to update.

#### URL Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `productId` | string | Yes | Your external system's product ID (used to match products) |

#### Request Headers

| Header | Value | Required |
|--------|-------|----------|
| `Authorization` | `Bearer {your_business_id}` OR `X-API-Key: {your_business_id}` | Yes |
| `Content-Type` | `application/json` | Yes |

#### Request Body

All fields are optional - only include the fields you want to update.

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `sku` | string | No | Product SKU (used for first-time product matching if external ID not found) |
| `price` | number | No | Regular price (e.g., 100.00) |
| `salePrice` | number | No | Sale price (must be less than regular price). If provided with `price`, the sale price becomes the current price and regular price is stored as original price |
| `isActive` | boolean | No | Product status: `true` = active/published, `false` = inactive/draft |
| `stockQuantity` | number | No | Stock quantity (non-negative integer). Creates inventory activity if changed |
| `stockStatus` | string | No | Stock status: `"instock"` or `"outofstock"`. If `"outofstock"`, sets stock to 0 |
| `name` | string | No | Product name (English) |
| `nameAl` | string | No | Product name (Albanian) |
| `description` | string | No | Product description (English, supports HTML) |
| `descriptionAl` | string | No | Product description (Albanian, supports HTML) |
| `images` | array of strings | No | Array of image URLs. First image is main image, rest are gallery images. Replaces entire image array |
| `gallery` | array of strings | No | Alternative to `images` - treated the same way. If both provided, `images` takes precedence |
| `categoryId` | string | No | Category ID (must exist in WaveOrder) |
| `categoryName` | string | No | Category name - will create category if it doesn't exist |
| `reason` | string | No | Reason for update (stored in inventory activity if stock changes, e.g., "product_update", "price_change") |

#### Example Request - Update Price and Status

```bash
curl -X PUT "https://waveorder.app/api/v1/products/EXT-PROD-12345" \
  -H "Authorization: Bearer YOUR_BUSINESS_ID" \
  -H "Content-Type: application/json" \
  -d '{
    "price": 150.00,
    "salePrice": 120.00,
    "isActive": true,
    "reason": "price_update"
  }'
```

#### Example Request - Update Images

```bash
curl -X PUT "https://waveorder.app/api/v1/products/EXT-PROD-12345" \
  -H "Authorization: Bearer YOUR_BUSINESS_ID" \
  -H "Content-Type: application/json" \
  -d '{
    "images": [
      "https://example.com/products/main-image.jpg",
      "https://example.com/products/gallery-1.jpg",
      "https://example.com/products/gallery-2.jpg",
      "https://example.com/products/gallery-3.jpg"
    ],
    "reason": "image_update"
  }'
```

#### Example Request - Update Title and Description

```bash
curl -X PUT "https://waveorder.app/api/v1/products/EXT-PROD-12345" \
  -H "Authorization: Bearer YOUR_BUSINESS_ID" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Product Name (English)",
    "nameAl": "Emër Produkti (Shqip)",
    "description": "Product description in English",
    "descriptionAl": "Përshkrim produkti në shqip",
    "reason": "content_update"
  }'
```

#### Example Request - Update Category

```bash
curl -X PUT "https://waveorder.app/api/v1/products/EXT-PROD-12345" \
  -H "Authorization: Bearer YOUR_BUSINESS_ID" \
  -H "Content-Type: application/json" \
  -d '{
    "categoryName": "Electronics",
    "reason": "category_update"
  }'
```

#### Example Request - Full Product Update

```bash
curl -X PUT "https://waveorder.app/api/v1/products/EXT-PROD-12345" \
  -H "Authorization: Bearer YOUR_BUSINESS_ID" \
  -H "Content-Type: application/json" \
  -d '{
    "sku": "SKU-001",
    "price": 199.99,
    "salePrice": 149.99,
    "isActive": true,
    "name": "Product Name",
    "nameAl": "Emër Produkti",
    "description": "Product description",
    "descriptionAl": "Përshkrim produkti",
    "images": [
      "https://example.com/main.jpg",
      "https://example.com/gallery1.jpg"
    ],
    "categoryName": "Category Name",
    "reason": "full_product_sync"
  }'
```

#### JavaScript Example

```javascript
const businessId = 'YOUR_BUSINESS_ID';
const externalProductId = 'EXT-PROD-12345';

const response = await fetch(`https://waveorder.app/api/v1/products/${externalProductId}`, {
  method: 'PUT',
  headers: {
    'Authorization': `Bearer ${businessId}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    price: 150.00,
    salePrice: 120.00,
    isActive: true,
    images: [
      'https://example.com/main.jpg',
      'https://example.com/gallery1.jpg'
    ],
    reason: 'product_update'
  })
});

const result = await response.json();
console.log(result);
```

#### Python Example

```python
import requests

business_id = "YOUR_BUSINESS_ID"
external_product_id = "EXT-PROD-12345"

url = f"https://waveorder.app/api/v1/products/{external_product_id}"

headers = {
    "Authorization": f"Bearer {business_id}",
    "Content-Type": "application/json"
}

data = {
    "price": 150.00,
    "salePrice": 120.00,
    "isActive": True,
    "images": [
        "https://example.com/main.jpg",
        "https://example.com/gallery1.jpg"
    ],
    "reason": "product_update"
}

response = requests.put(url, headers=headers, json=data)
result = response.json()
print(result)
```

## Product Matching Logic

WaveOrder uses the following logic to find products (same as Stock Sync API):

1. **First Sync (Product not yet linked):**
   - If `sku` is provided in the request body, WaveOrder matches products by SKU
   - On successful match, WaveOrder stores your external product ID in the product's metadata
   - Future requests will use this stored ID for faster matching

2. **Subsequent Syncs (Product already linked):**
   - WaveOrder first looks up the product using the external product ID stored in metadata
   - This provides faster, more reliable matching

3. **Fallback:**
   - If matching by external ID fails, WaveOrder falls back to SKU matching
   - As a last resort, it tries matching by WaveOrder's internal product ID

> **Important:** For the first product update, always include the `sku` field in your request body to ensure proper product matching.

## Field Details

### Price and Sale Price

WaveOrder uses a special logic for prices:

- **Regular Price Only:** If you send `price` without `salePrice`, the product uses regular pricing
- **On Sale:** If you send both `price` (regular) and `salePrice` (less than regular):
  - Current price = `salePrice`
  - Original price = `price` (stored for reference)
- **Sale End:** If `salePrice` is 0 or greater than/equal to `price`, the sale is cleared

**Example:**
```json
{
  "price": 100.00,      // Regular price
  "salePrice": 80.00    // Product is on sale at 80.00 (regular was 100.00)
}
```

### Images/Gallery

- **Array of URLs:** Send an array of image URL strings
- **Replace Entire Array:** The entire image array is replaced (not merged)
- **First Image = Main:** The first image (index 0) is the main product image
- **Rest = Gallery:** Remaining images are gallery images
- **Validation:** Empty or invalid URLs are automatically filtered out

**Example:**
```json
{
  "images": [
    "https://example.com/main-image.jpg",    // Main image
    "https://example.com/gallery-1.jpg",     // Gallery image 1
    "https://example.com/gallery-2.jpg"      // Gallery image 2
  ]
}
```

> **Note:** To remove all images, send an empty array: `"images": []`

### Category

You can update category in two ways:

1. **By Category ID:** Provide `categoryId` (category must already exist in WaveOrder)
2. **By Category Name:** Provide `categoryName` (category will be created if it doesn't exist)

If both are provided, `categoryId` takes precedence.

**Example:**
```json
{
  "categoryName": "Electronics"  // Creates category if it doesn't exist
}
```

### Stock Quantity

- If `stockQuantity` is provided and differs from current stock, an inventory activity is created
- The `reason` field is used in the inventory activity message
- Stock status can also be set explicitly with `stockStatus: "outofstock"` (sets stock to 0)

> **Note:** For frequent stock updates, use the Stock Sync API (`PUT /api/v1/products/{productId}/stock`) instead.

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
    "price": 120.00,
    "originalPrice": 150.00,
    "stock": 50,
    "isActive": true,
    "sku": "SKU-001",
    "images": [
      "https://example.com/main.jpg",
      "https://example.com/gallery1.jpg"
    ]
  }
}
```

### Error Responses

#### 401 Unauthorized - Missing API Key

```json
{
  "success": false,
  "error": "Unauthorized - API key required",
  "code": "UNAUTHORIZED"
}
```

#### 401 Unauthorized - Invalid API Key

```json
{
  "success": false,
  "error": "Unauthorized - Invalid API key",
  "code": "UNAUTHORIZED"
}
```

#### 404 Not Found - Product Not Found

```json
{
  "success": false,
  "error": "Product not found",
  "code": "PRODUCT_NOT_FOUND"
}
```

#### 400 Bad Request - Validation Error

```json
{
  "success": false,
  "error": "images must be an array of image URLs",
  "code": "VALIDATION_ERROR"
}
```

#### 400 Bad Request - Category Not Found

```json
{
  "success": false,
  "error": "Category not found",
  "code": "CATEGORY_NOT_FOUND"
}
```

#### 500 Internal Server Error

```json
{
  "success": false,
  "error": "Internal server error",
  "code": "INTERNAL_ERROR"
}
```

## Error Codes

| Code | Description | HTTP Status |
|------|-------------|-------------|
| `UNAUTHORIZED` | Missing or invalid API key | 401 |
| `VALIDATION_ERROR` | Invalid request data format | 400 |
| `PRODUCT_NOT_FOUND` | Product could not be matched | 404 |
| `CATEGORY_NOT_FOUND` | Category ID not found (when using categoryId) | 400 |
| `INTERNAL_ERROR` | Server error | 500 |

## Best Practices

### 1. Partial Updates

Only send the fields you want to update. This reduces payload size and prevents accidental overwrites.

**Good:**
```json
{
  "price": 150.00,
  "isActive": true
}
```

**Avoid:**
```json
{
  "price": 150.00,
  "isActive": true,
  "name": null,        // Don't send nulls to clear fields
  "description": null  // Only send fields that changed
}
```

### 2. First-Time Product Matching

Always include `sku` on the first update:

```json
{
  "sku": "YOUR-SKU-CODE",
  "price": 100.00,
  "name": "Product Name"
}
```

### 3. Image Updates

When updating images, send the complete array:

```json
{
  "images": [
    "https://example.com/new-main.jpg",    // New main image
    "https://example.com/gallery-1.jpg",   // Keep existing gallery image
    "https://example.com/new-gallery.jpg"  // New gallery image
  ]
}
```

### 4. Sale Price Logic

Always send both `price` and `salePrice` when setting a sale:

```json
{
  "price": 100.00,      // Regular price
  "salePrice": 80.00    // Sale price
}
```

To end a sale, send:
```json
{
  "price": 100.00,
  "salePrice": 0        // Or omit salePrice
}
```

### 5. Reason Field

Use descriptive reasons to help track changes:

- `"product_update"` - General product update
- `"price_change"` - Price update
- `"image_update"` - Image/gallery update
- `"status_change"` - Active/inactive status change
- `"category_change"` - Category update
- `"content_update"` - Title/description update

### 6. Error Handling

Always check the `success` field:

```javascript
const result = await response.json();

if (!result.success) {
  console.error(`Error: ${result.error} (Code: ${result.code})`);
  
  if (result.code === 'PRODUCT_NOT_FOUND') {
    // Product not matched - check if SKU is correct
  } else if (result.code === 'UNAUTHORIZED') {
    // Invalid API key
  }
}
```

## Differences from Stock Sync API

| Feature | Product Update API | Stock Sync API |
|---------|-------------------|----------------|
| **Endpoint** | `PUT /api/v1/products/{productId}` | `PUT /api/v1/products/{productId}/stock` |
| **Purpose** | Update product details (price, images, status, etc.) | Update stock quantity only |
| **Stock Updates** | Creates inventory activity if stock changes | Always creates inventory activity |
| **Speed** | Use for infrequent updates | Use for frequent stock syncs |

> **Recommendation:** Use Stock Sync API for frequent stock quantity updates (e.g., after each order). Use Product Update API for product information updates (price changes, image updates, etc.).

## Support

For questions or issues:

- **Email:** support@waveorder.app
- **Documentation:** This guide will be updated as the API evolves

## Changelog

### Version 1.0 (Current)

- Initial API release
- Support for partial product updates
- Image/gallery array replacement
- Price and sale price management
- Category creation/assignment
- Product status management
- Multi-language support (English/Albanian)
