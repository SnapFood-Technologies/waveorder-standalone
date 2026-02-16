# Salon Admin Panel - Comprehensive Analysis & Recommendations

**Date:** February 6, 2026  
**Purpose:** Identify what needs separate components vs conditional updates for salon businesses

---

## 📋 EXECUTIVE SUMMARY

### ⚠️ CRITICAL: Must Create Separate Component
1. **ServiceAnalytics.tsx** - NEW component (DO NOT modify ProductAnalytics.tsx)

### 📝 Conditional Updates Needed (Terminology Only)
2. **BillingPanel.tsx** - Plan features: "products" → "services", "WhatsApp Orders" → "WhatsApp Appointments"
3. **Analytics.tsx** - Change "Products" tab to "Services" for salons
4. **TeamMemberCard.tsx** - Update role descriptions
5. **FAQSection.tsx** - Extensive conditional rendering needed for all FAQ sections
6. **TeamManagement.tsx** - Review for terminology

### ✅ Already Complete (14 items)
- Dashboard, Services, Appointments, Discounts, Settings (most), Marketing, Sidebar navigation
- Orders/Products/Inventory pages are correctly protected/hidden for salons

### ✅ Protected/Hidden (No Changes Needed)
- Orders pages (redirect to Appointments via BusinessTypeGuard)
- Products pages (hidden in sidebar, replaced by Services)
- Inventory pages (hidden in sidebar for salons)
- MarketingManagement.tsx (only handles link sharing)

---

## 📋 MENU ITEM REVIEW (Based on User's Menu Structure)

### ✅ **Manage Stores**
- **Status:** SuperAdmin feature, not relevant for salon admin panel
- **Action:** None needed

### ✅ **Dashboard**
- **File:** `src/components/admin/dashboard/SalonDashboard.tsx`
- **Status:** ✅ Complete - Separate salon dashboard component
- **Changes:** Already uses "appointments" terminology

### ✅ **Orders**
- **File:** `src/app/admin/stores/[businessId]/orders/page.tsx`
- **Status:** ✅ Protected - Uses BusinessTypeGuard to redirect salons to `/appointments`
- **Note:** Salons never see Orders menu (sidebar shows "Appointments" instead)

### ✅ **Products**
- **File:** `src/app/admin/stores/[businessId]/products/**/*.tsx`
- **Status:** ✅ Hidden - Sidebar conditionally shows "Services" for salons
- **Note:** Products menu replaced by "Services" menu for salons

### ✅ **Customers**
- **File:** `src/components/admin/customers/**/*.tsx`
- **Status:** ✅ OK - No product/order-specific terminology
- **Action:** None needed

### ✅ **Appearance**
- **File:** `src/components/admin/appearance/**/*.tsx`
- **Status:** ✅ OK - Generic branding/theming, no product/order terminology
- **Action:** None needed

### ✅ **Marketing**
- **File:** `src/components/admin/marketing/MarketingManagement.tsx`
- **Status:** ✅ OK - Only handles store link sharing
- **Action:** None needed

### ⚠️ **Help & Support**
- **File:** `src/components/admin/help/FAQSection.tsx`
- **Status:** ❌ Needs Update - Extensive FAQ content needs conditional rendering
- **Action:** See detailed breakdown in section #6 below

### ✅ **Inventory**
- **File:** `src/app/admin/stores/[businessId]/inventory/**/*.tsx`
- **Status:** ✅ Hidden - Sidebar conditionally hides for salons (PRO plan feature)
- **Note:** Only shown for non-salon businesses

### ✅ **Discounts**
- **File:** `src/components/admin/discounts/DiscountsList.tsx`
- **Status:** ✅ Complete - Conditional terminology already implemented
- **Changes:** Already uses "services" for salons, "products" for others

### ⚠️ **Analytics**
- **File:** `src/components/admin/analytics/Analytics.tsx`
- **Status:** ⚠️ Partial - Needs "Products" tab → "Services" tab for salons
- **Action:** See section #2 below + create ServiceAnalytics component

### ✅ **Settings > Business**
- **File:** `src/components/admin/settings/BusinessSettingsForm.tsx`
- **Status:** ✅ Complete - Conditional help text already implemented

### ✅ **Settings > Billing**
- **File:** `src/components/admin/billing/BillingPanel.tsx`
- **Status:** ❌ Needs Update - Plan features mention "products" and "WhatsApp Orders"
- **Action:** See section #7 below

### ✅ **Settings > Order Notifications**
- **File:** `src/components/admin/settings/OrderNotificationSettings.tsx`
- **Status:** ✅ Complete - Conditional terminology already implemented
- **Note:** Sidebar shows "Appointment Notifications" for salons

### ✅ **Settings > Configurations**
- **File:** `src/components/admin/settings/BusinessConfiguration.tsx`
- **Status:** ✅ Complete - Conditional tabs and terminology already implemented

---

## 🎯 CRITICAL: SEPARATE COMPONENTS NEEDED

These components should be **completely separate** for salons (DO NOT modify existing product components):

### 1. **ServiceAnalytics Component** ⚠️ HIGH PRIORITY
- **Current:** `ProductAnalytics.tsx` - Product-specific analytics
- **Needed:** `ServiceAnalytics.tsx` - Service-specific analytics
- **Route:** `/admin/stores/[businessId]/analytics/services/page.tsx`
- **Why:** Different metrics (appointments vs orders, service duration, staff assignment)
- **Files to create:**
  - `src/components/admin/analytics/ServiceAnalytics.tsx` (NEW)
  - `src/app/admin/stores/[businessId]/analytics/services/page.tsx` (NEW)
- **Files to update:**
  - `src/components/admin/analytics/Analytics.tsx` - Change "Products" tab to "Services" for salons, link to `/analytics/services`
  - `src/components/admin/layout/AdminSidebar.tsx` - Update analytics link if needed

---

## 📝 CONDITIONAL UPDATES (Terminology Only)

These components can use conditional rendering based on `businessType === 'SALON'`:

### 2. **Analytics.tsx** (Main Analytics Overview)
- **File:** `src/components/admin/analytics/Analytics.tsx`
- **Changes needed:**
  - Tab label: "Products" → "Services" (for salons)
  - Tab icon: `Package` → `Scissors` (for salons)
  - "Top Products" → "Top Services"
  - "Orders" → "Appointments" in table headers
  - Link to `/analytics/services` instead of `/analytics/products` for salons
- **Status:** Already partially updated (some terminology changed)

### 3. **CampaignAnalytics.tsx**
- **File:** `src/components/admin/analytics/CampaignAnalytics.tsx`
- **Changes needed:**
  - "Orders from Campaigns" → "Appointments from Campaigns"
  - "Cart to Order Rate" → "Cart to Appointment Rate"
  - Table column "Orders" → "Appointments"
  - "Cart→Order:" → "Cart→Appt:"
- **Status:** Already partially updated

### 4. **TeamMemberCard.tsx**
- **File:** `src/components/admin/team/TeamMemberCard.tsx`
- **Changes needed:**
  - Line ~200: "Can manage products, orders" → "Can manage services, appointments" (for salons)
  - Line ~201: "Can view and manage orders and products" → "Can view and manage appointments and services" (for salons)
- **Status:** ❌ NOT UPDATED

### 5. **TeamManagement.tsx**
- **File:** `src/components/admin/team/TeamManagement.tsx`
- **Changes needed:**
  - Check for any "order" or "product" terminology in descriptions
  - Update role descriptions if they mention products/orders
- **Status:** ⚠️ NEEDS REVIEW

### 6. **FAQSection.tsx** (Help & Support)
- **File:** `src/components/admin/help/FAQSection.tsx`
- **Changes needed:**
  - **CRITICAL:** This component needs conditional rendering based on `businessType`
  - **Sections requiring updates:**
    - `getting-started`:
      - "browse your menu" → "browse your service catalog"
      - "place orders" → "book appointments"
      - "order management" → "appointment management"
      - "product categories" → "service categories"
      - "products" → "services"
      - "ordering system" → "booking system"
    - `product-management` (entire section):
      - Should be conditionally shown as `service-management` for salons
      - "Products" → "Services" throughout
      - "product categories" → "service categories"
      - Links: `/products` → `/services`, `/product-categories` → `/service-categories`
      - "order value" → "appointment value"
    - `order-management` (entire section):
      - Should be conditionally shown as `appointment-management` for salons
      - "Orders" → "Appointments" throughout
      - "order status" → "appointment status"
      - "Pending, Confirmed, Preparing, Ready, Delivered" → salon statuses
      - Links: `/orders` → `/appointments`
    - `customer-management`:
      - "order history" → "appointment history"
      - "delivery address" → "address" (for salons)
    - `whatsapp-integration`:
      - "place orders" → "book appointments"
      - "order details" → "appointment details"
      - "Orders dashboard" → "Appointments dashboard"
    - `team-management`:
      - "manage products, orders" → "manage services, appointments"
      - "orders and products" → "appointments and services"
    - `advanced-features`:
      - "inventory management" → Hide for salons (or show service-specific version)
      - "popular products" → "popular services"
      - "order trends" → "appointment trends"
    - `troubleshooting`:
      - "orders not appearing" → "appointments not appearing"
      - "Orders dashboard" → "Appointments dashboard"
  - **Implementation:** Need to fetch `businessType` and conditionally render sections/content
- **Status:** ❌ NOT UPDATED

### 7. **BillingPanel.tsx** ⚠️ NEW FINDING
- **File:** `src/components/admin/billing/BillingPanel.tsx`
- **Changes needed:**
  - **PLAN FEATURES** (lines 37-83):
    - STARTER: "Up to 50 products" → "Up to 50 services" (for salons)
    - PRO: "Unlimited products" → "Unlimited services" (for salons)
    - STARTER: "WhatsApp ordering" → "WhatsApp booking" (for salons)
    - PRO: "Delivery scheduling" → Hide or change to "Appointment scheduling" (for salons)
  - **FEATURES TABLE** (lines 518-530):
    - Row: "Products" → "Services" (for salons)
    - Row: "WhatsApp Orders" → "WhatsApp Appointments" (for salons)
    - Row: "Delivery Scheduling" → Hide or change to "Appointment Scheduling" (for salons)
  - **DOWNGRADE MODAL** (line 563):
    - "Unlimited products" → "Unlimited services" (for salons)
    - "Inventory management" → Hide for salons
- **Status:** ❌ NOT UPDATED

### 8. **MarketingManagement.tsx**
- **File:** `src/components/admin/marketing/MarketingManagement.tsx`
- **Changes needed:**
  - ✅ **NO CHANGES NEEDED** - Component only handles store link sharing, no product/order terminology
- **Status:** ✅ OK

---

## 🔍 COMPONENTS REVIEWED - NO CHANGES NEEDED

### 9. **Orders Pages**
- **Files:** `src/app/admin/stores/[businessId]/orders/page.tsx`
- **Status:** ✅ **PROTECTED** - Uses BusinessTypeGuard to redirect salons to `/appointments`
- **Note:** Orders pages are correctly hidden/redirected for salons

### 10. **Products Pages**
- **Files:** `src/app/admin/stores/[businessId]/products/**/*.tsx`
- **Status:** ✅ **HIDDEN** - Sidebar conditionally shows "Services" instead of "Products" for salons
- **Note:** Products pages are not accessible via sidebar for salons (they use Services pages instead)

### 11. **Inventory Pages**
- **Files:** `src/app/admin/stores/[businessId]/inventory/**/*.tsx`
- **Status:** ✅ **HIDDEN** - Sidebar conditionally hides Inventory menu for salons
- **Note:** Inventory is PRO plan feature, only shown for non-salon businesses

### 12. **Settings Pages**
- **Files:** `src/components/admin/settings/*.tsx`
- **Status:** ✅ **COMPLETE**
  - BusinessConfiguration.tsx - ✅ Updated
  - OrderNotificationSettings.tsx - ✅ Updated
  - BusinessSettingsForm.tsx - ✅ Updated
  - BillingPanel.tsx - ⚠️ Needs update (see #7 above)
  - Profile/Configurations - ✅ No product/order terminology

### 13. **Help & Support Pages**
- **Files:** `src/components/admin/help/*.tsx`
- **Status:** ⚠️ **NEEDS UPDATE** - FAQSection.tsx needs conditional rendering (see #6 above)

### 14. **Dashboard Components**
- **Files:** `src/components/admin/dashboard/*.tsx`
- **Status:** ✅ **COMPLETE** - QuickActionsWidget, RecentCustomersWidget, SalonDashboard all updated

---

## 🛣️ ROUTE UPDATES NEEDED

### Analytics Routes:
1. **Create:** `/admin/stores/[businessId]/analytics/services/page.tsx`
   - Import `ServiceAnalytics` component
   - Add SubscriptionGuard (PRO plan)

2. **Update:** `/admin/stores/[businessId]/analytics/page.tsx`
   - No changes needed (uses Analytics component which handles conditionally)

3. **Keep:** `/admin/stores/[businessId]/analytics/products/page.tsx`
   - Keep as-is for non-salon businesses

---

## 📋 SIDEBAR UPDATES

### AdminSidebar.tsx
- **Current:** Analytics link goes to `/analytics`
- **Action:** No changes needed (Analytics component handles routing internally)
- **Status:** ✅ OK

---

## ✅ ALREADY COMPLETED

1. ✅ **Dashboard** - QuickActionsWidget, RecentCustomersWidget, SalonDashboard
2. ✅ **Services Management** - ServicesManagement.tsx (separate component)
3. ✅ **Appointments** - AppointmentsList.tsx, AppointmentsCalendar.tsx (separate components)
4. ✅ **Orders Page** - Has BusinessTypeGuard that redirects salons to /appointments
5. ✅ **Products Sidebar** - Conditionally shows "Services" for salons, "Products" for others
6. ✅ **Inventory** - Hidden for salons in sidebar (only shown for non-salon businesses)
7. ✅ **Discounts** - DiscountsList.tsx (conditional terminology)
8. ✅ **Business Configuration** - BusinessConfiguration.tsx (conditional tabs/terminology)
9. ✅ **Notification Settings** - OrderNotificationSettings.tsx (conditional terminology)
10. ✅ **Business Settings Form** - BusinessSettingsForm.tsx (conditional help text)
11. ✅ **Analytics Overview** - Analytics.tsx (partially - some terminology updated)
12. ✅ **Campaign Analytics** - CampaignAnalytics.tsx (conditional terminology)
13. ✅ **Marketing** - MarketingManagement.tsx (no product/order terminology)
14. ✅ **Sidebar Navigation** - AdminSidebar.tsx correctly shows/hides items based on businessType

---

## 🎯 RECOMMENDED IMPLEMENTATION ORDER

### Phase 1: Critical Separate Component
1. **Create ServiceAnalytics.tsx** (completely new, don't touch ProductAnalytics)
2. **Create /analytics/services route**
3. **Update Analytics.tsx** to show "Services" tab for salons and link correctly

### Phase 2: Terminology Updates
4. **Update TeamMemberCard.tsx** - Role descriptions
5. **Update FAQSection.tsx** - Help content
6. **Review TeamManagement.tsx** - Check for terminology
7. **Review MarketingManagement.tsx** - Check for terminology

### Phase 3: Final Review
8. Review all help & support pages
9. Test all admin pages with salon business type
10. Verify sidebar navigation

---

## ⚠️ IMPORTANT NOTES

1. **DO NOT modify ProductAnalytics.tsx** - Create ServiceAnalytics.tsx instead
2. **DO NOT override product components** - Use separate components for salons
3. **Use conditional rendering** only for terminology/text changes
4. **Create separate routes** for salon-specific analytics
5. **Test thoroughly** before marking as complete

---

## 📊 SUMMARY

| Category | Count | Status |
|----------|-------|--------|
| **Separate Components Needed** | 1 | ⚠️ ServiceAnalytics |
| **Conditional Updates Needed** | 6 | ⚠️ BillingPanel, TeamMemberCard, FAQSection, TeamManagement, Analytics (tab), CampaignAnalytics |
| **Protected/Hidden** | 4 | ✅ Orders (redirects), Products (hidden), Inventory (hidden), Sidebar navigation |
| **Already Complete** | 14 | ✅ Dashboard, Services, Appointments, Discounts, Settings (most), Marketing, etc. |

---

**Next Step:** Review this list and decide which items to implement.
