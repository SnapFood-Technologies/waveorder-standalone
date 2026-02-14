# Salon Admin Pages - Simple List

**Status:** ✅ COMPLETE  
**Last Updated:** February 12, 2026  
**Lead Engineer:** Griseld

---

## ✅ IMPLEMENTATION COMPLETE

All salon-specific admin pages have been successfully created and are fully functional.

## ✅ SHARED PAGES
*(Work for ALL business types - no changes needed)*

| Page | Path |
|------|------|
| Customers | `/admin/stores/[businessId]/customers` |
| Appearance | `/admin/stores/[businessId]/appearance` |
| Marketing | `/admin/stores/[businessId]/marketing` |
| Analytics | `/admin/stores/[businessId]/analytics` |
| Team Management | `/admin/stores/[businessId]/team` |
| Settings | `/admin/stores/[businessId]/settings/*` |
| Help & Support | `/admin/stores/[businessId]/help` |
| Support Tickets | `/admin/stores/[businessId]/support/tickets` |
| Support Messages | `/admin/stores/[businessId]/support/messages` |
| Notifications | `/admin/stores/[businessId]/notifications` |
| Billing | `/admin/stores/[businessId]/settings/billing` |
| Profile | `/admin/stores/[businessId]/settings/profile` |
| Custom Domain | `/admin/stores/[businessId]/domains` |
| API Access | `/admin/stores/[businessId]/api` |
| Discounts | `/admin/stores/[businessId]/discounts` |

**Total: ~15 pages** - No changes needed.

---

## ✂️ SALON-SPECIFIC PAGES
*(Only for SALON businesses - need to CREATE)*

| Page | Path | Purpose |
|------|------|---------|
| **Dashboard** | `/admin/stores/[businessId]/dashboard` | Separate dashboard for salons (show appointments instead of orders) |
| **Services List** | `/admin/stores/[businessId]/services` | List all services (replaces Products) |
| **Service Details** | `/admin/stores/[businessId]/services/[serviceId]` | Create/edit service (duration, staff assignment) |
| **Service Categories** | `/admin/stores/[businessId]/service-categories` | Manage service categories (replaces Product Categories) |
| **Appointments List** | `/admin/stores/[businessId]/appointments` | List all appointments/bookings (replaces Orders) |
| **Appointment Details** | `/admin/stores/[businessId]/appointments/[appointmentId]` | View/edit appointment (replaces Order Details) |
| **Create Appointment** | `/admin/stores/[businessId]/appointments/create` | Create new appointment (replaces Create Order) |
| **Appointments Calendar** | `/admin/stores/[businessId]/appointments/calendar` | Calendar view (daily/weekly) |
| **Staff Availability** | `/admin/stores/[businessId]/staff/availability` | Set staff working hours and availability |

**Total: ~9 pages** - Need to CREATE.

---

## 📝 Notes

- **Products pages** (`/products`, `/product-categories`, etc.) = For non-salon businesses only (hide from salon sidebar)
- **Orders pages** (`/orders`, `/orders/[orderId]`, etc.) = For non-salon businesses only (hide from salon sidebar)
- **Dashboard** = Separate implementation for salons vs. non-salons
- **Inventory pages** = Hide from salon sidebar (services don't have inventory)
- **Brands, Collections, Groups** = Hide from salon sidebar

---

## 🎯 Implementation Order ✅ COMPLETE

1. ✅ **Services pages** (replaces Products)
   - ✅ `/services` - List
   - ✅ `/services/[serviceId]` - Form
   - ✅ `/service-categories` - Categories

2. ✅ **Appointments pages** (replaces Orders)
   - ✅ `/appointments` - List
   - ✅ `/appointments/[appointmentId]` - Details
   - ✅ `/appointments/calendar` - Calendar view

3. ✅ **Dashboard** - Separate salon dashboard (`SalonDashboard.tsx`)

4. ✅ **Sidebar** - Show/hide menu items based on `businessType === 'SALON'`

5. ✅ **Staff Availability** - `/staff/availability` page

**Completed:** February 12, 2026  
**Lead Engineer:** Griseld
