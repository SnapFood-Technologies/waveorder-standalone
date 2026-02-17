# Superadmin Screens - Salon Business Changes Required

**Status:** 📋 Analysis Complete - Changes Needed  
**Last Updated:** February 6, 2026  
**Priority:** High

---

## 📋 Overview

This document lists all superadmin screens and the changes needed to properly support SALON businesses. Most changes involve:
- Conditional terminology: "Orders" → "Appointments", "Products" → "Services"
- Hiding product-specific features for salons (inventory, variants, stock)
- Conditional display of business-type-specific metrics

---

## 🎯 Main Dashboard (`/superadmin/dashboard`)

**File:** `src/components/superadmin/SuperAdminDashboard.tsx`

### Changes Needed:
1. ✅ **Business Type Icons** - Already has SALON icon (Scissors)
2. ⚠️ **Incomplete Setup Suggestions** (Line 196)
   - Currently says: "Explain that WhatsApp is essential for receiving customer orders directly"
   - **Change to:** Conditional: "orders" → "appointments" for salons

---

## 📊 Analytics (`/superadmin/analytics`)

**File:** `src/components/superadmin/SuperAdminAnalytics.tsx`

### Changes Needed:
1. ⚠️ **Total Orders Metric** (Line 39, 265)
   - Currently shows "totalOrders" 
   - **Change to:** Conditional label "Total Orders" → "Total Orders/Appointments" or separate metrics
   - **Link text** (Line 275): "View orders, reservations, bookings..." → Conditional for salons

2. ⚠️ **Conversion Rate Description** (Line 403)
   - Currently: "Percentage of storefront visits that result in orders"
   - **Change to:** Conditional: "orders" → "appointments" for salons

3. ⚠️ **Business Status Descriptions** (Lines 423, 430)
   - Currently: "Can receive orders" / "cannot receive orders"
   - **Change to:** Conditional: "orders" → "appointments" for salons

4. ⚠️ **Help Text** (Line 503)
   - Currently: "Orders, and Conversion Rate calculations"
   - **Change to:** Conditional: "Orders" → "Orders/Appointments" for salons

---

## 🏢 Businesses List (`/superadmin/businesses`)

**File:** `src/components/superadmin/SuperAdminBusinesses.tsx`

### Changes Needed:
1. ⚠️ **Quick View Modal - Products Stat** (Lines 1234-1247)
   - Currently shows: `business.stats.totalProducts` with label "Products"
   - **Change to:** 
     - Label: Conditional "Products" → "Services" for salons
     - Icon: Conditional `ShoppingBag` → `Scissors` for salons
     - Hide "supplierProductCount" logic for salons (marketplace feature)

2. ⚠️ **Quick View Modal - Orders Stat** (Not visible in snippet, but likely exists)
   - **Change to:** Conditional "Orders" → "Appointments" for salons

---

## 🏢 Business Details (`/superadmin/businesses/[businessId]`)

**File:** `src/app/superadmin/businesses/[businessId]/page.tsx`

### Main Content Changes Needed:
1. ✅ **Orders Link** (Line 673) - Already conditional: `business.businessType === 'SALON' ? 'appointments' : 'orders'`

2. ✅ **Total Orders Label** (Line 685) - Already conditional: `business.businessType === 'SALON' ? 'Total Appointments' : 'Total Orders'`

3. ✅ **Products Label** (Line 697) - Already conditional: `business.businessType === 'SALON' ? 'Services' : 'Products'`

4. ⚠️ **Products Without Photos** (Lines 804-820)
   - ✅ Label already conditional
   - ⚠️ **Hide this entire section for salons** - Services don't need photos requirement check
   - **Action:** Wrap in `{business.businessType !== 'SALON' && ...}`

5. ⚠️ **Products With Zero Price** (Lines 822-840)
   - ✅ Label already conditional
   - ⚠️ **Keep for salons** - Services should have prices

6. ⚠️ **Products Out Of Stock** (Lines 841-859)
   - Currently: "Product(s) Out Of Stock"
   - **Change to:** 
     - Hide for salons (services don't have stock)
     - Wrap in `{business.businessType !== 'SALON' && ...}`

7. ⚠️ **Products With Variants - All Zero Stock** (Lines 860-878)
   - **Change to:** Hide for salons (services don't have variants/stock)
   - Wrap in `{business.businessType !== 'SALON' && ...}`

8. ⚠️ **Products With Variants - Some Zero Stock** (Lines 879-897)
   - **Change to:** Hide for salons
   - Wrap in `{business.businessType !== 'SALON' && ...}`

9. ⚠️ **Products With Variants - All Non-Zero Stock** (Line 898+)
   - **Change to:** Hide for salons
   - Wrap in `{business.businessType !== 'SALON' && ...}`

10. ⚠️ **Hide Products Without Photos Toggle** (Lines 950-960)
    - Currently: `business.hideProductsWithoutPhotos`
    - **Change to:** 
      - Hide toggle for salons
      - Wrap in `{business.businessType !== 'SALON' && ...}`
      - Label should be conditional: "Hide Products Without Photos" → "Hide Services Without Photos"

11. ⚠️ **Postal Data Section** (Lines 258-277)
    - Currently only fetches for RETAIL businesses
    - ✅ Already conditional: `if (business && business.businessType === 'RETAIL')`

12. ⚠️ **Marketplace Section** (Lines 567, 579)
    - References "products" 
    - **Change to:** Conditional "products" → "services" for salons
    - Consider hiding marketplace features for salons entirely

### Right Sidebar Addons/Features (Lines 1310-1440)

**Analysis of each sidebar feature for salons:**

#### ✅ **KEEP for Salons** (Still Relevant):
1. **External Syncs** (Line 1312-1329)
   - Currently: "Manage product synchronization with external systems"
   - **Change to:** Conditional text: "product" → "service" for salons
   - **Action:** Update description text

2. **Anomalies** (Line 1331-1348)
   - Generic data quality checks
   - ✅ **Keep as-is** - Works for all business types

3. **Search Analytics Settings** (Line 1400-1401)
   - Generic search analytics
   - ✅ **Keep as-is** - Works for salons (service search)

4. **Cost & Margins Settings** (Line 1403-1404)
   - Cost tracking for products/services
   - ✅ **Keep** - Can track service costs
   - **Note:** May need to adapt for service cost structure

5. **Manual Team Creation Settings** (Line 1409-1410)
   - Team member management
   - ✅ **Keep as-is** - Works for salons (staff management)

6. **Invoice/Receipt Selection Settings** (Line 1415-1416)
   - Generic invoice/receipt feature
   - ✅ **Keep as-is** - Works for salons

7. **Legal Pages Settings** (Line 1421-1422)
   - Generic legal pages
   - ✅ **Keep as-is** - Works for salons

8. **WhatsApp Settings** (Line 1394-1395)
   - Generic WhatsApp configuration
   - ✅ **Keep as-is** - Works for salons

9. **Account Managers** (Line 1391-1392)
   - Generic account management
   - ✅ **Keep as-is** - Works for salons

10. **Custom Domain** (Line 1427-1430)
    - Generic domain feature
    - ✅ **Keep as-is** - Works for salons

11. **API Keys** (Line 1432-1435)
    - Generic API access
    - ✅ **Keep as-is** - Works for salons

12. **Complete Setup** (Line 1437-1440)
    - Generic setup wizard
    - ✅ **Keep as-is** - Works for salons

13. **Quick Actions** (Line 1388-1389)
    - Generic quick actions
    - ✅ **Keep as-is** - Works for salons

#### ❌ **HIDE for Salons** (Not Relevant):
1. **Custom Features** (Line 1350-1367)
   - Currently: "Enable advanced features like brands, collections, custom menus and filtering"
   - **Reason:** Brands, collections are product-focused features
   - **Action:** Hide for salons: `{business.businessType !== 'SALON' && ...}`

2. **Connected Businesses** (Line 1369-1386)
   - Currently: "Manage business connections for marketplace and shared products"
   - **Reason:** Marketplace is product-focused, salons don't share services
   - **Action:** Hide for salons: `{business.businessType !== 'SALON' && ...}`

3. **Happy Hour Settings** (Line 1397-1398)
   - Currently: Time-based product discounts
   - **Reason:** Happy hour is product discount feature, not relevant for service bookings
   - **Action:** Hide for salons: `{business.businessType !== 'SALON' && ...}`

4. **Production Planning Settings** (Line 1406-1407)
   - Currently: Order prep queue/planning
   - **Reason:** Appointments don't need prep queues (services are performed on-site)
   - **Action:** Hide for salons: `{business.businessType !== 'SALON' && ...}`

5. **Delivery Management Settings** (Line 1412-1413)
   - Currently: Delivery tracking, assignments, earnings
   - **Reason:** Salons don't have deliveries (appointments are in-person)
   - **Action:** Hide for salons: `{business.businessType !== 'SALON' && ...}`

6. **Packaging Tracking Settings** (Line 1418-1419)
   - Currently: Track packaging materials for orders
   - **Reason:** Salons don't use packaging (services are performed, not packaged)
   - **Action:** Hide for salons: `{business.businessType !== 'SALON' && ...}`

#### ⚠️ **CONDITIONAL for Salons** (May Need Adaptation):
1. **Affiliate System Settings** (Line 1424-1425)
   - Currently: Order-based affiliate commissions
   - **Consideration:** Could work for salons (appointment-based commissions)
   - **Action:** Keep but verify commission calculation works with appointments
   - **Note:** May need to adapt commission triggers (appointments vs orders)

---

## 📦 Business Orders Page (`/superadmin/businesses/[businessId]/orders`)

**File:** `src/app/superadmin/businesses/[businessId]/orders/page.tsx`

### Changes Needed:
1. ⚠️ **Page Title & Headers**
   - Currently: "Orders" throughout
   - **Change to:** Conditional "Orders" → "Appointments" for salons

2. ⚠️ **Stats Labels**
   - `totalOrders` → Conditional "Total Orders" → "Total Appointments"
   - `averageOrderValue` → Conditional "Average Order Value" → "Average Appointment Value"

3. ⚠️ **Status Breakdown**
   - Order statuses (PENDING, CONFIRMED, etc.) → Appointment statuses for salons
   - Consider showing appointment-specific statuses: REQUESTED, CONFIRMED, IN_PROGRESS, COMPLETED, CANCELLED

4. ⚠️ **Order Type Filter**
   - Currently: DELIVERY, PICKUP, DINE_IN
   - **Change to:** Hide for salons (appointments don't have types)

5. ⚠️ **Table Columns**
   - "Order Number" → "Appointment Number" for salons
   - "Order Type" → Hide for salons
   - "Delivery Address" → Hide for salons
   - Add "Appointment Date", "Start Time", "End Time", "Staff" for salons

---

## 🔧 Operations - Orders (`/superadmin/operations/orders`)

**File:** `src/app/superadmin/operations/orders/page.tsx`

### Changes Needed:
1. ⚠️ **Page Title**
   - Currently: "Orders Operations"
   - **Change to:** "Orders & Appointments Operations" or conditional

2. ⚠️ **Overview Stats** (Lines 29-38)
   - `totalOrders` → Should include appointments for salons
   - Labels: Conditional "Orders" → "Orders/Appointments"

3. ⚠️ **Status Breakdown**
   - Order statuses → Should show appointment statuses for salon businesses
   - Consider separate sections or filters

4. ⚠️ **Type Breakdown** (Line 46)
   - `ordersByType` → Hide for salons (appointments don't have types)

5. ⚠️ **Business Type Breakdown** (Line 88)
   - Should differentiate salon vs non-salon metrics

6. ⚠️ **Top Businesses** (Line 65)
   - `orderCount` → Conditional label "Orders" → "Appointments" for salons

7. ⚠️ **Businesses With No Orders** (Line 91)
   - Label: Conditional "No Orders" → "No Orders/Appointments"

---

## 📊 Operations - Bookings (`/superadmin/operations/bookings`)

**File:** `src/app/superadmin/operations/bookings/page.tsx`

### Changes Needed:
1. ⚠️ **Verify this page handles appointments**
   - Should show salon appointments
   - Check if it's separate from orders or combined

---

## 👥 User Details (`/superadmin/users/[userId]`)

**File:** `src/components/superadmin/SuperAdminUserDetails.tsx`

### Changes Needed:
1. ✅ **Business List - Orders Count** (Line 419)
   - Already conditional: `{business.ordersCount} {business.businessType === 'SALON' ? 'appointments' : 'orders'}`

2. ✅ **Business List - Products Count** (Line 421)
   - Already conditional: `{business.productsCount} {business.businessType === 'SALON' ? 'services' : 'products'}`

**Status:** ✅ Already fixed!

---

## 📈 Analytics - Financial (`/superadmin/analytics/financial`)

**File:** `src/app/superadmin/analytics/financial/page.tsx`

### Changes Needed:
1. ⚠️ **Review for order/appointment references**
   - Check if revenue calculations use orders
   - Should include appointments for salons

---

## 📈 Analytics - Marketing (`/superadmin/analytics/marketing`)

**File:** `src/app/superadmin/analytics/marketing/page.tsx`

### Changes Needed:
1. ⚠️ **Review for product/service references**
   - Check if campaign analytics reference products
   - Should reference services for salons

---

## 📈 Analytics - CX (`/superadmin/analytics/cx`)

**File:** `src/app/superadmin/analytics/cx/page.tsx`

### Changes Needed:
1. ⚠️ **Review for order/appointment references**
   - Customer experience metrics should include appointments for salons

---

## 🔍 System Logs (`/superadmin/system/logs`)

**File:** `src/app/superadmin/system/logs/page.tsx`

### Changes Needed:
1. ⚠️ **Check log filters**
   - May have "orders" filter that should include "appointments"
   - Check if product-related logs should filter services for salons

---

## 🛠️ Debug Pages (`/superadmin/system/debug`)

### Changes Needed:
1. ⚠️ **Debug Product** (`/superadmin/system/debug/product/[productId]`)
   - Should redirect to service debug for salons
   - Or create separate service debug endpoint

2. ⚠️ **Debug Stock** (`/superadmin/system/debug/stock/[businessId]`)
   - **Hide for salons** - Services don't have stock

3. ⚠️ **Debug Category** (`/superadmin/system/debug/category/[businessId]`)
   - Should work for both products and services
   - Verify it handles service categories

---

## 🔗 Business Connections (`/superadmin/businesses/[businessId]/connections`)

**File:** `src/app/superadmin/businesses/[businessId]/connections/page.tsx`

### Changes Needed:
1. ⚠️ **Review marketplace connections**
   - Marketplace is product-focused
   - Consider hiding or adapting for salons

---

## 🏪 Business Marketplace (`/superadmin/businesses/[businessId]/marketplace`)

**File:** `src/app/superadmin/businesses/[businessId]/marketplace/page.tsx`

### Changes Needed:
1. ⚠️ **Hide for salons**
   - Marketplace is product-focused
   - Services don't use marketplace model
   - **Action:** Redirect or hide section for salons

---

## 📦 Business Vendors Orders (`/superadmin/businesses/[businessId]/vendors/[vendorId]/orders`)

**File:** `src/app/superadmin/businesses/[businessId]/vendors/[vendorId]/orders/page.tsx`

### Changes Needed:
1. ⚠️ **Hide for salons**
   - Vendor/Supplier model is product-focused
   - **Action:** Hide or redirect for salons

---

## 🎯 API Endpoints That Need Updates

### `/api/superadmin/businesses/[businessId]/route.ts`
1. ⚠️ **Stats calculation**
   - `totalProducts` → Should be `totalServices` for salons
   - `totalOrders` → Should include appointments for salons
   - Product-specific stats (productsWithoutPhotos, productsOutOfStock, etc.) → Hide for salons

### `/api/superadmin/businesses/[businessId]/orders/stats/route.ts`
1. ⚠️ **Should also handle appointments**
   - Consider separate endpoint or conditional logic
   - `totalOrders` → Include appointments for salons

### `/api/superadmin/operations/orders/route.ts`
1. ⚠️ **Should include appointments**
   - Filter by business type
   - Return both orders and appointments

### `/api/superadmin/analytics/route.ts`
1. ⚠️ **Total orders metric**
   - Should include appointments for salons
   - Conditional labels

---

## 📝 Summary of Changes by Priority

### 🔴 **HIGH PRIORITY** (User-facing, breaks functionality)

1. **Business Details Page - Main Content**
   - Hide product-specific stats for salons (stock, variants)
   - Hide "Products Without Photos" toggle for salons

2. **Business Details Page - Sidebar Addons**
   - Hide: Custom Features, Connected Businesses, Happy Hour, Production Planning, Delivery Management, Packaging Tracking
   - Update: External Syncs description text

3. **Business Orders Page** - Conditional terminology and columns
4. **Operations Orders Page** - Include appointments in metrics
5. **Quick View Modal** - Conditional labels and hide marketplace features

### 🟡 **MEDIUM PRIORITY** (UI/UX improvements)

1. **Analytics Pages** - Conditional terminology
2. **Dashboard** - Conditional suggestions
3. **System Logs** - Filter adjustments
4. **Debug Pages** - Hide stock-related for salons
5. **Affiliate System** - Verify works with appointments

### 🟢 **LOW PRIORITY** (Nice to have)

1. **Marketplace Pages** - Hide for salons
2. **Vendor Pages** - Hide for salons
3. **Financial Analytics** - Verify calculations include appointments

---

## ✅ Already Fixed

1. ✅ User Details - Business list terminology
2. ✅ Business Details - Orders/Services links and labels
3. ✅ Business Details - Products/Services labels in stats

---

## 🔍 Testing Checklist

After implementing changes, verify:

- [ ] Salon businesses show "Appointments" instead of "Orders"
- [ ] Salon businesses show "Services" instead of "Products"
- [ ] Product-specific stats are hidden for salons
- [ ] Stock-related features are hidden for salons
- [ ] Marketplace features are hidden/disabled for salons
- [ ] All links redirect correctly (orders → appointments for salons)
- [ ] API endpoints return correct data for salons
- [ ] Analytics include appointments for salons
- [ ] No breaking changes for non-salon businesses

---

## 📌 Notes

- All changes should be **conditional** based on `business.businessType === 'SALON'`
- Use `isSalon` variable for cleaner code
- Maintain backward compatibility - non-salon businesses should see no changes
- Consider creating shared utility functions for terminology conversion
