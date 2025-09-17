# WaveOrder Development Tasks

This document outlines the key development tasks needed to complete the WaveOrder application based on the current setup wizard implementation.

## 1. Dynamic Content Based on Business Type

### 1.1 Business Type-Specific Copy
**Task:** Update setup step content based on selected business type
- **Location:** `components/setup/steps/DeliveryMethodsStep.tsx` and other steps
- **Description:** 
  - Restaurant: "delivery", "pickup", "dine-in"
  - Retail: "shipping", "pickup", "in-store shopping"
  - Cafe: "delivery", "pickup", "takeaway"
  - Jewelry: "shipping", "pickup", "appointment viewing"
  - Florist: "delivery", "pickup", "local delivery"
  - Grocery: "delivery", "pickup", "curbside"
- **Implementation:** Create business type mapping object with appropriate terminology

### 1.2 Dynamic Step Previews
**Task:** Update mobile previews in setup steps to reflect business type
- **Location:** All setup step components with preview sections
- **Description:** Show relevant preview content (menu items for restaurant, products for retail, etc.)
- **Implementation:** Conditional rendering based on `data.businessType`

## 2. Public Catalog System

### 2.1 Create Catalog Page
**Task:** Build public-facing catalog page accessible via slug
- **Location:** `app/(public)/[slug]/page.tsx`
- **Description:** Public storefront where customers can browse products and initiate WhatsApp orders
- **Features:**
  - Responsive product catalog
  - Category filtering
  - WhatsApp order integration
  - Business info display
  - SEO optimization

### 2.2 Catalog API Routes
**Task:** Create API endpoints for catalog data
- **Location:** `app/api/catalog/[slug]/route.ts`
- **Description:** Serve business and product data for public catalog
- **Endpoints:**
  - `GET /api/catalog/[slug]` - Get business and products
  - `GET /api/catalog/[slug]/categories` - Get categories

## 3. Admin Dashboard System

### 3.1 Business UUID-based Admin Routes
**Task:** Update admin routing to use business UUID instead of ID
- **Location:** `app/admin/stores/[businessId]/` directory
- **Description:** Change from numeric IDs to UUIDs for better security
- **Routes to update:**
  - `/admin/stores/[businessUuid]/dashboard`
  - `/admin/stores/[businessUuid]/products`
  - `/admin/stores/[businessUuid]/orders`
  - `/admin/stores/[businessUuid]/settings`

### 3.2 Admin Dashboard Components
**Task:** Build comprehensive admin dashboard
- **Location:** `app/admin/stores/[businessUuid]/dashboard/page.tsx`
- **Features:**
  - Order management
  - Product management
  - Analytics overview
  - Business settings

## 4. SEO and Indexability

### 4.1 SEO Metadata System
**Task:** Implement dynamic SEO metadata for catalog pages
- **Location:** `app/(public)/[slug]/page.tsx`
- **Implementation:**
  - Dynamic `metadata` export
  - Business name in title
  - Business description as meta description
  - Open Graph tags
  - JSON-LD structured data

### 4.2 Sitemap Generation
**Task:** Create dynamic sitemap for all active businesses
- **Location:** `app/sitemap.ts`
- **Description:** Generate sitemap including all public catalog URLs
- **Implementation:** Query database for active businesses and generate sitemap entries

### 4.3 Robots.txt
**Task:** Create robots.txt to allow indexing
- **Location:** `app/robots.ts`
- **Description:** Allow search engine crawling of catalog pages

## 5. Dynamic Category System

### 5.1 Category Management in Product Setup
**Task:** Replace static categories with dynamic category creation
- **Location:** `components/setup/steps/ProductSetupStep.tsx`
- **Changes:**
  - Add "Category Name" field alongside product form
  - Allow users to create new categories on-the-fly
  - Show existing categories in dropdown with "Create New" option
  - Update category selection to include custom categories

### 5.2 Category API Routes
**Task:** Create category management endpoints
- **Location:** `app/api/categories/route.ts`
- **Endpoints:**
  - `POST /api/categories` - Create new category
  - `GET /api/categories` - Get user's categories
  - `PUT /api/categories/[id]` - Update category
  - `DELETE /api/categories/[id]` - Delete category

### 5.3 Category Database Schema
**Task:** Ensure Category model supports business-specific categories
- **Location:** `prisma/schema.prisma`
- **Current:** Already implemented with `businessId` relationship
- **Validation:** Verify unique category names per business

## 6. Database Schema Updates

### 6.1 Business UUID Field
**Task:** Add UUID field to Business model
- **Location:** `prisma/schema.prisma`
- **Implementation:**
```prisma
model Business {
  id   String @id @default(auto()) @map("_id") @db.ObjectId
  uuid String @unique @default(uuid())
  // ... existing fields
}
```

### 6.2 SEO Fields
**Task:** Add SEO fields to Business model
- **Location:** `prisma/schema.prisma`
- **Fields:**
  - `metaTitle String?`
  - `metaDescription String?`
  - `keywords String[]`

## 7. Order Management System (Internal APIs Only)

### 7.1 Order Processing API
**Task:** Build internal order tracking system
- **Location:** `app/api/orders/route.ts`
- **Description:** Handle order creation and management without external WhatsApp API
- **Features:**
  - Order validation and creation
  - WhatsApp deep link generation
  - Order status tracking (internal only)
  - Order history for businesses

### 7.2 Order Status Management
**Task:** Create order status tracking for business dashboard
- **Location:** `app/api/orders/[orderId]/status/route.ts`
- **Description:** Allow businesses to update order status internally
- **Features:**
  - Status updates (pending, confirmed, preparing, ready, completed)
  - Order timeline tracking
  - Admin dashboard integration
  - No automated customer notifications (business handles manually via WhatsApp)

### 7.3 WhatsApp Deep Link Generator
**Task:** Create utility for generating WhatsApp order links
- **Location:** `lib/whatsapp-links.ts`
- **Description:** Generate WhatsApp deep links with pre-filled order messages
- **Features:**
  - Business type-specific message templates
  - Order formatting for WhatsApp messages
  - URL encoding and validation
  - No API dependencies - uses wa.me links only

## 8. Development Setup Tasks

### 8.1 Environment Variables
**Task:** Document required environment variables
- **Location:** `.env.example`
- **Variables:**
  - Database connection
  - NextAuth configuration
  - Email service (Resend)
  - WhatsApp API credentials

### 8.2 Database Migrations
**Task:** Create and run necessary migrations
- **Commands:**
  - `npx prisma db push` (for development)
  - `npx prisma migrate deploy` (for production)

## 10. Setup Progress Persistence

### 10.1 Setup Progress Database Schema
**Task:** Create schema to store setup progress
- **Location:** `prisma/schema.prisma`
- **Description:** Store user's setup progress to resume later
- **Schema:**
```prisma
model SetupProgress {
  id         String   @id @default(auto()) @map("_id") @db.ObjectId
  userId     String   @db.ObjectId
  setupToken String   @unique
  currentStep Int     @default(1)
  data       Json     // Store all setup data as JSON
  createdAt  DateTime @default(now())
  updatedAt  DateTime @updatedAt
  
  user User @relation(fields: [userId], references: [id], onDelete: Cascade)
}
```

### 10.2 Setup Progress API Routes
**Task:** Create APIs to save and retrieve setup progress
- **Location:** `app/api/setup/save-progress/route.ts` (update existing)
- **Description:** Enhanced progress saving with persistence
- **Features:**
  - Save progress after each step completion
  - Retrieve saved progress when returning to setup
  - Handle setup token validation with saved state
  - Clean up completed setups

### 10.3 Setup Component State Recovery
**Task:** Update setup component to load saved progress
- **Location:** `components/setup/Setup.tsx`
- **Description:** Restore user's progress when returning to setup link
- **Implementation:**
  - Check for existing progress on setup token validation
  - Restore `currentStep` and `setupData` from saved state
  - Allow user to continue from where they left off
  - Handle edge cases (completed setups, expired tokens)

### 10.4 Progress Cleanup Job
**Task:** Create cleanup for old/completed setup progress
- **Location:** `app/api/cron/cleanup-setup/route.ts`
- **Description:** Remove old setup progress data
- **Features:**
  - Delete progress for completed setups
  - Clean up expired setup tokens
  - Remove progress older than 7 days

### 9.1 Setup Wizard Testing
**Task:** Test complete setup wizard flow
- **Scenarios:**
  - Different business types
  - Various configuration combinations
  - Mobile responsiveness
  - Error handling

### 9.2 Catalog Testing
**Task:** Test public catalog functionality
- **Scenarios:**
  - Product browsing
  - WhatsApp order initiation
  - SEO metadata
  - Mobile experience

## Priority Order

1. **High Priority (Core Functionality):**
   - Dynamic Category System (5.1, 5.2)
   - Public Catalog System (2.1, 2.2)
   - Admin Dashboard System (3.1, 3.2)

2. **Medium Priority (Enhancement):**
   - Business Type-Specific Content (1.1, 1.2)
   - SEO Implementation (4.1, 4.2, 4.3)
   - WhatsApp Integration (7.1, 7.2)

3. **Low Priority (Polish):**
   - Database Schema Updates (6.1, 6.2)
   - Testing Tasks (9.1, 9.2)

## Notes

- All mobile responsiveness improvements have been completed for setup steps
- Current authentication and email verification systems are working
- Database schema is mostly complete, only minor additions needed
- Focus on core functionality first, then SEO and enhancements