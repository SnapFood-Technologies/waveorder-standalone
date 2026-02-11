# Salon / Beauty Business — Feature Requirements

**Status:** Planning
**Last Updated:** February 11, 2026

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

## Implementation Phases

### Phase 1 — Foundation (MVP)
**Goal:** Salons can list services with duration and accept booking requests via WhatsApp

1. Add `SALON` to `BusinessType` enum
2. Add `isService`, `serviceDuration`, `requiresAppointment` to Product model
3. Update admin product form for salon mode (duration, hide stock)
4. Update WhatsApp message formatting for salon terminology
5. Update admin orders page labels for salon
6. Create `SalonStoreFront.tsx` with service-oriented UI
7. Route salon businesses to the salon storefront
8. Update SuperAdmin business type dropdowns

**No new models needed — orders are still "orders" but with salon terminology and duration display.**

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
