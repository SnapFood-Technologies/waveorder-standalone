# Professional Services Business Type — Product Requirements Document

**Version:** 1.0
**Date:** February 18, 2026
**Status:** Draft
**Author:** WaveOrder Engineering

---

## 1. Overview

WaveOrder currently supports six business types: Restaurant, Cafe, Retail, Grocery, Salon, and Other. The **Salon** type is the only service-based type, offering appointment booking, service durations, and staff assignment — but it carries salon-specific branding that makes it unsuitable for non-beauty service providers.

This document outlines the addition of a new **SERVICES** business type that reuses the existing salon infrastructure with neutral, professional terminology — enabling developers, consultants, freelancers, agencies, and any service-based business to register on WaveOrder with a proper service storefront.

**Subtitle:** Professional Services
**Category:** Service-Based Business Type

---

## 2. Problem Statement

WaveOrder has no way for professional service providers to register with a service-appropriate storefront. Currently:

- Freelancers, developers, consultants, and agencies must register as "Other" — which gives them a product-based retail storefront with no booking capability
- The existing **Salon** type has the right feature set (services, durations, appointments) but the wrong branding ("The salon has received your appointment")
- There is no clean business type that signals "I offer professional services"

### Business Value

- **Addressable market expansion:** Opens WaveOrder to freelancers, consultants, IT service providers, tutors, coaches, legal advisors, accountants, agencies, and any appointment-based service business
- **Reuse over rebuild:** Leverages the existing salon infrastructure (storefront, dashboard, appointments, staff management) with minimal code changes
- **Platform credibility:** Having a dedicated "Professional Services" type makes WaveOrder feel purpose-built for service providers, not a workaround

---

## 3. Goals and Non-Goals

### Goals

- Service providers can register on WaveOrder and select "Professional Services" as their business type during onboarding
- The storefront displays their services with descriptions, durations, pricing, and an appointment booking flow
- The admin dashboard shows appointment-centric metrics (not order-centric)
- All existing salon infrastructure (appointments, staff assignment, service management) works identically for SERVICES businesses
- No salon-specific branding or terminology appears for SERVICES businesses
- Zero impact on existing Salon, Restaurant, Retail, or other business types

### Non-Goals

- Building a separate storefront component for SERVICES (reuse SalonStoreFront)
- Building a separate dashboard for SERVICES (reuse SalonDashboard)
- Creating new API endpoints or Prisma models
- Adding a dedicated `/services` or `/freelancers` marketing landing page (future consideration)
- Portfolio/case-study pages for service providers (future consideration)
- Proposal/quote generation system (future consideration)

---

## 4. User Stories

### Service Provider (Admin)

1. **As a freelance developer**, I want to register on WaveOrder and select "Professional Services" as my business type, so the platform is set up for my type of business from the start.

2. **As a consultant**, I want to list my services (e.g., "Strategy Session — 60 min — $150") with durations and pricing, so potential clients can see exactly what I offer.

3. **As an IT service provider**, I want clients to book appointments through my storefront via WhatsApp, so I can manage my schedule without back-and-forth messages.

4. **As an agency owner**, I want to assign team members to specific services, so clients are matched with the right person.

5. **As a service provider**, I want my admin dashboard to show appointment metrics (upcoming, completed, cancelled) instead of order/delivery metrics that don't apply to me.

### Client (End User)

6. **As a client**, I want to browse a service provider's offerings with clear descriptions and pricing, so I can decide what to book.

7. **As a client**, I want to book an appointment for a specific service and receive confirmation via WhatsApp, so the process is simple and familiar.

---

## 5. Architecture

### Approach: Extend, Don't Rebuild

The entire salon infrastructure already implements what SERVICES needs:

```
Existing Salon Infrastructure          What SERVICES Reuses
─────────────────────────────          ──────────────────────
SalonStoreFront.tsx           ──────>  Service catalog + booking UI
SalonDashboard.tsx            ──────>  Appointment-centric dashboard
Appointment model             ──────>  Booking system
Product.isService             ──────>  Service listings with duration
Product.staffIds              ──────>  Staff assignment
appointmentBufferMinutes      ──────>  Scheduling logic
/api/v1/appointments          ──────>  Public booking API
/api/admin/.../appointments   ──────>  Admin appointment management
```

The only changes required are:

1. Adding `SERVICES` to the `BusinessType` enum
2. Extending all `=== 'SALON'` checks to include `'SERVICES'`
3. Neutralizing 2 salon-specific fallback strings

### Existing Infrastructure Reused

| Component | File | What It Does |
|---|---|---|
| Service Storefront | `src/components/storefront/SalonStoreFront.tsx` | Service catalog, durations, booking flow |
| Service Dashboard | `src/components/admin/dashboard/SalonDashboard.tsx` | Appointment metrics, upcoming bookings |
| Appointment Model | `prisma/schema.prisma` (Appointment) | Full appointment lifecycle |
| Service Fields | `prisma/schema.prisma` (Product) | `isService`, `serviceDuration`, `staffIds`, `requiresAppointment` |
| Appointment API | `src/app/api/v1/appointments/route.ts` | Public appointment creation |
| Admin Appointments | `src/app/api/admin/stores/[businessId]/appointments/route.ts` | Manage appointments |
| Business Settings | `prisma/schema.prisma` (Business) | `appointmentBufferMinutes`, `allowOnlineBooking`, `showServiceDuration` |

---

## 6. Data Model Changes

### Modified Enum

```prisma
enum BusinessType {
  RESTAURANT
  CAFE
  RETAIL
  GROCERY
  SALON
  SERVICES    // NEW — Professional Services
  OTHER
}
```

No new models, fields, or relations are needed. The existing `Product`, `Appointment`, and `Business` models already support everything SERVICES requires.

---

## 7. Implementation Scope

### Phase 1 — Core Type Addition

**Prisma schema:**
- Add `SERVICES` to `BusinessType` enum
- Run `prisma generate`

**Business type selection UI (6 files):**
- `src/components/setup/steps/BusinessTypeStep.tsx` — onboarding
- `src/components/superadmin/CreateBusinessForm.tsx` — superadmin create
- `src/components/admin/stores/QuickCreateStoreModal.tsx` — admin quick create
- `src/components/admin/settings/BusinessSettingsForm.tsx` — admin settings
- `src/app/superadmin/leads/page.tsx` — leads dropdown

New entry in all lists: `{ value: 'SERVICES', label: 'Professional Services', icon: Briefcase }`

### Phase 2 — Routing and Guards

**Storefront routing:**
- `src/app/(site)/[slug]/page.tsx` — route SERVICES to `SalonStoreFront`

**Dashboard routing:**
- `src/app/admin/stores/[businessId]/dashboard/page.tsx` — route SERVICES to `SalonDashboard`

**Appointment API guards:**
- `src/app/api/v1/appointments/route.ts` — allow SERVICES type
- `src/app/api/admin/stores/[businessId]/appointments/route.ts` — allow SERVICES type

**Setup flow:**
- `src/components/setup/steps/DeliveryMethodsStep.tsx` — add SERVICES config (appointments, no delivery/pickup)

### Phase 3 — Text Generalization and Conditional Updates

**SalonStoreFront fallback strings (2 changes):**
- "The salon has received your appointment" -> "Your appointment request has been received"
- "The salon will confirm your appointment" -> "Your appointment will be confirmed shortly"

**Superadmin business page:**
- `src/app/superadmin/businesses/[businessId]/page.tsx` — introduce `isServiceBusiness` helper to replace all `businessType === 'SALON'` checks (~15+ conditionals)

**Global SALON check sweep:**
- Search all `=== 'SALON'` references across the codebase
- Update each to include `|| === 'SERVICES'` where applicable
- Covers: storefront API routes, admin sidebar routing, order processing, WhatsApp notification templates

---

## 8. Use Cases by Industry

The SERVICES type is intentionally generic. Example businesses that would use it:

| Industry | Example Services |
|---|---|
| Software Development | UI development, IT consulting, iOS app development, ready-made projects |
| Business Consulting | Strategy sessions, financial advisory, market analysis |
| Education and Tutoring | Private lessons, exam prep, language tutoring |
| Legal Services | Consultations, document review, contract drafting |
| Accounting | Tax preparation, bookkeeping sessions, financial planning |
| Marketing and Design | Brand strategy, logo design, social media management |
| Health and Wellness | Personal training, nutrition coaching, therapy sessions |
| Photography | Portrait sessions, event coverage, editing services |
| Home Services | Plumbing, electrical, cleaning, handyman |
| Coaching | Life coaching, career coaching, executive coaching |

---

## 9. Plan Gating

The SERVICES business type follows the same plan gating as all other business types:

| Feature | Starter | Pro | Business |
|---|---|---|---|
| Service storefront | Yes | Yes | Yes |
| Appointment booking | Yes | Yes | Yes |
| Staff assignment | Yes | Yes | Yes |
| Service management | Yes | Yes | Yes |
| Custom domain | No | Yes | Yes |
| Advanced analytics | No | Yes | Yes |

No special plan restrictions for SERVICES. It behaves identically to SALON in terms of feature access.

---

## 10. Risks and Mitigations

| Risk | Impact | Mitigation |
|---|---|---|
| Missed `=== 'SALON'` checks causing SERVICES to behave like retail | Medium | Comprehensive codebase search for all SALON references; manual QA of full registration-to-booking flow |
| SalonStoreFront has more hidden salon-specific text | Low | Only 2 fallback strings found; translations system handles custom text per business |
| Existing SALON businesses affected by text changes | Low | Changes are only to fallback strings; businesses with custom translations are unaffected |
| Confusion between SALON and SERVICES in superadmin | Low | Clear labeling: "Salon & Beauty" vs "Professional Services" in all type selectors |

---

## 11. What Does NOT Change

- No new storefront component (reuses SalonStoreFront)
- No new dashboard component (reuses SalonDashboard)
- No new API endpoints (reuses appointment system)
- No new Prisma models or fields
- Existing Salon businesses are completely unaffected
- Existing Restaurant, Cafe, Retail, Grocery, Other businesses are completely unaffected
- No changes to billing, subscription, or plan logic

---

## 12. Future Considerations

These are explicitly out of scope but could be added later:

- **`/services` marketing landing page** — dedicated page promoting WaveOrder for professional service providers (similar to `/salons`, `/restaurants`, `/retail`)
- **Portfolio / Case Studies section** — allow service providers to showcase past work
- **Proposal / Quote generation** — send custom quotes to clients via WhatsApp
- **Retainer / Subscription services** — recurring service bookings
- **Digital product delivery** — for selling ready-made projects, templates, or code
