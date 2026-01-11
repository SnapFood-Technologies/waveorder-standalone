# WaveOrder Stock Sync API - Integration Guide

This guide explains how external systems can sync stock quantities with WaveOrder using our Stock Update API.

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

### Update Product Stock

**Endpoint:** `PUT /api/v1/products/{productId}/stock`

Updates the stock quantity for a product in WaveOrder.

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

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `productId` | string | No | Your external product ID (redundant if in URL path, but can be used for verification) |
| `sku` | string | No | Product SKU (required for first-time sync to match products) |
| `stockQuantity` | number | Yes | New stock quantity (must be non-negative integer) |
| `reason` | string | No | Reason for stock change (e.g., "order_created", "order_cancelled", "stock_adjustment", "restock", etc.) |
| `timestamp` | string | No | ISO 8601 datetime (ignored - server timestamp is used) |

#### Example Request

```bash
curl -X PUT "https://waveorder.app/api/v1/products/EXT-PROD-12345/stock" \
  -H "Authorization: Bearer YOUR_BUSINESS_ID" \
  -H "Content-Type: application/json" \
  -d '{
    "sku": "SKU-001",
    "stockQuantity": 50,
    "reason": "order_created"
  }'
```

#### JavaScript Example

```javascript
const businessId = 'YOUR_BUSINESS_ID';
const externalProductId = 'EXT-PROD-12345';

const response = await fetch(`https://waveorder.app/api/v1/products/${externalProductId}/stock`, {
  method: 'PUT',
  headers: {
    'Authorization': `Bearer ${businessId}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    sku: 'SKU-001',
    stockQuantity: 50,
    reason: 'order_created'
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

url = f"https://waveorder.app/api/v1/products/{external_product_id}/stock"

headers = {
    "Authorization": f"Bearer {business_id}",
    "Content-Type": "application/json"
}

data = {
    "sku": "SKU-001",
    "stockQuantity": 50,
    "reason": "order_created"
}

response = requests.put(url, headers=headers, json=data)
result = response.json()
print(result)
```

## Product Matching Logic

WaveOrder uses the following logic to find products:

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

> **Important:** For the first stock sync, always include the `sku` field in your request body to ensure proper product matching.

## Response Format

### Success Response (200 OK)

```json
{
  "success": true,
  "message": "Stock updated successfully",
  "productId": "waveorder_internal_product_id",
  "newStock": 50
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

#### 400 Bad Request - Missing stockQuantity

```json
{
  "success": false,
  "error": "stockQuantity is required",
  "code": "VALIDATION_ERROR"
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

#### 400 Bad Request - Inventory Tracking Disabled

```json
{
  "success": false,
  "error": "Inventory tracking is disabled for this product",
  "code": "INVENTORY_TRACKING_DISABLED"
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
| `VALIDATION_ERROR` | Missing or invalid request data | 400 |
| `PRODUCT_NOT_FOUND` | Product could not be matched | 404 |
| `INVENTORY_TRACKING_DISABLED` | Product has inventory tracking disabled | 400 |
| `INTERNAL_ERROR` | Server error | 500 |

## Rate Limits

Currently, there are no rate limits enforced. However, we recommend:

- **Reasonable frequency:** Don't send updates more frequently than necessary
- **Batch updates:** If you need to update multiple products, consider spacing requests by at least 100ms between each
- **Error handling:** Implement exponential backoff if you receive 5xx errors

> **Note:** Rate limits may be implemented in the future. We'll provide advance notice before implementing any limits.

## Best Practices

### 1. First-Time Setup

When syncing a product for the first time:

```json
{
  "sku": "YOUR-SKU-CODE",
  "stockQuantity": 100,
  "reason": "initial_sync"
}
```

This ensures WaveOrder can match your product by SKU.

### 2. Subsequent Updates

After the first sync, you can omit the `sku` field:

```json
{
  "stockQuantity": 95,
  "reason": "order_created"
}
```

The external product ID in the URL is sufficient for matching.

### 3. Reason Field

Use descriptive reasons to help track inventory changes:

- `"order_created"` - Stock decreased due to order
- `"order_cancelled"` - Stock increased due to cancelled order
- `"restock"` - Manual restocking
- `"stock_adjustment"` - Manual adjustment
- `"loss"` - Stock lost/damaged
- `"return"` - Product returned

### 4. Error Handling

Always check the `success` field in the response:

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

### 5. Idempotency

The API is idempotent. If you send the same stock quantity multiple times, subsequent requests with the same value will return success but won't create duplicate inventory activities.

## Testing

### Test with cURL

```bash
# Replace YOUR_BUSINESS_ID and EXTERNAL_PRODUCT_ID with your actual values
curl -X PUT "https://waveorder.app/api/v1/products/EXTERNAL_PRODUCT_ID/stock" \
  -H "Authorization: Bearer YOUR_BUSINESS_ID" \
  -H "Content-Type: application/json" \
  -d '{
    "sku": "TEST-SKU-001",
    "stockQuantity": 10,
    "reason": "test_sync"
  }'
```

### Verify in WaveOrder Dashboard

After a successful sync:

1. Log into your WaveOrder admin dashboard
2. Go to **Inventory** → **Products**
3. Find the product and check its stock quantity
4. Go to **Inventory** → **Activity** to see the inventory activity entry with reason "External system: test_sync"

## Support

For questions or issues:

- **Email:** support@waveorder.app
- **Documentation:** This guide will be updated as the API evolves

## Changelog

### Version 1.0 (Current)

- Initial API release
- Support for external product ID matching
- SKU-based product matching for first-time sync
- Inventory activity tracking with external system reasons
