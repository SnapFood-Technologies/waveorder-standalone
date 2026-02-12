# Salon / Beauty Business — Feature Requirements

**Status:** ✅ COMPLETE
**Last Updated:** February 12, 2026
**Lead Engineer:** Griseld

---

## Current State

WaveOrder currently treats all business types the same — products, cart, order via WhatsApp. Salons can technically use the platform today by listing services as "products," but there are no salon-specific features. The `/salons` marketing page exists but promises features we haven't built yet.

### What Works Today (As-Is)
- List services as products (name, price, images, description)
- Categories (Hair, Nails, Spa, etc.)
- Customer places "order" via WhatsApp with selected services
- Basic customer database
- Order management (PENDING → CONFIRMED → etc.)
- Scheduling time slots (currently for delivery/pickup, not appointments)
- Team management (OWNER/MANAGER/STAFF roles)
- Analytics, marketing, discounts

### What's Missing
- `SALON` business type doesn't exist in the enum
- No service duration field
- No appointment/booking concept
- No staff assignment to services
- No salon-specific storefront UI
- No calendar view

---

## Architecture Decision: Storefront Component

### Problem
`StoreFront.tsx` is **6,936 lines** — a monolith. Adding salon-specific logic with if/else would make it worse. RETAIL already has significant branching (postal pricing, different address forms, different delivery terms).

### Recommendation: Separate Storefront Component

Create `SalonStoreFront.tsx` as a **separate component** that:
- Shares base utilities (cart logic, customer form, analytics)
- Has its own UI layout optimized for services (not products)
- Has its own booking flow (appointment request, not cart checkout)

**Why separate:**
- Salon UX is fundamentally different (services, not products in a cart)
- Avoids 50+ `if (businessType === 'SALON')` scattered in 7K lines
- Easier to maintain and iterate on independently
- Can load salon-specific component based on `businessType` in the page route

**Shared utilities (extract from current StoreFront):**
- `useCart` hook (or similar) — cart state management
- `CustomerInfoForm` component — name, phone, email
- `BusinessHeader` component — cover image, logo, hours
- `ProductCard` / `ServiceCard` — base display component
- Analytics tracking utilities
- Translation utilities

**Routing approach:**
```
// src/app/[slug]/page.tsx (storefront page)
if (business.businessType === 'SALON') {
  return <SalonStoreFront data={...} />
} else {
  return <StoreFront data={...} />
}
```

---

## Schema Changes

### 1. Add SALON to BusinessType Enum

```prisma
enum BusinessType {
  RESTAURANT
  CAFE
  RETAIL
  JEWELRY
  FLORIST
  GROCERY
  SALON      // NEW
  OTHER
}
```

### 2. Add Service Fields to Product Model

```prisma
model Product {
  // ... existing fields ...

  // Salon/service fields
  isService            Boolean  @default(false)
  serviceDuration      Int?     // Duration in minutes (e.g., 45)
  requiresAppointment  Boolean  @default(false)
  staffIds             String[] @db.ObjectId  // Which staff can perform this service
}
```

### 3. New Appointment Model (Optional — Phase 2)

```prisma
model Appointment {
  id            String   @id @default(auto()) @map("_id") @db.ObjectId
  orderId       String   @db.ObjectId
  businessId    String   @db.ObjectId
  customerId    String?  @db.ObjectId
  staffId       String?  @db.ObjectId  // Assigned staff member

  appointmentDate DateTime
  startTime       String   // "14:00"
  endTime         String   // "14:45" (calculated from duration)
  duration        Int      // Total minutes

  status   AppointmentStatus @default(REQUESTED)
  notes    String?

  order    Order    @relation(fields: [orderId], references: [id])
  business Business @relation(fields: [businessId], references: [id])

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@index([businessId, appointmentDate])
  @@index([staffId, appointmentDate])
  @@map("appointments")
}

enum AppointmentStatus {
  REQUESTED    // Client submitted via WhatsApp
  CONFIRMED    // Salon confirmed time
  IN_PROGRESS  // Currently being served
  COMPLETED    // Service done
  CANCELLED    // Cancelled
  NO_SHOW      // Client didn't show up
}
```

### 4. Business Model — Salon Settings

```prisma
model Business {
  // ... existing fields ...

  // Salon-specific settings
  appointmentBufferMinutes  Int?     @default(15)  // Buffer between appointments
  allowOnlineBooking        Boolean  @default(true)
  showServiceDuration       Boolean  @default(true)
  showStaffSelection        Boolean  @default(false)
}
```

---

## Changes by Area

### A. Admin Dashboard

| Feature | What Changes | Priority |
|---------|-------------|----------|
| **Sidebar** | Show "Appointments" instead of (or alongside) "Orders" when `businessType === 'SALON'` | P1 |
| **Product Form** | Show duration field, "is service" toggle, staff assignment when salon | P1 |
| **Orders List** | Show appointment date/time column for salon orders | P1 |
| **Calendar View** | New page: `/admin/stores/{id}/appointments` — daily/weekly calendar | P2 |
| **Staff Management** | Add staff availability hours, assign services to staff | P2 |
| **Dashboard Metrics** | Show "Today's Appointments" instead of "Today's Orders" | P2 |

#### Admin Product Form Changes (Salon Mode)

When `businessType === 'SALON'`:
- Label "Product Name" → "Service Name"
- Label "Price" → "Service Price"
- Show **Duration** field (dropdown: 15, 30, 45, 60, 90, 120 min or custom)
- Show **Staff** multi-select (which team members can perform this service)
- Hide inventory/stock fields (services don't have stock)
- Hide SKU field
- Hide variant fields (or repurpose for service levels: "Basic Cut" / "Premium Cut")
- Keep modifiers (useful for add-ons: "Deep Conditioning +$20")

#### Admin Orders Page Changes (Salon Mode)

- Column: "Appointment Date" visible
- Column: "Assigned Staff" visible
- Filter by: staff member, date range
- Status labels: "Requested" / "Confirmed" / "In Progress" / "Completed" / "No Show"
- Quick action: "Confirm Appointment" (instead of "Confirm Order")

---

### B. Storefront UI

| Feature | What Changes | Priority |
|---------|-------------|----------|
| **New Component** | `SalonStoreFront.tsx` — separate from main StoreFront | P1 |
| **Service Cards** | Show duration badge, "Book" instead of "Add to Cart" | P1 |
| **Booking Flow** | Select services → pick preferred date/time → send via WhatsApp | P1 |
| **Terminology** | "Book" not "Order", "Services" not "Products", "Appointment" not "Delivery" | P1 |
| **Staff Display** | Optionally show which stylist/specialist provides each service | P2 |
| **Theme** | Rose/pink accent colors (matching `/salons` page design) | P2 |

#### Salon Storefront Flow

```
1. Browse Services (by category: Hair, Nails, Spa, etc.)
2. Select Service(s) → shows duration + price
3. View Cart Summary → total price, total duration
4. Enter Customer Info (name, phone)
5. Select Preferred Date + Time (optional, or just "ASAP")
6. Submit via WhatsApp → formatted message:
   "🌸 New Booking Request
    Client: Maria Garcia (+1 555-0123)
    
    Services:
    • Haircut & Style — 45 min — $65
    • Gel Manicure — 60 min — $45
    
    Total: $110 | Est. Duration: 1h 45min
    Preferred: Sat Feb 15, 2:00 PM
    
    Please confirm availability."
```

#### WhatsApp Message Terms

Add to `messageTerms` in order route:
```typescript
SALON: {
  orderTitle: 'Booking Request',
  itemsLabel: 'Services',
  deliveryLabel: 'Appointment',
  pickupLabel: 'Walk-in',
  // etc.
}
```

---

### C. SuperAdmin

| Feature | What Changes | Priority |
|---------|-------------|----------|
| **Business Type** | Add SALON to enum, update all dropdowns/filters | P1 |
| **Business Details** | Show appointment stats for salon businesses | P2 |
| **Analytics** | Include salon metrics in operations analytics | P2 |
| **Feature Flags** | `showAppointmentCalendar` toggle per business | P2 |
| **Onboarding** | Salon-specific onboarding flow (service setup instead of product setup) | P3 |

---

### D. Marketing & Public-Facing Pages

| Feature | What Changes | Priority | File Location |
|---------|-------------|----------|---------------|
| **Header Navigation** | Add "Salons & Beauty" to Industries dropdown (desktop + mobile) | P1 | `src/components/site/Header.tsx` (lines 71-80, 174-182) |
| **Footer Links** | Add "Salons & Beauty" link in Industries section | P1 | `src/components/site/Footer.tsx` (lines 79-95) |
| **Home Page** | Add Salons card in "Built for Every Business" section | P1 | `src/components/site/Home.tsx` (lines 203-227) |
| **Sitemap** | Add `/salons` static page entry | P1 | `src/app/sitemap.ts` (lines 97-115) |
| **Onboarding** | Add SALON option to business type selection | P1 | `src/components/setup/steps/BusinessTypeStep.tsx` (lines 25-34) |
| **Storefront Route** | Route SALON businesses to SalonStoreFront component | P1 | `src/app/(site)/[slug]/page.tsx` |
| **Layout Routes** | Already includes `/salons` — no change needed | ✅ | `src/app/(site)/layout.tsx` (line 43) |

#### Header Changes (`src/components/site/Header.tsx`)

**Desktop Industries Dropdown (lines 71-80):**
```tsx
<Link href="/salons" className="block px-4 py-2 text-gray-700 hover:bg-teal-50 hover:text-teal-600 transition-colors">
  Salons & Beauty
</Link>
```

**Mobile Industries Section (lines 174-182):**
```tsx
<Link href="/salons" onClick={closeMenu} className="block text-gray-600 hover:text-teal-600 py-1">
  Salons & Beauty
</Link>
```

#### Footer Changes (`src/components/site/Footer.tsx`)

**Industries Links Section (lines 79-95):**
```tsx
<li>
  <Link href="/salons" className="text-gray-400 hover:text-white transition-colors">
    Salons & Beauty
  </Link>
</li>
```

#### Home Page Changes (`src/components/site/Home.tsx`)

**"Built for Every Business" Section (lines 203-227):**
- Add 4th card for Salons:
```tsx
<Link href="/salons" className="bg-white p-6 rounded-2xl text-center border-2 border-transparent hover:border-teal-500 hover:-translate-y-1 transition-all hover:shadow-xl group">
  <div className="w-16 h-16 mx-auto mb-4 rounded-2xl flex items-center justify-center text-2xl bg-pink-500">
    <Scissors className="w-8 h-8 text-white" />
  </div>
  <h3 className="font-semibold text-gray-900 mb-2">Salons & Beauty</h3>
  <p className="text-sm text-gray-500">Service booking and appointment management. Let clients book services and send requests via WhatsApp.</p>
</Link>
```

- Update description (line 199) to mention salons:
```tsx
"Whether you sell on Instagram, run a restaurant, operate a salon, or offer services — WaveOrder adapts to how you work."
```

#### Sitemap Changes (`src/app/sitemap.ts`)

**Static Pages Section (lines 97-115):**
```typescript
{
  url: `${baseUrl}/salons`,
  lastModified: formatDate('2026-02-11'),
  changeFrequency: 'monthly',
  priority: 0.8,
},
```

**Note:** Business pages already include all business types (no filter needed) — SALON businesses will automatically appear in sitemap if they meet criteria (isActive, isIndexable, etc.).

#### Onboarding Changes (`src/components/setup/steps/BusinessTypeStep.tsx`)

**Business Types Array (lines 25-34):**
```typescript
const businessTypes = [
  { value: 'RESTAURANT', label: 'Restaurant', icon: UtensilsCrossed },
  { value: 'CAFE', label: 'Cafe', icon: Coffee },
  { value: 'RETAIL', label: 'Retail & Shopping', icon: ShoppingBag },
  { value: 'GROCERY', label: 'Grocery & Supermarket', icon: Apple },
  { value: 'HEALTH_BEAUTY', label: 'Health & Beauty', icon: Scissors },
  { value: 'SALON', label: 'Salon & Beauty', icon: Sparkles }, // NEW - using Sparkles icon
  { value: 'JEWELRY', label: 'Jewelry Store', icon: Gem },
  { value: 'FLORIST', label: 'Florist', icon: Flower2 },
  { value: 'OTHER', label: 'Other', icon: MoreHorizontal }
]
```

**Note:** Need to import `Sparkles` icon from `lucide-react` (or use `Scissors` if Sparkles not available).

#### Storefront Route Changes (`src/app/(site)/[slug]/page.tsx`)

**Add conditional routing:**
```typescript
if (business.businessType === 'SALON') {
  return <SalonStoreFront data={storeData} />
} else {
  return <StoreFront data={storeData} />
}
```

**Note:** This requires `SalonStoreFront.tsx` to be built first (Phase 1b). Until then, can route to existing `StoreFront` with a note that salon-specific UI is coming.

---

## Implementation Phases

### Phase 1 — Foundation (MVP)
**Goal:** Salons can list services with duration and accept booking requests via WhatsApp

#### Phase 1a — Backend Foundation & Marketing (Low Risk, Deployable Independently)

**Marketing & Public Pages:**
1. Add `SALON` to `BusinessType` enum in Prisma schema
2. Update Header navigation (Industries dropdown — desktop + mobile)
3. Update Footer (Industries links section)
4. Update Home page ("Built for Every Business" section — add Salons card)
5. Add `/salons` to sitemap static pages
6. Add SALON option to onboarding BusinessTypeStep
7. Update SuperAdmin business type dropdowns/filters

**Backend/Admin:**
8. Add `isService`, `serviceDuration`, `requiresAppointment` to Product model
9. Update admin product form for salon mode (duration field, hide stock/SKU)
10. Update WhatsApp message formatting for salon terminology
11. Update admin orders page labels for salon (terminology only)

**No new models needed — orders are still "orders" but with salon terminology and duration display.**

#### Phase 1b — Storefront Component (Higher Complexity)

12. Create `SalonStoreFront.tsx` with service-oriented UI
13. Route salon businesses to the salon storefront in `[slug]/page.tsx`

**Note:** Phase 1a can be deployed independently and tested. Phase 1b requires design decisions and is a larger build (~1500-2500 lines).

### Phase 2 — Appointment Management
**Goal:** In-app appointment tracking, staff assignment, calendar

1. Create `Appointment` model linked to orders
2. Build admin calendar view (`/admin/stores/{id}/appointments`)
3. Staff assignment to services (product form)
4. Staff assignment to appointments (order detail)
5. Appointment status flow (Requested → Confirmed → In Progress → Completed)
6. Staff availability configuration
7. Appointment buffer time settings

### Phase 3 — Advanced
**Goal:** Full salon management

1. Staff individual schedules/calendars
2. Double-booking prevention
3. Recurring appointments
4. No-show tracking and client reliability scoring
5. Service packages/bundles
6. Online payment for appointments (pre-pay or deposit)
7. Automated WhatsApp reminders (24h before appointment)
8. Waitlist for fully booked slots
9. Client service history and preferences

---

## Storefront Component Extraction Plan

To avoid making the monolith worse, extract shared components before building `SalonStoreFront`:

```
src/components/storefront/
├── StoreFront.tsx              (existing — 6,936 lines, keep for non-salon)
├── SalonStoreFront.tsx         (NEW — salon-specific layout + flow)
├── shared/
│   ├── BusinessHeader.tsx      (cover image, logo, name, hours)
│   ├── CategoryTabs.tsx        (category filtering)
│   ├── CustomerInfoForm.tsx    (name, phone, email, address)
│   ├── CartSummary.tsx         (cart items, totals)
│   ├── ServiceCard.tsx         (NEW — duration badge, book button)
│   ├── TimeSlotPicker.tsx      (shared scheduling UI)
│   ├── BusinessInfoModal.tsx   (hours, location, about)
│   └── ShareModal.tsx          (share link/QR)
```

**Important:** Extract shared components incrementally. Don't refactor the entire StoreFront at once — just extract what `SalonStoreFront` needs to share.

---

## Questions to Decide Before Building

1. **Do salons use the same order model?** (Recommended: Yes, just with appointment metadata)
2. **Do we need staff selection on storefront?** (Recommended: Phase 2, optional per business)
3. **Do we need a real calendar/booking system or just WhatsApp requests?** (Recommended: Phase 1 = WhatsApp only, Phase 2 = calendar)
4. **Should salon onboarding be different?** (Recommended: Phase 3, for now reuse existing with salon labels)
5. **Do we support walk-ins?** (Recommended: Yes, treat as PICKUP order type)

---

## Complete File Checklist

### Phase 1a — Backend Foundation & Marketing

| File | Change | Status |
|------|--------|--------|
| `prisma/schema.prisma` | Add `SALON` to `BusinessType` enum | ✅ |
| `prisma/schema.prisma` | Add `isService`, `serviceDuration`, `requiresAppointment` to Product model | ✅ |
| `src/components/site/Header.tsx` | Add "Salons & Beauty" to Industries dropdown (desktop + mobile) | ✅ |
| `src/components/site/Footer.tsx` | Add "Salons & Beauty" link in Industries section | ✅ |
| `src/components/site/Home.tsx` | Add Salons card in "Built for Every Business" section | ✅ |
| `src/app/sitemap.ts` | Add `/salons` static page entry | ✅ |
| `src/components/setup/steps/BusinessTypeStep.tsx` | Add SALON option to businessTypes array | ✅ |
| `src/components/admin/products/ProductForm.tsx` | Add salon mode (duration field, hide stock/SKU) | ✅ |
| `src/app/api/storefront/[slug]/order/route.ts` | Add salon-specific WhatsApp message terms | ✅ |
| `src/components/admin/stores/[businessId]/orders/page.tsx` | Update labels for salon (terminology) | ✅ |
| `src/components/superadmin/*` | Add SALON to all business type dropdowns/filters | ✅ |

### Phase 1b — Storefront Component

| File | Change | Status |
|------|--------|--------|
| `src/components/storefront/SalonStoreFront.tsx` | Create new salon-specific storefront component | ✅ |
| `src/app/(site)/[slug]/page.tsx` | Add conditional routing for SALON businesses | ✅ |

### Phase 2 — Appointment Management

| File | Change | Status |
|------|--------|--------|
| `prisma/schema.prisma` | Add `Appointment` model and `AppointmentStatus` enum | ✅ |
| `src/app/admin/stores/[businessId]/appointments/page.tsx` | Create appointments list page | ✅ |
| `src/app/admin/stores/[businessId]/appointments/calendar/page.tsx` | Create calendar view page | ✅ |
| `src/app/admin/stores/[businessId]/appointments/[appointmentId]/page.tsx` | Create appointment details page | ✅ |
| `src/app/admin/stores/[businessId]/services/page.tsx` | Create services list page | ✅ |
| `src/app/admin/stores/[businessId]/services/[serviceId]/page.tsx` | Create service form page | ✅ |
| `src/app/admin/stores/[businessId]/service-categories/page.tsx` | Create service categories page | ✅ |
| `src/app/admin/stores/[businessId]/staff/availability/page.tsx` | Create staff availability page | ✅ |
| `src/components/admin/products/ProductForm.tsx` | Add staff assignment to services | ✅ |
| `src/components/admin/stores/[businessId]/orders/[orderId]/page.tsx` | Add staff assignment to appointments | ⬜ (Not needed - separate appointments pages) |
| `src/components/admin/stores/[businessId]/settings/BusinessConfiguration.tsx` | Add appointment buffer time settings | ✅ |

**Legend:** ⬜ Not Started | 🟡 In Progress | ✅ Complete

---

## ✅ IMPLEMENTATION COMPLETE

**All Phase 1 and Phase 2 features have been successfully implemented.**

**Completed Date:** February 12, 2026  
**Lead Engineer:** Griseld

### Summary of Completed Work:

✅ **Schema Changes**
- Added `SALON` to BusinessType enum
- Added service fields to Product model (`isService`, `serviceDuration`, `requiresAppointment`, `staffIds`)
- Created `Appointment` model with `AppointmentStatus` enum
- Added salon-specific business settings

✅ **Admin Pages**
- Services List, Create/Edit, Categories
- Appointments List, Details, Calendar View
- Staff Availability Management
- Salon-specific Dashboard

✅ **Storefront**
- Created `SalonStoreFront.tsx` component
- Conditional routing based on business type
- Service-oriented UI with booking flow

✅ **SuperAdmin**
- Updated all pages with SALON support
- Added SALON to all dropdowns and filters
- Created Bookings analytics page
- Updated Business Details page

✅ **Marketing & Public Pages**
- Header navigation updated
- Footer links updated
- Home page updated
- Sitemap updated
- Onboarding updated

✅ **Notifications & Messaging**
- WhatsApp message terminology updated
- Email notification terminology updated
- Admin notification terminology updated

✅ **Sidebar & Navigation**
- Conditional menu items based on business type
- Plan-based feature access
- Proper guards and redirects
