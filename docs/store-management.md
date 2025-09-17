# WaveOrder SEO & Store Management Tasks

This document outlines tasks related to making stores searchable and implementing temporary store closure functionality.

## 1. Make Stores Searchable

### 1.1 Store SEO Metadata
**Task:** Implement dynamic SEO for individual store pages
- **Location:** `app/(public)/[slug]/page.tsx`
- **Description:** Generate SEO-optimized metadata for each store
- **Implementation:**
```typescript
export async function generateMetadata({ params }: { params: { slug: string } }) {
  const store = await getStoreBySlug(params.slug)
  
  return {
    title: `${store.name} - Order Online`,
    description: store.description || `Order from ${store.name} via WhatsApp`,
    openGraph: {
      title: store.name,
      description: store.description,
      images: [store.logo || '/default-store-image.png'],
      type: 'website'
    }
  }
}
```

### 1.2 Store Schema Markup
**Task:** Add structured data for stores
- **Location:** `components/store/StoreSchema.tsx`
- **Description:** JSON-LD markup for local business schema
- **Schema types:**
  - LocalBusiness (restaurant, store, etc.)
  - Menu schema for products
  - Organization schema
  - ContactPoint schema

### 1.3 Store Sitemap
**Task:** Include active stores in sitemap
- **Location:** `app/sitemap.ts`
- **Description:** Dynamically include all active store URLs
- **Implementation:**
```typescript
export default async function sitemap() {
  const stores = await prisma.business.findMany({
    where: { isActive: true },
    select: { slug: true, updatedAt: true }
  })
  
  const storeUrls = stores.map(store => ({
    url: `https://waveorder.app/${store.slug}`,
    lastModified: store.updatedAt,
    changeFrequency: 'daily',
    priority: 0.8
  }))
  
  return [...staticUrls, ...storeUrls]
}
```

### 1.4 SEO Fields in Database
**Task:** Add SEO fields to Business model
- **Location:** `prisma/schema.prisma`
- **Fields to add:**
```prisma
model Business {
  // ... existing fields
  
  // SEO fields
  metaTitle       String?
  metaDescription String?
  keywords        String[]
  isSearchable    Boolean @default(true)
}
```

### 1.5 Store SEO Settings Page
**Task:** Allow businesses to manage their SEO
- **Location:** `app/admin/stores/[businessId]/seo/page.tsx`
- **Features:**
  - Edit meta title and description
  - Manage keywords
  - Preview how store appears in search results
  - Toggle searchability on/off

## 2. Temporary Store Closure System

### 2.1 Store Status Database Schema
**Task:** Add closure fields to Business model
- **Location:** `prisma/schema.prisma`
- **Fields to add:**
```prisma
model Business {
  // ... existing fields
  
  // Store closure fields
  isTemporarilyClosed Boolean @default(false)
  closureReason      String?
  closureMessage     String?
  closureStartDate   DateTime?
  closureEndDate     DateTime?
}
```

### 2.2 Store Closure API Routes
**Task:** Create APIs to manage store closure
- **Location:** `app/api/business/[businessId]/closure/route.ts`
- **Endpoints:**
  - `POST /api/business/[businessId]/closure` - Close store temporarily
  - `DELETE /api/business/[businessId]/closure` - Reopen store
  - `GET /api/business/[businessId]/closure` - Get closure status

### 2.3 Store Closure Admin Interface
**Task:** Build closure management interface
- **Location:** `app/admin/stores/[businessId]/settings/closure.tsx`
- **Features:**
  - Toggle store open/closed status
  - Add closure reason (dropdown + custom)
  - Set closure message for customers
  - Optional closure duration (start/end dates)
  - Preview how closure appears to customers

### 2.4 Common Closure Reasons
**Task:** Provide predefined closure reasons
- **Implementation:** Predefined options in admin interface
- **Reasons:**
  - Holiday break
  - Staff shortage
  - Equipment maintenance
  - Inventory shortage
  - Family emergency
  - Seasonal closure
  - Renovation
  - Custom reason (free text)

### 2.5 Customer-Facing Closure Display
**Task:** Show closure information on store catalog
- **Location:** `app/(public)/[slug]/page.tsx`
- **Features:**
  - Prominent closure banner at top of catalog
  - Display closure reason and custom message
  - Show expected reopening date (if set)
  - Disable WhatsApp order button
  - Gray out or hide product listings (optional)

### 2.6 Closure Banner Component
**Task:** Create reusable closure banner
- **Location:** `components/store/ClosureBanner.tsx`
- **Features:**
  - Responsive design
  - Different styles based on closure reason
  - Countdown timer for scheduled reopening
  - Contact information for urgent inquiries

### 2.7 WhatsApp Button State Management
**Task:** Disable ordering when store is closed
- **Location:** `components/store/WhatsAppOrderButton.tsx`
- **Implementation:**
  - Check store closure status
  - Disable button when closed
  - Show alternative message ("Store temporarily closed")
  - Optionally show contact information for emergencies

### 2.8 Automatic Reopening
**Task:** Implement scheduled store reopening
- **Location:** `app/api/cron/reopen-stores/route.ts`
- **Description:** Cron job to automatically reopen stores
- **Features:**
  - Check stores with closureEndDate in the past
  - Automatically set isTemporarilyClosed to false
  - Clear closure fields
  - Log reopening events

## 3. Store Visibility Settings

### 3.1 Store Visibility Options
**Task:** Different levels of store visibility
- **Options:**
  - Public & Searchable (default)
  - Public but not searchable
  - Private (requires direct link)
  - Temporarily closed
  - Permanently closed/suspended

### 3.2 Privacy Settings API
**Task:** Manage store privacy settings
- **Location:** `app/api/business/[businessId]/privacy/route.ts`
- **Features:**
  - Update visibility settings
  - Manage search engine indexing
  - Handle private store access

## 4. Integration with Catalog

### 4.1 Catalog Conditional Rendering
**Task:** Update catalog to handle closure state
- **Location:** `app/(public)/[slug]/page.tsx`
- **Implementation:**
  - Show closure banner when store is closed
  - Disable product interactions
  - Hide or gray out pricing
  - Show alternative contact methods

### 4.2 SEO Handling for Closed Stores
**Task:** Proper SEO handling for temporarily closed stores
- **Implementation:**
  - Add "temporarily closed" to meta description
  - Use appropriate schema markup
  - Don't remove from sitemap (temporary closure)
  - Add structured data about closure

## Implementation Priority

### Phase 1 (Core Functionality)
1. Store closure database schema
2. Basic closure API endpoints
3. Admin interface for managing closure
4. Customer-facing closure banner

### Phase 2 (Enhanced Features)
1. SEO optimization for stores
2. Scheduled reopening functionality
3. Advanced closure reasons and messaging
4. Store privacy settings

### Phase 3 (Advanced SEO)
1. Comprehensive schema markup
2. SEO management interface for businesses
3. Advanced sitemap generation
4. Search performance monitoring

## Example Usage Scenarios

### Scenario 1: Holiday Closure
- Business sets closure for December 24-26
- Reason: "Holiday break"
- Message: "We're closed for Christmas holidays. Happy holidays from our family to yours!"
- Auto-reopening: December 27

### Scenario 2: Emergency Closure
- Business immediately closes store
- Reason: "Family emergency"
- Message: "Temporarily closed due to family emergency. We'll be back soon!"
- No end date set (manual reopening)

### Scenario 3: Maintenance
- Business schedules closure for next week
- Reason: "Equipment maintenance"
- Message: "Closed for kitchen equipment maintenance. Orders resume Monday!"
- Scheduled reopening with countdown timer