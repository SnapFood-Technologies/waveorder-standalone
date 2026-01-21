# External System API Specification for WaveOrder Product Sync

This document specifies the API format that external systems must expose for WaveOrder to fetch and sync products INTO WaveOrder.

## Overview

WaveOrder will **fetch products FROM your external system** and sync them into WaveOrder. Your external system must expose a REST API that WaveOrder can call to retrieve product data.

---

## Authentication

WaveOrder will authenticate using an API key that you provide during sync configuration.

### Supported Authentication Methods

**Option 1: API Key Header (Recommended)**
```
X-API-Key: {your_api_key}
```
OR
```
Authorization: Bearer {your_api_key}
```

**Option 2: Query Parameter**
```
?api_key={your_api_key}
```

**Option 3: Basic Auth**
```
Authorization: Basic {base64_encoded_credentials}
```

---

## Base URL Configuration

During sync setup, WaveOrder stores:
- **Base URL**: Your external system's API base URL (e.g., `https://api.example.com`)
- **API Key**: Authentication key for your API
- **Endpoints**: JSON object specifying endpoint paths (see below)

---

## Required Endpoints

Your external system must expose the following endpoints:

### 1. List Products

**Endpoint:** `GET /products` (or custom path configured in `externalSystemEndpoints.products`)

**Query Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `page` | number | No | Page number (for pagination, default: 1) |
| `limit` | number | No | Items per page (default: 100, max: 500) |
| `brandId` | string | No | Filter by brand ID (if `externalBrandIds` configured) |
| `updatedSince` | string | No | ISO 8601 datetime - only return products updated after this date |

**Response Format:**

```json
{
  "products": [
    {
      "id": "PROD-12345",
      "sku": "SKU-001",
      "name": "Product Name",
      "nameAl": "Emër Produkti",
      "description": "Product description",
      "descriptionAl": "Përshkrim produkti",
      "price": 100.00,
      "salePrice": 80.00,
      "originalPrice": 100.00,
      "isActive": true,
      "stockQuantity": 50,
      "stockStatus": "instock",
      "images": [
        "https://example.com/products/main.jpg",
        "https://example.com/products/gallery1.jpg"
      ],
      "categoryName": "Electronics",
      "categoryNameAl": "Elektronikë",
      "productType": "simple",
      "variations": []
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 100,
    "total": 250,
    "totalPages": 3,
    "hasNext": true,
    "hasPrev": false
  }
}
```

**Alternative Response Format (if pagination is different):**
```json
{
  "data": [...],
  "total": 250,
  "page": 1,
  "perPage": 100
}
```

---

## Product Data Structure

### Simple Products (No Variations)

A simple product has no variations. Stock and price are managed at the product level.

#### Required Fields

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` | string | **Yes** | Unique product identifier in your external system |
| `name` or `nameAl` | string | **Yes** | Product name (English or Albanian) |
| `price` | number | **Yes** | Regular price (e.g., 100.00) |
| `stockQuantity` | number | **Yes** | Stock quantity (non-negative integer) |
| `productType` | string | **Yes** | Must be `"simple"` |

#### Optional Fields

| Field | Type | Description |
|-------|------|-------------|
| `sku` | string | Product SKU (recommended for matching) |
| `name` | string | Product name (English) |
| `nameAl` | string | Product name (Albanian) |
| `description` | string | Product description (English, supports HTML) |
| `descriptionAl` | string | Product description (Albanian, supports HTML) |
| `salePrice` | number | Sale price (must be < `price`). If provided, product is on sale |
| `originalPrice` | number | Original price before sale |
| `isActive` | boolean | Product status: `true` = active/published, `false` = inactive/draft |
| `stockStatus` | string | Stock status: `"instock"` or `"outofstock"` (auto-calculated if not provided) |
| `images` | array of strings | Array of image URLs. First image is main image, rest are gallery images |
| `categoryName` | string | Category name (will be created if doesn't exist in WaveOrder) |
| `categoryNameAl` | string | Category name in Albanian |
| `categoryId` | string | Category ID (if categories are managed separately) |
| `variations` | array | Empty array `[]` for simple products |

#### Example: Simple Product

```json
{
  "id": "PROD-12345",
  "sku": "SKU-001",
  "name": "Wireless Mouse",
  "nameAl": "Miuse pa tela",
  "description": "Ergonomic wireless mouse with 2-year battery life",
  "descriptionAl": "Miuse pa tela ergonomike me bateri 2 vjeçare",
  "price": 29.99,
  "salePrice": 24.99,
  "originalPrice": 29.99,
  "isActive": true,
  "stockQuantity": 50,
  "stockStatus": "instock",
  "images": [
    "https://example.com/products/mouse/main.jpg",
    "https://example.com/products/mouse/gallery-1.jpg",
    "https://example.com/products/mouse/gallery-2.jpg"
  ],
  "categoryName": "Electronics",
  "categoryNameAl": "Elektronikë",
  "productType": "simple",
  "variations": []
}
```

---

### Variable Products (With Variations)

A variable product has multiple variations (e.g., different sizes, colors). Each variation has its own price, stock, and optionally its own image.

#### Required Fields

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` | string | **Yes** | Unique product identifier in your external system |
| `name` or `nameAl` | string | **Yes** | Product name (English or Albanian) |
| `price` | number | **Yes** | Base/regular price (used as fallback for variations without price) |
| `productType` | string | **Yes** | Must be `"variable"` |
| `variations` | array | **Yes** | Array of variation objects (see Variation Structure below) |

#### Optional Fields

All optional fields from simple products apply, plus:

| Field | Type | Description |
|-------|------|-------------|
| `images` | array of strings | Main product images (shown when no variation selected) |

#### Variation Structure

Each variation object in the `variations` array:

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `sku` | string | **Yes** | Variant SKU (unique identifier for this variation) |
| `price` | number | **Yes** | Variant-specific price |
| `stockQuantity` | number | **Yes** | Stock quantity for this variant |
| `image` | string | No | Variant-specific image URL |
| `salePrice` | number | No | Variant-specific sale price |
| `originalPrice` | number | No | Variant-specific original price (before sale) |
| `attributes` | object | No | Variant attributes (e.g., `{ "Size": "Small", "Color": "Red" }`) |
| `articleNo` | string | No | Article number for this variant |
| `dateSaleStart` | string | No | Sale start date (ISO 8601 format) |
| `dateSaleEnd` | string | No | Sale end date (ISO 8601 format) |

**Important Notes:**
- `sku` is the primary identifier for matching variations
- `attributes` object is used to generate the variation name (e.g., "Small - Red")
- If `attributes` is not provided, variation name defaults to the SKU
- Variation `image` overrides product image when variation is selected

#### Example: Variable Product

```json
{
  "id": "PROD-67890",
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
  "categoryNameAl": "Veshje",
  "variations": [
    {
      "sku": "TSHIRT-001-SM-RED",
      "price": 19.99,
      "salePrice": 15.99,
      "originalPrice": 19.99,
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
  ]
}
```

---

## Image Handling

### Product Images

- **Format**: Array of image URL strings
- **First Image**: Main product image (displayed prominently)
- **Remaining Images**: Gallery images (shown in product gallery)
- **URLs**: Must be publicly accessible HTTPS URLs
- **Formats**: JPG, PNG, WebP (recommended)
- **Size**: Recommended max 2MB per image

**Example:**
```json
{
  "images": [
    "https://example.com/products/main-image.jpg",    // Main image
    "https://example.com/products/gallery-1.jpg",     // Gallery image 1
    "https://example.com/products/gallery-2.jpg",    // Gallery image 2
    "https://example.com/products/gallery-3.jpg"     // Gallery image 3
  ]
}
```

### Variation Images

- **Field**: `variations[].image`
- **Format**: Single image URL string
- **Purpose**: Variation-specific image (overrides product image when variation is selected)
- **Optional**: If not provided, product image is used

**Example:**
```json
{
  "variations": [
    {
      "sku": "VARIANT-001",
      "image": "https://example.com/variants/red-variant.jpg",
      "stockQuantity": 10,
      "price": 100.00
    }
  ]
}
```

---

## Stock Management

### Simple Products

- **Field**: `stockQuantity` (number, **required**)
- **Behavior**: Stock is tracked at product level
- **Stock Status**: Can be provided as `stockStatus` or auto-calculated (`stockQuantity > 0` = `"instock"`)

**Example:**
```json
{
  "stockQuantity": 50,
  "stockStatus": "instock"  // Optional, auto-calculated if not provided
}
```

### Variable Products

- **Field**: `variations[].stockQuantity` (number, **required** per variation)
- **Behavior**: Stock is tracked per variation
- **Stock Status**: Calculated per variation (`stockQuantity > 0` = `"instock"`)

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

**Important:** For variable products, `stockQuantity` at the product level is ignored. Only variation-level stock is used.

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
  "salePrice": 80.00,   // Sale price (must be < price)
  "originalPrice": 100.00  // Optional, auto-set if salePrice provided
}
```
- Current price = `salePrice` (80.00)
- Original price = `price` (100.00, stored in `originalPrice`)

**End Sale:**
```json
{
  "price": 100.00,
  "salePrice": null     // Or omit salePrice
}
```

### Variable Products

**Base Price (Reference):**
```json
{
  "price": 19.99  // Base price for reference (variations must specify their own price)
}
```

**Variation-Specific Pricing:**
```json
{
  "variations": [
    {
      "sku": "VARIANT-001",
      "price": 19.99,        // Variation regular price (required)
      "salePrice": 15.99,   // Variation sale price (optional)
      "originalPrice": 19.99  // Optional, auto-set if salePrice provided
    }
  ]
}
```

**Important:** Each variation **must** specify its own `price`. The product base `price` is for reference only.

---

## Category Management

### By Category Name (Recommended)

```json
{
  "categoryName": "Electronics",
  "categoryNameAl": "Elektronikë"
}
```
- Category is created automatically in WaveOrder if it doesn't exist
- Case-insensitive matching
- Supports both English and Albanian names

### By Category ID

```json
{
  "categoryId": "507f1f77bcf86cd799439011"
}
```
- Category must already exist in WaveOrder
- Less flexible than category name

**Note:** If both `categoryName` and `categoryId` are provided, `categoryName` takes precedence.

---

## Endpoint Configuration

WaveOrder stores endpoint paths in `externalSystemEndpoints` JSON field:

```json
{
  "products": "/api/v1/products",
  "categories": "/api/v1/categories",
  "brands": "/api/v1/brands"
}
```

**Default Endpoints:**
- Products: `/products` (if not specified)
- Categories: `/categories` (optional)
- Brands: `/brands` (optional, if `externalBrandIds` configured)

---

## Pagination

WaveOrder supports multiple pagination formats:

### Format 1: Standard Pagination Object

```json
{
  "products": [...],
  "pagination": {
    "page": 1,
    "limit": 100,
    "total": 250,
    "totalPages": 3,
    "hasNext": true,
    "hasPrev": false
  }
}
```

### Format 2: Simple Pagination

```json
{
  "data": [...],
  "total": 250,
  "page": 1,
  "perPage": 100
}
```

### Format 3: Cursor-Based (if supported)

```json
{
  "products": [...],
  "nextCursor": "eyJpZCI6IjEyMzQ1In0=",
  "hasMore": true
}
```

**WaveOrder will:**
- Follow `hasNext` or `hasMore` to fetch next page
- Use `page` parameter incrementally if no pagination object provided
- Stop when no more products are returned

---

## Incremental Sync (Updated Since)

WaveOrder supports incremental syncs using `updatedSince` parameter:

**Request:**
```
GET /products?updatedSince=2024-01-01T00:00:00Z
```

**Response:** Only return products where `updatedAt >= updatedSince`

This allows WaveOrder to sync only changed products, reducing API load.

---

## Brand Filtering

If `externalBrandIds` is configured (single ID or array), WaveOrder will filter products by brand:

**Request:**
```
GET /products?brandId=BRAND-123
```

**Response:** Only return products matching the specified brand ID(s)

---

## Error Handling

### Standard Error Response Format

```json
{
  "error": "Error message",
  "code": "ERROR_CODE",
  "details": {}
}
```

### HTTP Status Codes

| Status Code | Meaning | WaveOrder Behavior |
|-------------|---------|-------------------|
| 200 OK | Success | Process products |
| 401 Unauthorized | Invalid API key | Stop sync, log error |
| 403 Forbidden | Insufficient permissions | Stop sync, log error |
| 404 Not Found | Endpoint not found | Stop sync, log error |
| 429 Too Many Requests | Rate limit exceeded | Retry with exponential backoff |
| 500 Internal Server Error | Server error | Retry with exponential backoff |

### Rate Limiting

If your API has rate limits:
- Return `429 Too Many Requests` with `Retry-After` header
- WaveOrder will retry with exponential backoff
- Example: `Retry-After: 60` (retry after 60 seconds)

---

## Complete Example Response

### Simple Product List Response

```json
{
  "products": [
    {
      "id": "PROD-12345",
      "sku": "SKU-001",
      "name": "Wireless Mouse",
      "nameAl": "Miuse pa tela",
      "description": "Ergonomic wireless mouse",
      "descriptionAl": "Miuse pa tela ergonomike",
      "price": 29.99,
      "salePrice": 24.99,
      "originalPrice": 29.99,
      "isActive": true,
      "stockQuantity": 50,
      "stockStatus": "instock",
      "images": [
        "https://example.com/products/mouse/main.jpg",
        "https://example.com/products/mouse/gallery-1.jpg"
      ],
      "categoryName": "Electronics",
      "categoryNameAl": "Elektronikë",
      "productType": "simple",
      "variations": []
    },
    {
      "id": "PROD-67890",
      "sku": "TSHIRT-001",
      "name": "Classic T-Shirt",
      "nameAl": "T-Shirt Klasik",
      "description": "100% cotton t-shirt",
      "descriptionAl": "T-shirt 100% pambuk",
      "price": 19.99,
      "isActive": true,
      "stockQuantity": 0,
      "stockStatus": "outofstock",
      "productType": "variable",
      "images": [
        "https://example.com/products/tshirt/main.jpg"
      ],
      "categoryName": "Clothing",
      "categoryNameAl": "Veshje",
      "variations": [
        {
          "sku": "TSHIRT-001-SM-RED",
          "price": 19.99,
          "salePrice": 15.99,
          "originalPrice": 19.99,
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
        }
      ]
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 100,
    "total": 250,
    "totalPages": 3,
    "hasNext": true,
    "hasPrev": false
  }
}
```

---

## Testing Your API

### Test Checklist

- [ ] Products endpoint returns valid JSON
- [ ] Products include all required fields (`id`, `name`, `price`, `stockQuantity`, `productType`)
- [ ] Simple products have `productType: "simple"` and empty `variations: []`
- [ ] Variable products have `productType: "variable"` and non-empty `variations` array
- [ ] Each variation has required fields (`sku`, `price`, `stockQuantity`)
- [ ] Image URLs are publicly accessible HTTPS URLs
- [ ] Pagination works correctly
- [ ] Authentication works with provided API key
- [ ] Error responses follow standard format
- [ ] `updatedSince` parameter filters correctly (if supported)

### Sample Test Request

```bash
curl -X GET "https://api.example.com/products?page=1&limit=10" \
  -H "X-API-Key: YOUR_API_KEY" \
  -H "Content-Type: application/json"
```

---

## Summary Checklist

### For Simple Products:
- [ ] `id` (required) - Unique product identifier
- [ ] `name` or `nameAl` (required) - Product name
- [ ] `price` (required) - Regular price
- [ ] `stockQuantity` (required) - Stock quantity
- [ ] `productType: "simple"` (required)
- [ ] `variations: []` (required, empty array)
- [ ] `images` (optional) - Array of image URLs
- [ ] `salePrice` (optional) - Sale price if on sale
- [ ] `categoryName` (optional) - Category name

### For Variable Products:
- [ ] `id` (required) - Unique product identifier
- [ ] `name` or `nameAl` (required) - Product name
- [ ] `price` (required) - Base price
- [ ] `productType: "variable"` (required)
- [ ] `variations[]` (required) - Array of variation objects
  - [ ] Each variation: `sku` (required)
  - [ ] Each variation: `price` (required)
  - [ ] Each variation: `stockQuantity` (required)
  - [ ] Each variation: `image` (optional) - Variation-specific image
  - [ ] Each variation: `attributes` (optional) - e.g., `{ "Size": "Small", "Color": "Red" }`

---

## Support

For questions or issues:
- **Email:** support@waveorder.app
- **Documentation:** This specification will be updated as integration requirements evolve

---

## Changelog

### Version 1.0 (Current)
- Initial API specification
- Support for simple and variable products
- Image handling (product and variation images)
- Stock management
- Price handling (regular and sale prices)
- Category management
- Pagination support
- Incremental sync support
