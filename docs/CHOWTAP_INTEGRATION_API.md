# WaveOrder Integration API Documentation — ChowTap

**Version:** 1.0
**Last Updated:** February 11, 2026
**Base URL:** `https://waveorder.app/api/integrations/chowtap`

---

## Authentication

All API requests require an API key provided by WaveOrder.

Include the key in **one** of the following headers:

```
Authorization: Bearer wo_int_YOUR_API_KEY
```

or

```
X-API-Key: wo_int_YOUR_API_KEY
```

### Rate Limiting

- **60 requests per minute** per API key
- Rate limit headers included in every response:
  - `X-RateLimit-Limit` — Max requests per window
  - `X-RateLimit-Remaining` — Remaining requests
  - `X-RateLimit-Reset` — Unix timestamp when the window resets
- When exceeded, you receive a `429 Too Many Requests` with a `Retry-After` header

### Error Responses

All errors return JSON:

```json
{
  "error": "Description of the error"
}
```

| Status Code | Meaning |
|-------------|---------|
| 400 | Bad Request — missing or invalid parameters |
| 401 | Unauthorized — missing or invalid API key |
| 403 | Forbidden — API key does not belong to this integration |
| 404 | Not Found — business does not exist |
| 409 | Conflict — business is not connected (on disconnect) |
| 429 | Rate limit exceeded |
| 500 | Internal server error |

---

## Endpoints

### 1. List Available Businesses

Returns WaveOrder businesses that are **not yet connected** to ChowTap. Use this to discover businesses you can onboard.

```
GET /api/integrations/chowtap/available
```

**Query Parameters:**

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `page` | integer | No | 1 | Page number |
| `limit` | integer | No | 50 | Results per page (max 100) |
| `search` | string | No | — | Search by business name or slug |
| `businessType` | string | No | — | Filter by type (e.g., `RESTAURANT`, `RETAIL`, `INSTAGRAM_SELLER`, `SALON`) |

**Example Request:**

```bash
curl -X GET "https://waveorder.app/api/integrations/chowtap/available?search=pizza&businessType=RESTAURANT" \
  -H "Authorization: Bearer wo_int_YOUR_API_KEY"
```

**Example Response (200):**

```json
{
  "businesses": [
    {
      "businessId": "697b831ab3893369d3a6c9c2",
      "businessName": "Pizza Palace",
      "businessSlug": "pizza-palace",
      "businessType": "RESTAURANT",
      "currency": "USD",
      "country": "United States",
      "createdAt": "2026-01-15T10:30:00.000Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 50,
    "total": 1,
    "pages": 1
  },
  "integrationSlug": "chowtap"
}
```

---

### 2. Connect a Business

Links a WaveOrder business to a ChowTap user account. Stores the ChowTap user ID on the WaveOrder side for future reference.

```
POST /api/integrations/chowtap/connect
```

**Request Body (JSON):**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `businessId` | string | Yes | The WaveOrder business ID |
| `externalUserId` | string | Yes | The ChowTap user/account ID for this business |

**Example Request:**

```bash
curl -X POST "https://waveorder.app/api/integrations/chowtap/connect" \
  -H "Authorization: Bearer wo_int_YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "businessId": "697b831ab3893369d3a6c9c2",
    "externalUserId": "cht_user_abc123"
  }'
```

**Example Response (200):**

```json
{
  "success": true,
  "businessId": "697b831ab3893369d3a6c9c2",
  "businessName": "Pizza Palace",
  "integrationSlug": "chowtap",
  "externalUserId": "cht_user_abc123"
}
```

**Notes:**
- If the business is already connected, calling connect again will **update** the `externalUserId`.
- The `businessId` must be a valid WaveOrder business ID (obtained from the `/available` endpoint).

---

### 3. List Connected Businesses

Returns all WaveOrder businesses currently linked to ChowTap.

```
GET /api/integrations/chowtap/businesses
```

**Query Parameters:**

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `page` | integer | No | 1 | Page number |
| `limit` | integer | No | 50 | Results per page (max 100) |

**Example Request:**

```bash
curl -X GET "https://waveorder.app/api/integrations/chowtap/businesses" \
  -H "Authorization: Bearer wo_int_YOUR_API_KEY"
```

**Example Response (200):**

```json
{
  "businesses": [
    {
      "businessId": "697b831ab3893369d3a6c9c2",
      "businessName": "Pizza Palace",
      "businessSlug": "pizza-palace",
      "businessType": "RESTAURANT",
      "isActive": true,
      "externalUserId": "cht_user_abc123",
      "createdAt": "2026-01-15T10:30:00.000Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 50,
    "total": 1,
    "pages": 1
  },
  "integrationSlug": "chowtap"
}
```

---

### 4. Check Connection Status

Check if a specific WaveOrder business is connected to ChowTap.

```
GET /api/integrations/chowtap/status
```

**Query Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `businessId` | string | Yes | The WaveOrder business ID to check |

**Example Request:**

```bash
curl -X GET "https://waveorder.app/api/integrations/chowtap/status?businessId=697b831ab3893369d3a6c9c2" \
  -H "Authorization: Bearer wo_int_YOUR_API_KEY"
```

**Example Response — Connected (200):**

```json
{
  "connected": true,
  "businessId": "697b831ab3893369d3a6c9c2",
  "businessName": "Pizza Palace",
  "businessSlug": "pizza-palace",
  "businessType": "RESTAURANT",
  "isActive": true,
  "externalUserId": "cht_user_abc123",
  "integrationSlug": "chowtap"
}
```

**Example Response — Not Connected (200):**

```json
{
  "connected": false,
  "businessId": "697b831ab3893369d3a6c9c2",
  "businessName": "Pizza Palace",
  "businessSlug": "pizza-palace",
  "businessType": "RESTAURANT",
  "isActive": true,
  "externalUserId": null,
  "integrationSlug": "chowtap"
}
```

---

### 5. Disconnect a Business

Removes the link between a WaveOrder business and ChowTap.

```
POST /api/integrations/chowtap/disconnect
```

**Request Body (JSON):**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `businessId` | string | Yes | The WaveOrder business ID to disconnect |

**Example Request:**

```bash
curl -X POST "https://waveorder.app/api/integrations/chowtap/disconnect" \
  -H "Authorization: Bearer wo_int_YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "businessId": "697b831ab3893369d3a6c9c2"
  }'
```

**Example Response (200):**

```json
{
  "success": true,
  "businessId": "697b831ab3893369d3a6c9c2",
  "businessName": "Pizza Palace",
  "integrationSlug": "chowtap",
  "message": "Business disconnected successfully"
}
```

**Error — Business Not Connected (409):**

```json
{
  "error": "Business is not connected to chowtap"
}
```

---

## Typical Integration Flow

```
1. DISCOVER      GET  /available          → Browse businesses to onboard
2. CONNECT       POST /connect            → Link a business to ChowTap
3. VERIFY        GET  /status             → Confirm connection was successful
4. LIST          GET  /businesses          → View all connected businesses
5. DISCONNECT    POST /disconnect          → Unlink a business when needed
```

### Suggested Implementation on ChowTap Side

1. **Business Onboarding Screen:** Call `GET /available` to show a list of WaveOrder businesses that can be connected. Support search and business type filtering.

2. **Connect Action:** When a ChowTap admin selects a business to link, call `POST /connect` with the WaveOrder `businessId` and the ChowTap user/account ID.

3. **Dashboard:** Call `GET /businesses` to display all currently connected WaveOrder businesses. Store the `externalUserId` mapping for cross-referencing.

4. **Health Check:** Periodically call `GET /status` to verify connections are still active.

5. **Disconnect:** Provide a "Disconnect" option per business that calls `POST /disconnect`.

---

## Data Stored on Each Side

| WaveOrder Stores | ChowTap Should Store |
|------------------|---------------------|
| `business.externalIds.chowtap = "cht_user_abc123"` | `waveorderBusinessId = "697b831ab3893369d3a6c9c2"` |

Both systems can reference each other using these IDs for any future cross-platform functionality (e.g., syncing QR codes, catalogs, etc.).

---

## Support

For API issues or questions:
- **Email:** waveorderweb@gmail.com
- **Website:** https://waveorder.app
