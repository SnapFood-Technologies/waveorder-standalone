# Salon Admin Pages Categorization

**Purpose:** Identify which admin pages are shared vs. need separate implementations for salon businesses.

---

## 📋 Page Categories

### ✅ **SHARED PAGES** (Work for both Product-based & Salon businesses)

These pages can be used as-is with minimal or no changes:

| Page | Path | Notes |
|------|------|-------|
| **Dashboard** | `/admin/stores/[businessId]/dashboard` | Show "Today's Appointments" instead of "Today's Orders" for salons (minor change) |
| **Customers** | `/admin/stores/[businessId]/customers` | Same customer management |
| **Appearance** | `/admin/stores/[businessId]/appearance` | Same branding/theming |
| **Marketing** | `/admin/stores/[businessId]/marketing` | Same marketing tools |
| **Analytics** | `/admin/stores/[businessId]/analytics` | Same analytics (may need salon-specific metrics) |
| **Team Management** | `/admin/stores/[businessId]/team` | Same team management |
| **Settings** | `/admin/stores/[businessId]/settings/*` | Same settings (may need salon-specific configs) |
| **Help & Support** | `/admin/stores/[businessId]/help` | Same help center |
| **Support Tickets** | `/admin/stores/[businessId]/support/tickets` | Same support system |
| **Support Messages** | `/admin/stores/[businessId]/support/messages` | Same messaging |
| **Notifications** | `/admin/stores/[businessId]/notifications` | Same notifications |
| **Billing** | `/admin/stores/[businessId]/settings/billing` | Same billing |
| **Profile** | `/admin/stores/[businessId]/settings/profile` | Same profile settings |
| **Custom Domain** | `/admin/stores/[businessId]/domains` | Same domain management |
| **API Access** | `/admin/stores/[businessId]/api` | Same API access |
| **Discounts** | `/admin/stores/[businessId]/discounts` | Same discount management |

**Total: ~15 pages** - These work for both business types.

---

### 🛍️ **PRODUCT-SPECIFIC PAGES** (Hide/Redirect for Salon businesses)

These pages should be **hidden from sidebar** or **redirected** when `businessType === 'SALON'`:

| Page | Path | Action for Salons |
|------|------|-------------------|
| **Products List** | `/admin/stores/[businessId]/products` | → Redirect to `/services` |
| **Product Details** | `/admin/stores/[businessId]/products/[productId]` | → Redirect to `/services/[serviceId]` |
| **Product Categories** | `/admin/stores/[businessId]/product-categories` | → Redirect to `/service-categories` (or hide) |
| **Product Import** | `/admin/stores/[businessId]/products/import` | → Hide (or redirect to service import) |
| **Product Analytics** | `/admin/stores/[businessId]/products/[productId]/analytics` | → Hide |
| **Product Shares** | `/admin/stores/[businessId]/product-shares` | → Hide |
| **Brands** | `/admin/stores/[businessId]/brands` | → Hide (or repurpose for stylists?) |
| **Collections** | `/admin/stores/[businessId]/collections` | → Hide (or repurpose for service packages?) |
| **Groups** | `/admin/stores/[businessId]/groups` | → Hide |
| **Inventory Dashboard** | `/admin/stores/[businessId]/inventory` | → Hide (services don't have inventory) |
| **Inventory Activities** | `/admin/stores/[businessId]/inventory/activities` | → Hide |
| **Inventory Adjustments** | `/admin/stores/[businessId]/inventory/adjustments` | → Hide |
| **Product Inventory Activities** | `/admin/stores/[businessId]/products/[productId]/inventory/activities` | → Hide |
| **Production Queue** | `/admin/stores/[businessId]/orders/production` | → Hide (or repurpose for appointment queue?) |
| **Cost & Margins** | `/admin/stores/[businessId]/cost-margins` | → Hide (or adapt for service pricing?) |
| **Happy Hour** | `/admin/stores/[businessId]/settings/happy-hour` | → Hide (or adapt for salon promotions?) |
| **Custom Menu** | `/admin/stores/[businessId]/custom-menu` | → Hide (or adapt for service menu?) |
| **Custom Filtering** | `/admin/stores/[businessId]/custom-filtering` | → Hide |
| **Delivery Settings** | `/admin/stores/[businessId]/settings/delivery` | → Hide (or adapt for pickup-only?) |

**Total: ~19 pages** - Need to hide/redirect for salons.

---

### ✂️ **SALON-SPECIFIC PAGES** (Need to Create)

These pages are **new** and only for salon businesses:

| Page | Path | Purpose | Priority |
|------|------|---------|----------|
| **Services List** | `/admin/stores/[businessId]/services` | List all services (like products list) | P1 |
| **Service Details** | `/admin/stores/[businessId]/services/[serviceId]` | Create/edit service with duration, staff assignment | P1 |
| **Service Categories** | `/admin/stores/[businessId]/service-categories` | Manage service categories (Hair, Nails, Spa, etc.) | P1 |
| **Appointments List** | `/admin/stores/[businessId]/appointments` | List all appointments/bookings | P1 |
| **Appointment Details** | `/admin/stores/[businessId]/appointments/[appointmentId]` | View/edit appointment details | P1 |
| **Appointments Calendar** | `/admin/stores/[businessId]/appointments/calendar` | Calendar view (daily/weekly) | P2 |
| **Staff Availability** | `/admin/stores/[businessId]/staff/availability` | Set staff working hours and availability | P2 |
| **Service Packages** | `/admin/stores/[businessId]/service-packages` | Create service bundles (optional) | P3 |

**Total: ~8 pages** - Need to be created.

---

## 🔄 **HYBRID PAGES** (Need Conditional Logic)

These pages work for both but need **different UI/logic** based on business type:

| Page | Path | Changes Needed |
|------|------|----------------|
| **Orders List** | `/admin/stores/[businessId]/orders` | For salons: Show "Appointment Date" column, "Assigned Staff" column, different status labels |
| **Order Details** | `/admin/stores/[businessId]/orders/[orderId]` | For salons: Show appointment info, staff assignment, different actions |
| **Create Order** | `/admin/stores/[businessId]/orders/create` | For salons: Create appointment instead of order, different form fields |
| **Dashboard** | `/admin/stores/[businessId]/dashboard` | For salons: Show "Today's Appointments" instead of "Today's Orders" |

**Total: ~4 pages** - Need conditional rendering.

---

## 📊 Summary

| Category | Count | Action |
|----------|-------|--------|
| **Shared Pages** | ~15 | Use as-is (minor tweaks) |
| **Product-Specific** | ~19 | Hide/redirect for salons |
| **Salon-Specific** | ~8 | **CREATE NEW** |
| **Hybrid** | ~4 | Add conditional logic |

---

## 🎯 Implementation Strategy

### Phase 1: Create Salon-Specific Pages (P1)
1. ✅ `/services` - Services list page
2. ✅ `/services/[serviceId]` - Service form (with duration, staff assignment)
3. ✅ `/service-categories` - Service categories management
4. ✅ `/appointments` - Appointments list page
5. ✅ `/appointments/[appointmentId]` - Appointment details page

### Phase 2: Update Sidebar Navigation
- Hide product-specific menu items when `businessType === 'SALON'`
- Show salon-specific menu items when `businessType === 'SALON'`
- Update "Products" menu → "Services" menu for salons
- Update "Orders" menu → "Appointments" menu for salons

### Phase 3: Update Hybrid Pages
- Add conditional logic to Orders pages
- Update Dashboard metrics for salons

### Phase 4: Redirect/Hide Product Pages
- Add middleware or layout checks to redirect product pages for salons
- Or hide them from sidebar navigation

---

## 📁 File Structure Recommendation

```
src/app/admin/stores/[businessId]/
├── services/                    # NEW - Salon services
│   ├── page.tsx                # Services list
│   ├── [serviceId]/
│   │   └── page.tsx            # Service form
│   └── import/
│       └── page.tsx            # Service import (optional)
├── service-categories/          # NEW - Service categories
│   └── page.tsx
├── appointments/                # NEW - Appointments
│   ├── page.tsx                # Appointments list
│   ├── [appointmentId]/
│   │   └── page.tsx            # Appointment details
│   └── calendar/
│       └── page.tsx            # Calendar view
├── products/                    # EXISTING - Hide for salons
├── orders/                      # EXISTING - Conditional logic
└── ... (other shared pages)
```

---

## 🔧 Sidebar Navigation Logic

```typescript
// In AdminSidebar.tsx
const isSalon = businessType === 'SALON'

// Show "Services" instead of "Products" for salons
const mainMenu = isSalon ? [
  { name: 'Services', href: `${baseUrl}/services`, icon: Scissors },
  { name: 'Appointments', href: `${baseUrl}/appointments`, icon: Calendar },
] : [
  { name: 'Products', href: `${baseUrl}/products`, icon: Package },
  { name: 'Orders', href: `${baseUrl}/orders`, icon: ShoppingBag },
]

// Hide product-specific items for salons
const productMenuItems = isSalon ? [] : [
  { name: 'Brands', href: `${baseUrl}/brands` },
  { name: 'Collections', href: `${baseUrl}/collections` },
  // ...
]

// Hide inventory for salons
const inventoryMenu = isSalon ? [] : [
  { name: 'Inventory', href: `${baseUrl}/inventory` },
  // ...
]
```

---

## ✅ Next Steps

1. **Create Services pages** (similar to Products pages structure)
2. **Create Appointments pages** (similar to Orders pages structure)
3. **Update sidebar** to conditionally show/hide menu items
4. **Add redirects** for product pages when accessed by salon businesses
5. **Update Orders pages** with conditional logic for salon appointments
