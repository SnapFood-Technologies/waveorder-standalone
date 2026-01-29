# Multi-Language Support Guide

This document outlines all the places that need to be updated when adding support for a new language to WaveOrder.

## Overview

Currently supported languages:
- **English (en)** - Default
- **Albanian (sq/al)** - Full support
- **Greek (el)** - Full support
- **Spanish (es)** - Partial (translations only)

---

## Step 1: Database Schema Updates

**File:** `prisma/schema.prisma`

Add new language fields to the following models:

### Product Model
```prisma
name{LANG}        String? // {Language} product name
description{LANG} String? // {Language} description
```

### Category Model
```prisma
name{LANG}        String? // {Language} name
description{LANG} String? // {Language} description
```

### Business Model
```prisma
seoTitle{LANG}       String? // {Language} SEO title
seoDescription{LANG} String? // {Language} SEO description
seoKeywords{LANG}    String? // {Language} SEO keywords
description{LANG}    String? // {Language} business description
```

### Brand Model
```prisma
name{LANG} String? // {Language} name
```

### Collection Model
```prisma
name{LANG} String? // {Language} name
```

### Group Model
```prisma
name{LANG} String? // {Language} name
```

### Postal Model
```prisma
name{LANG}         String? // {Language} name
description{LANG}  String? // {Language} description
deliveryTime{LANG} String? // {Language} delivery time
```

### PostalPricing Model
```prisma
deliveryTime{LANG} String? // {Language} delivery time
```

**After schema changes:** Run `npx prisma generate` to regenerate the Prisma client.

---

## Step 2: Admin API Routes

Update these API routes to accept and save the new language fields:

### Products
- `src/app/api/admin/stores/[businessId]/products/route.ts` - CREATE
- `src/app/api/admin/stores/[businessId]/products/[productId]/route.ts` - UPDATE

### Categories
- `src/app/api/admin/stores/[businessId]/categories/route.ts` - CREATE
- `src/app/api/admin/stores/[businessId]/categories/[categoryId]/route.ts` - UPDATE

### Business Settings
- `src/app/api/admin/stores/[businessId]/settings/business/route.ts` - GET/PUT

### Brands
- `src/app/api/admin/stores/[businessId]/brands/route.ts` - CREATE
- `src/app/api/admin/stores/[businessId]/brands/[brandId]/route.ts` - UPDATE

### Collections
- `src/app/api/admin/stores/[businessId]/collections/route.ts` - CREATE
- `src/app/api/admin/stores/[businessId]/collections/[collectionId]/route.ts` - UPDATE

### Groups
- `src/app/api/admin/stores/[businessId]/groups/route.ts` - CREATE
- `src/app/api/admin/stores/[businessId]/groups/[groupId]/route.ts` - UPDATE

### Postals
- `src/app/api/admin/stores/[businessId]/postals/route.ts` - CREATE
- `src/app/api/admin/stores/[businessId]/postals/[postalId]/route.ts` - UPDATE

### Postal Pricing
- `src/app/api/admin/stores/[businessId]/postal-pricing/route.ts` - CREATE
- `src/app/api/admin/stores/[businessId]/postal-pricing/[pricingId]/route.ts` - UPDATE

### Custom Menu
- `src/app/api/admin/stores/[businessId]/custom-menu/route.ts` - Update select statements and entity creation

### Custom Filtering
- `src/app/api/admin/stores/[businessId]/custom-filtering/entities/route.ts` - Update select statements

### Orders
- `src/app/api/admin/stores/[businessId]/orders/[orderId]/route.ts` - Update postal select and display logic

---

## Step 3: Admin UI Components

Update these components to add language input fields:

### Product Form
**File:** `src/components/admin/products/ProductForm.tsx`
- Add new language to `activeLanguage` state type
- Add language toggle button (conditional on `business.language`)
- Add input fields for name and description

### Categories Management
**File:** `src/components/admin/categories/CategoriesManagement.tsx`
- Add new language to `activeLanguage` state type
- Add language toggle button
- Add input fields for name and description

### Business Settings Form
**File:** `src/components/admin/settings/BusinessSettingsForm.tsx`
- Add SEO fields (title, description, keywords) for new language
- Add business description field for new language

### Postals Management
**File:** `src/components/admin/postals/PostalsManagement.tsx`
- Update `Postal` interface
- Add form fields for name, description, deliveryTime
- Update form defaults

### Postal Pricing Management
**File:** `src/components/admin/postals/PostalPricingManagement.tsx`
- Update `PostalPricing` and `Postal` interfaces
- Add form field for deliveryTime
- Update form defaults

### Order Details
**File:** `src/components/admin/orders/OrderDetails.tsx`
- Update postal name display logic

---

## Step 4: Admin Pages

Update these pages to support the new language:

### Brands Page
**File:** `src/app/admin/stores/[businessId]/brands/page.tsx`
- Update `Brand` interface
- Update `formData` state
- Add conditional input field for new language

### Collections Page
**File:** `src/app/admin/stores/[businessId]/collections/page.tsx`
- Update `Collection` interface
- Update `formData` state
- Add conditional input field for new language

### Groups Page
**File:** `src/app/admin/stores/[businessId]/groups/page.tsx`
- Update `Group` interface
- Update `formData` state
- Add conditional input field for new language

### Custom Menu Page
**File:** `src/app/admin/stores/[businessId]/custom-menu/page.tsx`
- Update `MenuItem` and `AvailableEntity` interfaces
- Update `formData` state
- Add conditional input field for new language

### Custom Filtering Page
**File:** `src/app/admin/stores/[businessId]/custom-filtering/page.tsx`
- Update `AvailableEntity` interface

---

## Step 5: Storefront API Routes

Update these routes to return localized content:

### Main Storefront Route
**File:** `src/app/api/storefront/[slug]/route.ts`
- Add `use{Lang}` variable based on `storefrontLanguage`
- Update product description logic
- Update `getCategoryDisplayName` helper
- Update select statements for all entities

### Products Route
**File:** `src/app/api/storefront/[slug]/products/route.ts`
- Add `use{Lang}` variable
- Update product description transformation
- Add new language fields to search conditions
- Update select statements

### Postal Pricing Route
**File:** `src/app/api/storefront/[slug]/postal-pricing/route.ts`
- Update select statements for postal
- Update display name and description logic

### Order Route
**File:** `src/app/api/storefront/[slug]/order/route.ts`
- Update postal select statements (multiple locations)
- Update `postalPricingDetails` assignment logic (3 locations)

---

## Step 6: Storefront Components

### StoreFront Component
**File:** `src/components/storefront/StoreFront.tsx`
- Update interfaces to include new language fields
- Add `use{Lang}` variable in product rendering functions
- Update business description display logic
- Update product description display logic

### Storefront Page
**File:** `src/app/(site)/[slug]/page.tsx`
- Add `is{Lang}` variable
- Update `businessDescription` logic for metadata

---

## Step 7: Translations

### Storefront Translations
**File:** `src/utils/storefront-translations.ts`
- Add new language translations object
- Update `getStorefrontTranslations` function to include new language

### Email Notifications
**File:** `src/lib/customer-email-notification.ts`
- Add locale mapping for new language (e.g., `'fr' ? 'fr-FR'`)
- Verify `getEmailLabels` supports the new language

---

## Step 8: Superadmin Routes (if applicable)

### Postal Pricing
**File:** `src/app/api/superadmin/businesses/[businessId]/postal-pricing/route.ts`
- Update postal select statements

---

## Step 9: Business Store Route

**File:** `src/app/api/admin/stores/[businessId]/route.ts`
- Update select statement to include new SEO and description fields

---

## Language Code Reference

| Language | Code | Locale |
|----------|------|--------|
| English | en | en-US |
| Albanian | sq, al | sq-AL |
| Greek | el | el-GR |
| Spanish | es | es-ES |
| French | fr | fr-FR |
| German | de | de-DE |
| Italian | it | it-IT |

---

## Testing Checklist

After adding a new language:

- [ ] Run `npx prisma generate`
- [ ] Restart TypeScript server in IDE
- [ ] Test creating/editing products with new language
- [ ] Test creating/editing categories with new language
- [ ] Test business settings save new language SEO fields
- [ ] Test brands/collections/groups with new language
- [ ] Test postal services with new language
- [ ] Test storefront displays correct language
- [ ] Test order creation includes correct postal name
- [ ] Verify existing Albanian stores still work
- [ ] Verify existing English stores still work

---

## Important Notes

1. **Order of Language Checks**: Always check languages in order (Albanian first, then other languages, then English as fallback)
2. **Backward Compatibility**: Never remove existing language fields
3. **Conditional UI**: Language input fields should only show when `business.language` matches
4. **Schema Naming**: Use consistent naming: `name{Lang}`, `description{Lang}`, etc.
5. **Regenerate Prisma**: Always run `npx prisma generate` after schema changes

---

*Document created: January 2026*
*Last updated: January 2026*
