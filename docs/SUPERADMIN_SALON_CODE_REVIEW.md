# Code Review: Superadmin Salon Business Support Implementation

**Review Date:** February 17, 2026  
**Reviewer:** AI Code Review  
**Status:** Review Complete  
**Overall Assessment:** Good implementation with several issues to address

---

## Table of Contents

1. [Overview](#overview)
2. [Bugs Found](#bugs-found)
3. [Missing Requirements](#missing-requirements)
4. [Completeness Assessment](#completeness-assessment)
5. [Backward Compatibility](#backward-compatibility)
6. [Code Quality Assessment](#code-quality-assessment)
7. [Performance Concerns](#performance-concerns)
8. [Security Assessment](#security-assessment)
9. [Actionable Items Summary](#actionable-items-summary)

---

## Overview

This review covers the implementation of salon business support across superadmin screens, as specified in `docs/SUPERADMIN_SALON_CHANGES.md` and summarized in `docs/SUPERADMIN_SALON_CHANGES_IMPLEMENTED.md`.

**Key concept:** Salon businesses (`businessType === 'SALON'`) use Appointments instead of Orders, Services instead of Products, and don't have stock/marketplace features.

**Files reviewed:**
- `src/app/superadmin/businesses/[businessId]/appointments/page.tsx` (NEW)
- `src/app/api/superadmin/businesses/[businessId]/appointments/stats/route.ts` (NEW)
- `src/app/superadmin/businesses/[businessId]/page.tsx` (modified)
- `src/app/superadmin/businesses/[businessId]/orders/page.tsx` (modified)
- `src/app/superadmin/businesses/[businessId]/marketplace/page.tsx` (modified)
- `src/app/superadmin/businesses/[businessId]/vendors/[vendorId]/orders/page.tsx` (modified)
- `src/app/superadmin/businesses/[businessId]/connections/page.tsx` (modified)
- `src/components/superadmin/SuperAdminBusinesses.tsx` (modified)
- `src/components/superadmin/SuperAdminAnalytics.tsx` (modified)
- `src/components/superadmin/SuperAdminDashboard.tsx` (modified)
- `src/app/superadmin/system/debug/page.tsx` (modified)
- `src/app/superadmin/system/logs/page.tsx` (modified)
- `src/app/api/superadmin/analytics/route.ts` (modified)
- `src/app/api/admin/stores/[businessId]/appointments/[appointmentId]/route.ts` (modified)

---

## Bugs Found

### BUG 1: Production Planning Settings NOT Hidden for Salons

| Field | Value |
|---|---|
| **Severity** | Medium |
| **File** | `src/app/superadmin/businesses/[businessId]/page.tsx` |
| **Lines** | 1419-1420 |
| **Status** | Open |

**Description:**  
The requirements doc explicitly states Production Planning should be hidden for salons (spec lines 200-204), and the implementation summary marks it as completed. However, the actual code does **not** wrap it in a salon guard.

**Current code (line 1419-1420):**
```typescript
{/* Production Planning Settings */}
<ProductionPlanningSettingsSection business={business} onUpdate={fetchBusinessDetails} />
```

**Compare with Delivery Management, which IS correctly wrapped (line 1425-1428):**
```typescript
{/* Delivery Management Settings - Hide for salons */}
{business.businessType !== 'SALON' && (
  <DeliveryManagementSettingsSection business={business} onUpdate={fetchBusinessDetails} />
)}
```

**Fix:**
```typescript
{/* Production Planning Settings - Hide for salons */}
{business.businessType !== 'SALON' && (
  <ProductionPlanningSettingsSection business={business} onUpdate={fetchBusinessDetails} />
)}
```

---

### BUG 2: `last_year` Period Returns Data Through Today Instead of Only Last Year

| Field | Value |
|---|---|
| **Severity** | Medium |
| **File** | `src/app/api/superadmin/businesses/[businessId]/appointments/stats/route.ts` |
| **Lines** | 68-75 |
| **Status** | Open |

**Description:**  
When `period === 'last_year'`, the code sets `startDate` to January 1 of last year but sets **no end date**. The query uses `appointmentDate: { gte: startDate }` with no upper bound, so selecting "Last Year" actually returns **last year + this year combined**.

**Current code (line 68-71):**
```typescript
case 'last_year':
  startDate = new Date(now.getFullYear() - 1, 0, 1)
  grouping = 'month'
  break
```

**The where clause only has a lower bound (line 78-81):**
```typescript
const whereClause: any = {
  businessId: businessId,
  appointmentDate: { gte: startDate }
}
```

**Fix:**  
Add an `endDate` variable and use it in the where clause:

```typescript
let endDate: Date | undefined

// In the switch case:
case 'last_year':
  startDate = new Date(now.getFullYear() - 1, 0, 1)
  endDate = new Date(now.getFullYear(), 0, 1) // Jan 1 of current year
  grouping = 'month'
  break

// In the where clause:
const whereClause: any = {
  businessId: businessId,
  appointmentDate: {
    gte: startDate,
    ...(endDate && { lt: endDate })
  }
}
```

**Note:** The same `endDate` constraint should also be applied to the `allAppointments` query on line 136-149.

---

### BUG 3: `stats.totalAppointments` Uses Filtered Count While Other Stats Use Unfiltered Data

| Field | Value |
|---|---|
| **Severity** | Low |
| **File** | `src/app/api/superadmin/businesses/[businessId]/appointments/stats/route.ts` |
| **Lines** | 99, 136-166, 209 |
| **Status** | Open |

**Description:**  
There is an inconsistency in the stats response:

- `totalAppointments` (line 99) is counted with the **filtered** `whereClause` (includes search + status filter)
- `totalRevenue`, `completionRate`, `statusBreakdown` (lines 136-166) are calculated from `allAppointments` which only filters by businessId + date (unfiltered by search/status)

This means when a user filters by a status (e.g., "COMPLETED"):
- "Total Appointments" stat card shows: only completed count (filtered)
- "Total Revenue" stat card shows: revenue from ALL appointments (unfiltered)
- "Completion Rate" stat card shows: rate across ALL appointments (unfiltered)

**Fix:**  
Use `allAppointments.length` for `stats.totalAppointments` and keep the filtered count only for `pagination.total`:

```typescript
// Line 209: use unfiltered count for stats
stats: {
  totalAppointments: allAppointments.length,  // was: totalAppointments (filtered)
  totalRevenue,
  averageAppointmentValue,
  completionRate,
  statusBreakdown
},
// Line 218: keep filtered count for pagination
pagination: {
  page,
  limit,
  total: totalAppointments,  // filtered count for pagination
  pages: Math.ceil(totalAppointments / limit)
}
```

---

### BUG 4: Division by Zero in Status Breakdown Percentage

| Field | Value |
|---|---|
| **Severity** | Low |
| **File** | `src/app/superadmin/businesses/[businessId]/appointments/page.tsx` |
| **Line** | 507 |
| **Status** | Open |

**Description:**  
The status breakdown section divides by `data.stats.totalAppointments` without a zero check:

```typescript
({((item.value / data.stats.totalAppointments) * 100).toFixed(1)}%)
```

If `totalAppointments` is 0 (possible with the filtered stats bug above, or for a new salon with no appointments), this produces `NaN%`.

**Fix:**
```typescript
({(data.stats.totalAppointments > 0
  ? ((item.value / data.stats.totalAppointments) * 100).toFixed(1)
  : '0.0'
)}%)
```

---

## Missing Requirements

### MISSING 1: Affiliate System Description Text Not Updated for Salons

| Field | Value |
|---|---|
| **Severity** | Low |
| **File** | `src/app/superadmin/businesses/[businessId]/page.tsx` |
| **Lines** | ~2985, ~3009 |
| **Status** | Open |

**Description:**  
The Affiliate System settings section still uses order-only language, which is misleading for salon businesses where the commission is triggered by appointment completion.

**Current text (line ~2985):**
```
When enabled, business admins can create affiliates, generate tracking links, track commissions, 
and manage affiliate payments. Orders from affiliate links are automatically attributed and 
commissions are calculated when orders are completed.
```

**Current text (line ~3009):**
```
Commissions are automatically calculated when orders are completed (PAID + DELIVERED/PICKED_UP).
```

**Fix:**  
Make the description conditional:
```typescript
<p className="text-xs text-gray-500 mt-1">
  When enabled, business admins can create affiliates, generate tracking links, track commissions,
  and manage affiliate payments. {business.businessType === 'SALON'
    ? 'Appointments from affiliate links are automatically attributed and commissions are calculated when appointments are completed.'
    : 'Orders from affiliate links are automatically attributed and commissions are calculated when orders are completed.'}
</p>
```

---

## Completeness Assessment

### Requirements vs Implementation Matrix

| # | Requirement | Status | Notes |
|---|---|---|---|
| 1 | Business Details - Hide product stock stats for salons | ✅ Done | Correctly wrapped with `!== 'SALON'` |
| 2 | Business Details - Keep Products With Zero Price for salons | ✅ Done | Kept with conditional labels |
| 3 | Business Details - Hide "Products Without Photos" toggle | ✅ Done | Wrapped correctly |
| 4 | Business Details - Marketplace card hidden for salons | ✅ Done | Marketplace fetch also skipped |
| 5 | Business Details - External Syncs text updated | ✅ Done | "product" → "service" conditional |
| 6 | Business Details - Hide Custom Features | ✅ Done | Wrapped correctly |
| 7 | Business Details - Hide Connected Businesses | ✅ Done | Wrapped correctly |
| 8 | Business Details - Hide Happy Hour | ✅ Done | Wrapped correctly |
| 9 | Business Details - Hide Production Planning | ❌ **Missing** | **Not wrapped (BUG 1)** |
| 10 | Business Details - Hide Delivery Management | ✅ Done | Wrapped correctly |
| 11 | Business Details - Hide Packaging Tracking | ✅ Done | Wrapped correctly |
| 12 | Quick View Modal - Products → Services label | ✅ Done | Conditional labels and icons |
| 13 | Quick View Modal - Orders → Appointments label | ✅ Done | Conditional label |
| 14 | Quick View Modal - Hide supplier product count | ✅ Done | Hidden for salons |
| 15 | Appointments Page created | ✅ Done | Full page with stats, charts, table |
| 16 | Appointments API endpoint created | ✅ Done | With auth, type checks, pagination |
| 17 | Orders page redirect for salons | ✅ Done | Redirects to appointments page |
| 18 | Analytics - Conditional terminology | ✅ Done | "orders/appointments" inclusive text |
| 19 | Dashboard - Conditional suggestions | ✅ Done | WhatsApp message updated |
| 20 | System Logs - Appointment filter types | ✅ Done | appointment_created, appointment_error |
| 21 | Debug - Hide stock debug for salons | ✅ Done | Uses `hideForSalons` flag |
| 22 | Marketplace page redirect for salons | ✅ Done | Redirects to business details |
| 23 | Vendor orders page redirect for salons | ✅ Done | Redirects to business details |
| 24 | Connections page redirect for salons | ✅ Done | Redirects to business details |
| 25 | Affiliate commission for appointments | ✅ Done | Created on COMPLETED, cancelled on CANCELLED |
| 26 | Analytics API - Include appointments in total | ✅ Done | `totalOrdersAndAppointments` |
| 27 | Affiliate description text updated for salons | ❌ **Missing** | Still uses order-only language |

**Score: 25/27 requirements implemented (93%)**

---

## Backward Compatibility

**Assessment: GOOD - No breaking changes for non-salon businesses.**

All modifications are conditional on `business.businessType === 'SALON'`. Non-salon businesses will see zero changes. Specific patterns used:

1. **Hiding elements:** `{business.businessType !== 'SALON' && (...)}` - only hides for salons
2. **Conditional labels:** `{business.businessType === 'SALON' ? 'Appointments' : 'Orders'}` - non-salons see original text
3. **Inclusive text:** Analytics uses "orders/appointments" which is accurate for all business types
4. **Redirects:** Only trigger when `businessType === 'SALON'` - no effect on other types
5. **API endpoint:** New appointments stats endpoint returns 403 for non-salon businesses

---

## Code Quality Assessment

### Strengths

1. **Consistent conditional pattern** - `business.businessType !== 'SALON'` used throughout with clear comments
2. **Well-documented sections** - Every hidden section has a `{/* Hide for salons */}` comment
3. **Proper error handling in API** - Auth check, business existence check, business type validation, try/catch
4. **Good UX patterns** - Search debouncing, loading skeletons, empty states, pagination
5. **Affiliate logic correct** - Commission created on COMPLETED, cancelled on CANCELLED, with silent failure (non-blocking)
6. **Status validation** - API uses allowlist for valid appointment statuses

### Concerns

#### 1. Redirect Race Condition (Minor)

**File:** `src/app/superadmin/businesses/[businessId]/orders/page.tsx`

The orders page fetches data simultaneously with the redirect check. Both effects run in parallel:

```typescript
// Line 139-155: redirect check
useEffect(() => { checkBusinessType() }, [businessId, router])

// Line 174-176: data fetch (runs even for salons before redirect)
useEffect(() => { fetchData() }, [businessId, selectedPeriod, ...])
```

**Impact:** Wasteful API call for salon businesses. Not harmful but inefficient.

**Suggestion:** Gate the data fetch behind the business type check:
```typescript
useEffect(() => {
  if (businessType && businessType !== 'SALON') {
    fetchData()
  }
}, [businessType, businessId, selectedPeriod, ...])
```

#### 2. Connections Page Makes Double API Call

**File:** `src/app/superadmin/businesses/[businessId]/connections/page.tsx`

The page fetches business data once in the redirect check (lines 36-51), then again in `fetchBusinessName()` (lines 55-57 trigger). The first response could be reused.

#### 3. `any` Type for Prisma Where Clause

**File:** `src/app/api/superadmin/businesses/[businessId]/appointments/stats/route.ts`, line 78

```typescript
const whereClause: any = {
  businessId: businessId,
  appointmentDate: { gte: startDate }
}
```

Using `any` loses type safety. Should use `Prisma.AppointmentWhereInput` for compile-time validation of the query structure.

#### 4. Dead Conditional Code Inside Hidden Block

**File:** `src/app/superadmin/businesses/[businessId]/page.tsx`, lines 572 and 584

These lines have salon-conditional text:
```typescript
{business.businessType === 'SALON' ? 'services' : 'products'}
```

But they exist inside the marketplace card which is already hidden for salons (line 548):
```typescript
{business.businessType !== 'SALON' && marketplaceInfo && ...}
```

The salon branch of these ternaries is unreachable. Not a bug, just dead code.

#### 5. `formatStatusLabel` Only Replaces First Underscore

**File:** `src/app/superadmin/businesses/[businessId]/appointments/page.tsx`, line 193

```typescript
const formatStatusLabel = (status: string): string => {
  return status.replace('_', ' ')
}
```

`String.replace()` with a string argument only replaces the first occurrence. Currently all statuses only have one underscore (`IN_PROGRESS`, `NO_SHOW`), so this works. But for future-proofing, consider using a regex: `status.replace(/_/g, ' ')`.

---

## Performance Concerns

### 1. Loading All Appointments Into Memory for Stats (Medium)

**File:** `src/app/api/superadmin/businesses/[businessId]/appointments/stats/route.ts`, lines 136-149

The API fetches **all** appointments in the selected period into memory to calculate stats:

```typescript
const allAppointments = await prisma.appointment.findMany({
  where: {
    businessId: businessId,
    appointmentDate: { gte: startDate }
  },
  include: {
    order: {
      select: { total: true, paymentStatus: true }
    }
  }
})
```

For businesses with thousands of appointments, this loads all records into Node.js memory. The stats are then computed with array methods (`.filter()`, `.reduce()`).

**Recommendation:** Use Prisma aggregation queries instead:

```typescript
// Total revenue
const revenueResult = await prisma.appointment.aggregate({
  where: { businessId, appointmentDate: { gte: startDate }, order: { paymentStatus: 'PAID' } },
  _sum: { order: { total: true } }
})

// Status breakdown
const statusBreakdown = await prisma.appointment.groupBy({
  by: ['status'],
  where: { businessId, appointmentDate: { gte: startDate } },
  _count: true
})
```

### 2. Chart Data Aggregation Done in JavaScript (Low)

Lines 169-177 aggregate chart data by date in JavaScript. This could be done at the database level with a GROUP BY query for better performance with large datasets.

### 3. Three Separate Queries for Related Data (Low)

The endpoint makes three queries that could potentially be optimized:
- `prisma.appointment.count()` - total count
- `prisma.appointment.findMany()` - paginated results
- `prisma.appointment.findMany()` - ALL records for stats

Consider combining the count with the paginated query, and using aggregation for stats.

---

## Security Assessment

**Assessment: GOOD - No security issues found.**

| Check | Status | Details |
|---|---|---|
| Authentication | ✅ | `getServerSession` + `session.user.role !== 'SUPER_ADMIN'` check |
| Authorization | ✅ | Business type validation prevents non-salon access |
| Input Validation | ✅ | Status values validated against allowlist |
| SQL Injection | ✅ | Prisma ORM handles parameterization |
| Sensitive Data | ✅ | No hardcoded secrets or API keys |
| Error Messages | ✅ | Generic error messages, no stack traces exposed |
| Business Access | ✅ | `checkBusinessAccess()` used in appointment CRUD |

---

## Actionable Items Summary

### 🔴 Must Fix (2 items)

| # | Issue | File | Effort |
|---|---|---|---|
| 1 | **Production Planning not hidden for salons** | `businesses/[businessId]/page.tsx` line 1419 | 2 min |
| 2 | **`last_year` period has no end date** | `appointments/stats/route.ts` line 68 | 5 min |

### 🟡 Should Fix (4 items)

| # | Issue | File | Effort |
|---|---|---|---|
| 3 | **`stats.totalAppointments` uses filtered count** | `appointments/stats/route.ts` line 209 | 2 min |
| 4 | **Division by zero in status percentage** | `appointments/page.tsx` line 507 | 2 min |
| 5 | **Affiliate description not updated for salons** | `businesses/[businessId]/page.tsx` line ~2985 | 5 min |
| 6 | **Orders page data fetch fires before redirect** | `businesses/[businessId]/orders/page.tsx` line 174 | 5 min |

### 🟢 Nice to Have (4 items)

| # | Issue | File | Effort |
|---|---|---|---|
| 7 | Replace `any` type with `Prisma.AppointmentWhereInput` | `appointments/stats/route.ts` line 78 | 2 min |
| 8 | Use database-level aggregation for stats | `appointments/stats/route.ts` lines 136-177 | 30 min |
| 9 | Remove dead salon-conditional code in marketplace card | `businesses/[businessId]/page.tsx` lines 572, 584 | 2 min |
| 10 | Optimize connections page to avoid double API call | `connections/page.tsx` | 10 min |

---

## Testing Recommendations

### Manual Testing Checklist

- [ ] Visit Business Details for a SALON business - verify Production Planning is hidden (after fix)
- [ ] Visit Business Details for a non-SALON business - verify Production Planning is visible
- [ ] On Appointments page, select "Last Year" period - verify only last year data shown (after fix)
- [ ] On Appointments page with no appointments - verify no NaN% displayed
- [ ] On Appointments page, apply status filter - verify stat cards are consistent
- [ ] Visit `/superadmin/businesses/[salonId]/orders` - verify redirect to appointments
- [ ] Visit `/superadmin/businesses/[salonId]/marketplace` - verify redirect to business details
- [ ] Visit `/superadmin/businesses/[salonId]/vendors/[id]/orders` - verify redirect
- [ ] Visit `/superadmin/businesses/[salonId]/connections` - verify redirect
- [ ] Quick View Modal for salon - verify "Services" and "Appointments" labels
- [ ] Quick View Modal for non-salon - verify "Products" and "Orders" labels
- [ ] Complete an appointment for a salon with affiliates - verify commission created
- [ ] Cancel an appointment for a salon with affiliates - verify commission cancelled
- [ ] Verify non-salon businesses see zero UI changes across all pages

### Edge Cases to Verify

- [ ] Salon business with zero appointments (empty states, no division by zero)
- [ ] Salon business with affiliate system enabled (description text accuracy)
- [ ] Business type change from non-salon to salon (if supported)
- [ ] API endpoint called with invalid businessId (404 response)
- [ ] API endpoint called for non-salon business (403 response)
- [ ] Very large appointment dataset (performance under load)

### Automated Tests to Consider

1. **API endpoint tests:**
   - Returns 401 for unauthenticated requests
   - Returns 404 for non-existent business
   - Returns 403 for non-salon business
   - Returns correct data shape for salon business
   - Pagination works correctly
   - Search filter works correctly
   - Status filter works correctly
   - `last_year` period returns only last year data

2. **Component tests:**
   - Business Details hides all 6 sidebar addons for salons
   - Business Details shows all sidebar addons for non-salons
   - Quick View Modal shows correct labels per business type
   - Redirect hooks fire correctly for salon businesses

---

*Document generated from code review on February 17, 2026*
