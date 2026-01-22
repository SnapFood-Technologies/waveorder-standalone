# Analytics System Documentation

**WaveOrder Analytics** - Comprehensive visitor tracking and business intelligence system

---

## Table of Contents

1. [Overview](#overview)
2. [Architecture](#architecture)
3. [Data Models](#data-models)
4. [Tracking Implementation](#tracking-implementation)
5. [API Endpoints](#api-endpoints)
6. [UI Components](#ui-components)
7. [UTM Parameters](#utm-parameters)
8. [Geographic Tracking](#geographic-tracking)
9. [Device Detection](#device-detection)
10. [Privacy & Bot Filtering](#privacy--bot-filtering)
11. [Data Aggregation](#data-aggregation)
12. [Usage Examples](#usage-examples)

---

## Overview

The WaveOrder analytics system provides comprehensive visitor tracking and business intelligence for all businesses on the platform. It combines:

- **Individual session tracking** (VisitorSession model) - Granular, event-based data
- **Legacy aggregated data** (Analytics model) - Historical daily summaries
- **Real-time metrics** - Dashboard statistics and insights
- **Geographic intelligence** - Country, city, and region tracking
- **Traffic source attribution** - UTM parameters and referrer analysis
- **Device analytics** - Browser, OS, and device type detection

### Key Features

✅ **Privacy-first**: Bot filtering, private IP detection  
✅ **UTM tracking**: Full support for source, medium, campaign, term, content, placement  
✅ **Geographic data**: IP-based geolocation with city-level accuracy  
✅ **Device detection**: Browser, OS, device type identification  
✅ **Historical continuity**: Combines old and new data for complete reporting  
✅ **Real-time updates**: Instant tracking without page refresh  

---

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Storefront Visitor                        │
│         (URL with UTM params, IP, User Agent, Referrer)     │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│           Server-Side Request (page.tsx)                     │
│   - Extract headers (IP, User-Agent, Referrer)              │
│   - Forward to API with searchParams                         │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│       API Route: /api/storefront/[slug]/route.ts            │
│   - Extract IP from headers (cf-connecting-ip, x-real-ip,   │
│     x-forwarded-for)                                         │
│   - Call trackVisitorSession()                               │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│      lib/trackVisitorSession.ts                              │
│   1. Extract UTM params from URL                             │
│   2. Parse referrer data                                     │
│   3. Detect device/browser/OS                                │
│   4. Get geolocation from IP                                 │
│   5. Filter bots and private IPs                             │
│   6. Create VisitorSession record                            │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│                    MongoDB Database                          │
│   - VisitorSession collection (granular data)                │
│   - Analytics collection (legacy aggregated data)            │
└─────────────────────────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│              Analytics API Endpoints                         │
│   - /analytics/advanced (traffic sources)                    │
│   - /analytics/geographic (countries, cities)                │
│   - /metrics (dashboard stats)                               │
│   → Aggregate VisitorSession + Analytics data                │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│                   UI Components                              │
│   - Analytics Page (trends, products, time, customers)       │
│   - Advanced Analytics (geo, sources)                        │
│   - Dashboard Metrics (views, orders, revenue)               │
└─────────────────────────────────────────────────────────────┘
```

---

## Data Models

### 1. VisitorSession Model

**Purpose**: Track individual visitor sessions with granular data

**Location**: `prisma/schema.prisma`

```prisma
model VisitorSession {
  id         String   @id @default(auto()) @map("_id") @db.ObjectId
  businessId String   @db.ObjectId
  business   Business @relation(fields: [businessId], references: [id], onDelete: Cascade)

  // UTM Parameters (from URL query params)
  source    String? // utm_source or parsed from referrer
  medium    String? // utm_medium: "referral", "cpc", "organic"
  campaign  String? // utm_campaign: "summer_sale", "newsletter"
  term      String? // utm_term: search keywords
  content   String? // utm_content: ad variation
  placement String? // Custom placement parameter

  // Referrer Information
  referrer     String? // HTTP referer header
  referrerHost String? // Parsed hostname from referrer

  // Geographic Data
  country   String? // "Greece", "Albania"
  city      String? // "Athens", "Tirana"
  region    String? // "Attica", "Tirana County"
  latitude  Float?  // Geographic coordinates
  longitude Float?

  // Device Information
  deviceType String? // "mobile", "desktop", "tablet"
  browser    String? // "Chrome", "Safari"
  os         String? // "iOS", "Android", "Windows"

  // Technical Metadata
  ipAddress String? // Client IP (consider hashing for privacy)
  userAgent String? // User agent string

  // Timestamps
  visitedAt DateTime @default(now())
  createdAt DateTime @default(now())

  // Indexes for fast queries
  @@index([businessId])
  @@index([businessId, visitedAt])
  @@index([businessId, source])
  @@index([businessId, medium])
  @@index([businessId, campaign])
  @@index([visitedAt])
}
```

### 2. Analytics Model (Legacy)

**Purpose**: Historical daily aggregated data

**Location**: `prisma/schema.prisma`

```prisma
model Analytics {
  id         String   @id @default(auto()) @map("_id") @db.ObjectId
  businessId String   @db.ObjectId
  business   Business @relation(fields: [businessId], references: [id], onDelete: Cascade)

  date      DateTime
  visitors  Int      @default(0)
  orders    Int      @default(0)
  revenue   Float    @default(0)
  
  country   String?
  city      String?
  source    String?

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}
```

**Note**: The `@@unique([businessId, date])` constraint was removed to support multiple entries per day (different sources/locations).

---

## Tracking Implementation

### Core Function: trackVisitorSession

**Location**: `src/lib/trackVisitorSession.ts`

**Flow**:

1. **Bot Detection**: Skip known bots and crawlers
2. **IP Validation**: Filter private/internal IPs
3. **UTM Extraction**: Parse all UTM parameters from URL
4. **Referrer Analysis**: Extract hostname and determine source
5. **Source Priority**: UTM source > Referrer hostname > 'direct'
6. **Medium Inference**: Auto-detect if not provided
7. **Device Parsing**: Extract browser, OS, device type
8. **Geolocation**: Lookup country, city, region from IP
9. **Database Insert**: Create VisitorSession record

```typescript
export async function trackVisitorSession(
  businessId: string,
  trackingData: {
    ipAddress?: string
    userAgent?: string
    referrer?: string
    url: string
  }
): Promise<void>
```

**Example Usage**:

```typescript
await trackVisitorSession(businessId, {
  ipAddress: '94.66.136.158',
  userAgent: 'Mozilla/5.0...',
  referrer: 'https://google.com',
  url: 'https://waveorder.app/store?utm_source=facebook&utm_campaign=summer'
})
```

### IP Extraction

**Priority Order** (from `src/app/api/storefront/[slug]/route.ts`):

1. `cf-connecting-ip` (Cloudflare)
2. `x-real-ip` (Nginx)
3. `x-forwarded-for` (First IP = original client)
4. `request.ip` (fallback)

```typescript
let ipAddress: string | undefined

// Cloudflare
const cfIP = request.headers.get('cf-connecting-ip')
if (cfIP) {
  ipAddress = cfIP.trim()
} else {
  // Nginx
  const realIP = request.headers.get('x-real-ip')
  if (realIP) {
    ipAddress = realIP.trim()
  } else {
    // x-forwarded-for - FIRST IP is the original client
    const forwardedFor = request.headers.get('x-forwarded-for')
    if (forwardedFor) {
      const ips = forwardedFor.split(',').map(ip => ip.trim()).filter(ip => ip)
      ipAddress = ips.length > 0 ? ips[0] : undefined
    }
  }
}
```

---

## API Endpoints

### 1. Advanced Analytics

**Endpoint**: `GET /api/admin/stores/[businessId]/analytics/advanced`

**Query Parameters**:
- `startDate` (ISO string)
- `endDate` (ISO string)

**Response**:
```json
{
  "totalViews": 450,
  "uniqueVisitors": 320,
  "trafficTrends": [
    { "date": "2026-01-20", "views": 45, "visitors": 32 },
    { "date": "2026-01-21", "views": 52, "visitors": 38 }
  ],
  "sourceStats": [
    {
      "source": "google",
      "visitors": 120,
      "orders": 15,
      "revenue": 450.50,
      "conversionRate": "12.5",
      "percentage": "37.5"
    }
  ],
  "campaignStats": [...],
  "mediumStats": [...],
  "placementStats": [...]
}
```

**Data Sources**: Combines `Analytics` + `VisitorSession`

---

### 2. Geographic Analytics

**Endpoint**: `GET /api/admin/stores/[businessId]/analytics/geographic`

**Query Parameters**:
- `startDate` (ISO string)
- `endDate` (ISO string)

**Response**:
```json
{
  "countries": [
    {
      "country": "Greece",
      "visitors": 150,
      "orders": 20,
      "revenue": 600.00,
      "conversionRate": "13.3",
      "percentage": "45.5"
    }
  ],
  "cities": [
    {
      "city": "Athens",
      "country": "Greece",
      "visitors": 100,
      "orders": 15,
      "revenue": 450.00,
      "conversionRate": "15.0",
      "percentage": "30.3"
    }
  ]
}
```

---

### 3. Dashboard Metrics

**Endpoint**: `GET /api/admin/stores/[businessId]/metrics`

**Query Parameters**:
- `startDate` (ISO string)
- `endDate` (ISO string)

**Response**:
```json
{
  "metrics": {
    "views": 450,
    "orders": 25,
    "revenue": 750.50,
    "growth": 15,
    "ordersByStatus": [
      { "status": "DELIVERED", "count": 15, "label": "Delivered", "color": "#10b981" }
    ]
  },
  "period": {
    "startDate": "2026-01-01T00:00:00.000Z",
    "endDate": "2026-01-22T23:59:59.999Z"
  }
}
```

**Data Sources**: Combines `Analytics.visitors` + `VisitorSession.count`

---

### 4. SuperAdmin Stats

**Endpoint**: `GET /api/superadmin/stats`

**Query Parameters**:
- `startDate` (ISO string)
- `endDate` (ISO string)

**Response**:
```json
{
  "totalBusinesses": 25,
  "activeBusinesses": 20,
  "totalUsers": 150,
  "monthlyGrowth": 12.5,
  "recentSignups": 5,
  "totalPageViews": 5420
}
```

**Data Sources**: Aggregates across all businesses (Analytics + VisitorSession)

---

## UI Components

### 1. Analytics Page

**Location**: `src/app/admin/stores/[businessId]/analytics/page.tsx`

**Component**: `src/components/admin/analytics/Analytics.tsx`

**Features**:
- **Overview Tab**: Total views, visitors, orders, revenue, conversion rate
- **Trends Tab**: Daily traffic charts and growth metrics
- **Products Tab**: Best-selling products with conversion rates
- **Time Analysis Tab**: Peak hours, day-of-week patterns
- **Customers Tab**: New vs returning, customer lifetime value
- **CTA**: Link to Advanced Analytics for deeper insights

**Data Fetching**:
```typescript
const response = await fetch(
  `/api/admin/stores/${businessId}/analytics/advanced?startDate=${start}&endDate=${end}`
)
```

---

### 2. Advanced Analytics Page

**Location**: `src/app/admin/stores/[businessId]/advanced-analytics/page.tsx`

**Component**: `src/components/admin/analytics/AdvancedAnalytics.tsx`

**Features**:
- **Geographic Data**: Countries and cities with maps
- **Traffic Sources**: Sources, campaigns, mediums, placements
- **Conversion Tracking**: Revenue and conversion rates by source
- **Trend Analysis**: Time-based patterns

**Data Fetching**:
```typescript
// Geographic data
const geoResponse = await fetch(
  `/api/admin/stores/${businessId}/analytics/geographic?startDate=${start}&endDate=${end}`
)

// Traffic sources
const advancedResponse = await fetch(
  `/api/admin/stores/${businessId}/analytics/advanced?startDate=${start}&endDate=${end}`
)
```

---

### 3. Dashboard Metrics

**Location**: `src/components/admin/dashboard/DashboardMetrics.tsx`

**Features**:
- Views, Orders, Revenue cards
- Growth percentage vs previous period
- Orders by status pie chart
- Geographic preview (top countries/cities)

**Data Fetching**:
```typescript
const response = await fetch(
  `/api/admin/stores/${businessId}/metrics?startDate=${start}&endDate=${end}`
)
```

---

## UTM Parameters

### Supported Parameters

| Parameter | Key | Example | Description |
|-----------|-----|---------|-------------|
| Source | `utm_source` | `google`, `facebook`, `newsletter` | Traffic source |
| Medium | `utm_medium` | `cpc`, `email`, `social`, `organic` | Marketing medium |
| Campaign | `utm_campaign` | `summer_sale`, `new_product_launch` | Campaign name |
| Term | `utm_term` | `running shoes`, `best pizza` | Search keywords (PPC) |
| Content | `utm_content` | `banner_ad`, `text_link` | Ad variation |
| Placement | `placement` | `header`, `footer`, `sidebar` | Custom placement (non-standard) |

### URL Example

```
https://waveorder.app/neps-shop?utm_source=facebook&utm_medium=social&utm_campaign=summer_sale&utm_content=video_ad&placement=feed
```

### Source Determination Priority

1. **UTM Source**: If `utm_source` exists, use it
2. **Referrer Hostname**: If no UTM, parse from referrer (e.g., `google.com` → `google`)
3. **Direct**: If no UTM and no referrer → `direct`

### Medium Inference

If `utm_medium` is not provided, it's inferred from the source:

```typescript
// Auto-detect medium from source
if (!medium) {
  if (source === 'google' || source === 'bing' || source === 'yahoo') {
    medium = 'organic'
  } else if (source.includes('facebook') || source.includes('instagram') || 
             source.includes('twitter') || source.includes('linkedin')) {
    medium = 'social'
  } else if (source !== 'direct') {
    medium = 'referral'
  }
}
```

### Extraction Function

**Location**: `src/lib/geolocation.ts`

```typescript
export function extractUTMParams(searchParams: URLSearchParams): {
  source?: string
  medium?: string
  campaign?: string
  term?: string
  content?: string
  placement?: string
} {
  return {
    source: searchParams.get('utm_source') || undefined,
    medium: searchParams.get('utm_medium') || undefined,
    campaign: searchParams.get('utm_campaign') || undefined,
    term: searchParams.get('utm_term') || undefined,
    content: searchParams.get('utm_content') || undefined,
    placement: searchParams.get('placement') || undefined
  }
}
```

---

## Geographic Tracking

### IP Geolocation Service

**Provider**: `ip-api.com` (free tier)

**Function**: `getLocationFromIP()`

**Location**: `src/lib/geolocation.ts`

```typescript
export async function getLocationFromIP(ip: string): Promise<{
  country?: string
  city?: string
  region?: string
  latitude?: number
  longitude?: number
} | null> {
  try {
    const response = await fetch(`http://ip-api.com/json/${ip}`)
    const data = await response.json()
    
    if (data.status === 'success') {
      return {
        country: data.country,
        city: data.city,
        region: data.regionName,
        latitude: data.lat,
        longitude: data.lon
      }
    }
    return null
  } catch (error) {
    return null // Fail silently
  }
}
```

### Accuracy

- **Country**: ~99% accurate
- **City**: ~80-95% accurate (depends on IP database)
- **Coordinates**: Approximate (city-level, not exact address)

### Privacy Considerations

- IP addresses are stored but can be hashed for privacy
- Geolocation is optional (fails silently if unavailable)
- No personal data collected beyond IP and user agent

---

## Device Detection

### User Agent Parsing

**Function**: `parseUserAgent()`

**Location**: `src/lib/geolocation.ts`

```typescript
export function parseUserAgent(userAgent: string): {
  deviceType: 'mobile' | 'tablet' | 'desktop'
  browser: string
  os: string
} {
  const ua = userAgent.toLowerCase()
  
  // Device Type
  let deviceType: 'mobile' | 'tablet' | 'desktop' = 'desktop'
  if (/mobile|android|iphone|ipod|blackberry|windows phone/i.test(ua)) {
    deviceType = 'mobile'
  } else if (/ipad|tablet|kindle/i.test(ua)) {
    deviceType = 'tablet'
  }
  
  // Browser
  let browser = 'Unknown'
  if (ua.includes('chrome')) browser = 'Chrome'
  else if (ua.includes('safari')) browser = 'Safari'
  else if (ua.includes('firefox')) browser = 'Firefox'
  else if (ua.includes('edge')) browser = 'Edge'
  else if (ua.includes('opera')) browser = 'Opera'
  
  // OS
  let os = 'Unknown'
  if (ua.includes('windows')) os = 'Windows'
  else if (ua.includes('mac')) os = 'macOS'
  else if (ua.includes('linux')) os = 'Linux'
  else if (ua.includes('android')) os = 'Android'
  else if (ua.includes('ios') || ua.includes('iphone') || ua.includes('ipad')) os = 'iOS'
  
  return { deviceType, browser, os }
}
```

---

## Privacy & Bot Filtering

### Bot Detection

**Function**: `isBot()`

**Location**: `src/lib/geolocation.ts`

**Detected Bots**:
- Googlebot
- Bingbot
- Facebook crawler
- Twitter bot
- LinkedIn bot
- Semrush
- Ahrefs
- And other common crawlers

```typescript
export function isBot(userAgent?: string): boolean {
  if (!userAgent) return false
  
  const botPatterns = [
    'bot', 'crawler', 'spider', 'scraper',
    'googlebot', 'bingbot', 'slurp', 'duckduckbot',
    'facebookexternalhit', 'twitterbot', 'linkedinbot',
    'semrushbot', 'ahrefsbot', 'dotbot'
  ]
  
  return botPatterns.some(pattern => 
    userAgent.toLowerCase().includes(pattern)
  )
}
```

### Private IP Detection

**Function**: `isPrivateIP()`

**Location**: `src/lib/geolocation.ts`

**Filtered IPs**:
- Localhost: `127.0.0.1`, `::1`
- Private ranges: `10.x.x.x`, `192.168.x.x`, `172.16-31.x.x`
- Link-local: `169.254.x.x`
- Known bot IPs: Microsoft Azure (`20.84.x.x`, `40.76.x.x`, `52.167.x.x`)

```typescript
export function isPrivateIP(ip: string): boolean {
  if (ip === '127.0.0.1' || ip === '::1' || ip === 'localhost') {
    return true
  }
  
  // Private IPv4 ranges
  if (ip.startsWith('10.') || ip.startsWith('192.168.') || 
      ip.startsWith('172.16.') || ip.startsWith('169.254.')) {
    return true
  }
  
  // Known bot IPs (Microsoft Azure, etc.)
  if (ip.startsWith('20.84.') || ip.startsWith('40.76.') || 
      ip.startsWith('52.167.')) {
    return true
  }
  
  return false
}
```

---

## Data Aggregation

### Combining Old and New Data

All analytics endpoints combine data from both sources:

```typescript
// Fetch both data sources
const oldAnalytics = await prisma.analytics.findMany({
  where: {
    businessId,
    date: { gte: startDate, lte: endDate }
  }
})

const visitorSessions = await prisma.visitorSession.findMany({
  where: {
    businessId,
    visitedAt: { gte: startDate, lte: endDate }
  }
})

// Aggregate
const oldViews = oldAnalytics.reduce((sum, a) => sum + a.visitors, 0)
const newViews = visitorSessions.length
const totalViews = oldViews + newViews
```

### Percentage Formatting

All percentages are formatted to **1 decimal place**:

```typescript
const percentage = ((value / total) * 100).toFixed(1)
```

---

## Usage Examples

### Example 1: Track a Marketing Campaign

**URL**:
```
https://waveorder.app/pizza-shop?utm_source=instagram&utm_medium=social&utm_campaign=friday_special&utm_content=story_ad
```

**Tracked Data**:
- `source`: `instagram`
- `medium`: `social`
- `campaign`: `friday_special`
- `content`: `story_ad`
- Plus: country, city, device, browser

### Example 2: Track Email Newsletter

**URL**:
```
https://waveorder.app/coffee-shop?utm_source=newsletter&utm_medium=email&utm_campaign=weekly_digest
```

**Tracked Data**:
- `source`: `newsletter`
- `medium`: `email`
- `campaign`: `weekly_digest`

### Example 3: Track Google Ads

**URL**:
```
https://waveorder.app/gym?utm_source=google&utm_medium=cpc&utm_campaign=fitness_jan&utm_term=gym+near+me&utm_content=text_ad_1
```

**Tracked Data**:
- `source`: `google`
- `medium`: `cpc`
- `campaign`: `fitness_jan`
- `term`: `gym near me`
- `content`: `text_ad_1`

### Example 4: View Analytics in Dashboard

```typescript
// Admin dashboard
const response = await fetch(
  `/api/admin/stores/${businessId}/analytics/advanced?` +
  `startDate=2026-01-01T00:00:00.000Z&endDate=2026-01-31T23:59:59.999Z`
)

const data = await response.json()
console.log(data.sourceStats) // Traffic by source
console.log(data.campaignStats) // Traffic by campaign
```

---

## Best Practices

### 1. UTM Naming Conventions

- **Use lowercase**: `utm_source=facebook` (not `Facebook`)
- **Use underscores**: `utm_campaign=summer_sale` (not `summer-sale` or `summer sale`)
- **Be consistent**: Always use the same naming for recurring campaigns
- **Be descriptive**: `utm_content=banner_top` is better than `utm_content=1`

### 2. Campaign Tracking

- **Always include source and medium**: Minimum required for accurate attribution
- **Use campaigns for initiatives**: `utm_campaign=black_friday_2026`
- **Use content for variations**: `utm_content=red_button` vs `utm_content=blue_button`
- **Use term for paid search**: `utm_term=best+coffee+shop`

### 3. Data Privacy

- **Anonymize IPs**: Consider hashing IPs before storage
- **GDPR compliance**: Inform users about analytics tracking
- **Bot filtering**: Keep bot filter updated with new patterns
- **Retention policy**: Consider purging old visitor sessions

### 4. Performance

- **Async tracking**: Tracking runs in background, doesn't block response
- **Silent failures**: Geolocation/device detection fail gracefully
- **Efficient queries**: Use indexed fields (businessId, visitedAt, source)
- **Data cleanup**: Periodically remove very old sessions

---

## Troubleshooting

### Issue: Traffic showing as "Direct"

**Possible causes**:
1. No UTM parameters in URL
2. Referrer header blocked/stripped
3. Private browsing mode
4. HTTPS → HTTP transition (referrer stripped)

**Solution**: Always use UTM parameters for marketing campaigns

---

### Issue: Wrong country/city detected

**Possible causes**:
1. User behind VPN
2. Corporate proxy
3. IP geolocation database outdated
4. Cloud/hosting IP (AWS, Azure, etc.)

**Solution**: IP geolocation is approximate; accept 80-95% accuracy

---

### Issue: No analytics data appearing

**Check**:
1. Prisma schema migrated: `npx prisma db push`
2. VisitorSession model exists in database
3. Bot filtering not too aggressive
4. IP not in private range
5. Server logs for tracking errors

---

### Issue: Percentages showing multiple decimals

**Fixed**: All percentages now use `.toFixed(1)` for 1 decimal place

---

## Migration Notes

### From Old to New System

**Old System** (Analytics model):
- Daily aggregation with `@@unique([businessId, date])`
- Only one source/country per day
- Data overwriting issue

**New System** (VisitorSession model):
- Event-based tracking (one record per visit)
- Multiple sources/countries per day
- Complete attribution data

**Backwards Compatibility**:
- All endpoints aggregate both old and new data
- Historical data preserved
- Seamless transition for users

---

## Future Enhancements

- [ ] **Funnel Analytics**: Track conversion steps
- [ ] **Cohort Analysis**: User retention over time
- [ ] **A/B Testing**: Compare campaign variations
- [ ] **Real-time Dashboard**: WebSocket-based live updates
- [ ] **Custom Events**: Track button clicks, form submissions
- [ ] **Revenue Attribution**: Multi-touch attribution models
- [ ] **Data Export**: CSV/Excel download for external analysis
- [ ] **Anomaly Detection**: Automatic spike/drop alerts

---

## Support

For questions or issues:
- Check logs: `src/app/api/storefront/[slug]/route.ts`
- Review tracking: `src/lib/trackVisitorSession.ts`
- Test endpoint: Create `/api/test-tracking` for debugging (temporary)

---

**Last Updated**: January 22, 2026  
**Version**: 2.0 (VisitorSession + Analytics combined system)
