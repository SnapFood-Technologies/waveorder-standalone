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

## 7. WhatsApp Integration

### 7.1 WhatsApp Message Templates
**Task:** Create business type-specific WhatsApp message templates
- **Location:** `lib/whatsapp-templates.ts`
- **Description:** Different message formats for different business types
- **Implementation:** Template system based on business type and order data

### 7.2 Order Processing
**Task:** Build order processing system
- **Location:** `app/api/orders/route.ts`
- **Description:** Handle order creation and WhatsApp message generation
- **Features:**
  - Order validation
  - WhatsApp link generation
  - Order status tracking

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

## 9. Testing Tasks

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