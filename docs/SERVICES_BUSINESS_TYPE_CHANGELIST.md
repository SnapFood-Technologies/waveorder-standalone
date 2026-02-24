# SERVICES Business Type — Full Change List

**Scope:** Add **SERVICES** as a separate business type (similar to Salon) with a **complete** service-request system. Reuse salon-style storefront and dashboard; copy Salon storefront to a dedicated **ServicesStoreFront** with admin toggles: **Request appointment** (book like Salon), **Request by email**, **Request by WhatsApp**. For email/WhatsApp we do **not** use simple links — the customer submits a **form** with full data (requester type: person/company, name, company name, email, phone, services of interest, message, preferred contact). Every request is **stored** in WaveOrder. Admin has a **Service requests** list and **detail** view with status and payment for all request types. No half-measures: full data capture, full tracking.

**0 issues, 0 breaking changes:** SALON and all existing business types, storefronts, and APIs behave exactly as today. SERVICES is additive only: new enum value, new storefront component, new optional Business fields used only when `businessType === 'SERVICES'`. No changes to SalonStoreFront, no changes to existing Business fields for existing types. Defaults for new SERVICES businesses must match Salon-like behaviour (e.g. appointment booking on by default) so the store is never broken.

**Out of scope:** No changes to marketing copy on the website; no new marketing page. Services businesses can still register and be created via onboarding and admin flows.

**Salon:** Keep as is (no rename).

**Billing:** All billing plans (Starter, Pro, Business) and limits are the **same as Salon** for SERVICES. No separate pricing or plan rules; SERVICES is treated like SALON for subscriptions and feature gating.

**Complete solution, no link-only:** For “Request by email” and “Request by WhatsApp” we **do not** use mailto or WhatsApp links that leave the site. The customer always submits a **form** with full data (requester type: person/company, name, company, email, phone, services, message, preferred contact). Every request is **stored** in the database. Admin has a **Service requests** list and **detail** view with **status** and **payment** for every request. Requester type (person vs company) is stored and shown everywhere.

---

## 1. Schema & enum

| # | Item | File | Change |
|---|------|------|--------|
| 1.1 | Add SERVICES to enum | `prisma/schema.prisma` | Add `SERVICES` to `enum BusinessType` (after SALON). Run `prisma generate`. |
| 1.2 | SERVICES response options (optional fields) | `prisma/schema.prisma` | On `Business`, add optional booleans **only for SERVICES**: `serviceAllowAppointmentBooking Boolean? @default(true)`, `serviceAllowRequestByEmail Boolean? @default(false)`, `serviceAllowRequestByWhatsApp Boolean? @default(false)`. Nullable; defaults: appointment on, others off. Run migration. |
| 1.3 | **ServiceRequest model (form submissions)** | `prisma/schema.prisma` | New model **ServiceRequest** (or ServiceInquiry) for SERVICES form-based requests (email/WhatsApp). Fields: `id`, `businessId`, `requestType` (EMAIL_REQUEST \| WHATSAPP_REQUEST = preferred contact), `requesterType` (PERSON \| COMPANY), `contactName`, `companyName` (nullable), `email`, `phone`, `serviceIds` (JSON array of product IDs or null), `message`, `status` (e.g. NEW, CONTACTED, QUOTED, CONFIRMED, COMPLETED, CANCELLED), `paymentStatus` (optional), `paymentMethod` (optional), `amount` (optional, cents), `adminNotes` (optional), `createdAt`, `updatedAt`. Relation to Business. Indexes: businessId, status, createdAt. **Only used when businessType === SERVICES.** Run migration. |

---

## 2. ONBOARDING (Setup wizard)

| # | Item | File | Change |
|---|------|------|--------|
| 2.1 | Business type option | `src/components/setup/steps/BusinessTypeStep.tsx` | Add to `businessTypes`: `{ value: 'SERVICES', label: 'Professional Services', icon: Briefcase }`. |
| 2.2 | Delivery/setup step | `src/components/setup/steps/DeliveryMethodsStep.tsx` | Treat SERVICES like SALON: appointments, no delivery/pickup. Extend `isSalon` to `data.businessType === 'SALON' \|\| data.businessType === 'SERVICES'` (or introduce `isServiceBusiness`). |
| 2.3 | Save progress defaults | `src/app/api/setup/save-progress/route.ts` | When creating/updating business, treat SERVICES like SALON: `deliveryEnabled: businessType === 'SALON' \|\| businessType === 'SERVICES' ? false : true`, `dineInEnabled` true for both; handle services/products and store creation for SERVICES same as SALON. |

---

## 3. SUPERADMIN — Create business

| # | Item | File | Change |
|---|------|------|--------|
| 3.1 | Create business form – type option | `src/components/superadmin/CreateBusinessForm.tsx` | Add SERVICES to business type list: `{ value: 'SERVICES', label: 'Professional Services', icon: Briefcase }`. |
| 3.2 | Create business form – SALON conditionals | `src/components/superadmin/CreateBusinessForm.tsx` | Wherever `formData.businessType === 'SALON'` is used (services count, appointment settings, delivery grid), extend to `=== 'SALON' \|\| === 'SERVICES'` so SERVICES gets same UI as SALON. |
| 3.3 | Superadmin API – create business defaults | `src/app/api/superadmin/businesses/route.ts` | In `getDefaults(businessType)`, add `case 'SERVICES':` same as SALON (N/A delivery/pickup). When creating business, set `deliveryEnabled`/`dineInEnabled` for SERVICES same as SALON. |
| 3.4 | Superadmin leads – type dropdown | `src/app/superadmin/leads/page.tsx` | Add `<option value="SERVICES">Professional Services</option>` to Business Type select. |

---

## 4. MULTI-STORE ADMIN — Add business (Quick create)

| # | Item | File | Change |
|---|------|------|--------|
| 4.1 | Quick create modal – type option | `src/components/admin/stores/QuickCreateStoreModal.tsx` | Add SERVICES to business type list (same label/icon as elsewhere). |
| 4.2 | Quick create modal – SALON conditionals | `src/components/admin/stores/QuickCreateStoreModal.tsx` | Extend all `formData.businessType === 'SALON'` checks to include `'SERVICES'` (appointment settings, copy, etc.). |

---

## 5. ADMIN CHANGES (Dashboard, sidebar, settings, lists)

**Helper:** Introduce `isServiceBusiness(businessType) => businessType === 'SALON' \|\| businessType === 'SERVICES'` where it reduces duplication (e.g. superadmin business page). Elsewhere, extend `=== 'SALON'` to `=== 'SALON' \|\| === 'SERVICES'`.

| # | Item | File | Change |
|---|------|------|--------|
| 5.1 | Dashboard routing | `src/app/admin/stores/[businessId]/dashboard/page.tsx` | If `businessType === 'SERVICES'`, render `SalonDashboard` (or later a ServicesDashboard). |
| 5.2 | Billing panel | `src/components/admin/billing/BillingPanel.tsx` | Extend `isSalon` to include SERVICES if plan/limits differ for services; else include so terminology stays “services”. |
| 5.3 | Business settings form | `src/components/admin/settings/BusinessSettingsForm.tsx` | All `settings.businessType === 'SALON'` → include SERVICES (appointment/order wording, placeholders, store closure copy). |
| 5.4 | Business configuration | `src/components/admin/settings/BusinessConfiguration.tsx` | Sections and labels: extend SALON checks to SERVICES (appointment number format, descriptions). |
| 5.5 | Scheduling configuration | `src/components/admin/settings/SchedulingConfiguration.tsx` | `isSalon` → include SERVICES. |
| 5.6 | Order/notification settings | `src/components/admin/settings/OrderNotificationSettings.tsx` | All `business.businessType === 'SALON'` → include SERVICES (appointment vs order copy, routes, toggles). |
| 5.7 | Team member card | `src/components/admin/team/TeamMemberCard.tsx` | “Appointments and services” / “Orders and products” → include SERVICES with SALON. |
| 5.8 | Store comparison | `src/components/admin/stores/StoreComparison.tsx` | Where SALON is filtered or labeled, include SERVICES (e.g. “Salon” filter or separate “Services” filter; grid/columns if needed). |
| 5.9 | Categories management | `src/components/admin/categories/CategoriesManagement.tsx` | Placeholders and labels (“Services” vs “Products”) → include SERVICES. |
| 5.10 | Discounts list | `src/components/admin/discounts/DiscountsList.tsx` | “services” vs “products” copy and links → include SERVICES. |
| 5.11 | Customers list & details | `src/components/admin/customers/CustomersList.tsx`, `CustomerDetails.tsx` | `isSalon` / appointment vs order → include SERVICES. |
| 5.12 | Dashboard widgets | `RecentCustomersWidget.tsx`, `QuickActionsWidget.tsx` | `isSalon` → include SERVICES. |
| 5.13 | Store appearance / preview | `src/components/admin/appearance/StoreAppearance.tsx`, `StorePreview.tsx` | “Booking” vs “Cart” and badge labels → include SERVICES. |
| 5.14 | Help center & FAQ | `src/components/admin/help/HelpCenter.tsx`, `FAQSection.tsx` | `isSalon` → include SERVICES. |
| 5.15 | API key management | `src/components/admin/api/ApiKeyManagement.tsx` | `isSalon` → include SERVICES if docs/copy reference services. |
| 5.16 | Analytics | `Analytics.tsx`, `AdvancedAnalytics.tsx`, `CampaignAnalytics.tsx`, `ProductSharesAnalytics.tsx` | “Appointments” vs “Orders”, “Services” vs “Products” → include SERVICES. |
| 5.17 | Admin appointments API | `src/app/api/admin/stores/[businessId]/appointments/route.ts` | Allow `businessType === 'SERVICES'` (change `!== 'SALON'` to reject to `!== 'SALON' && !== 'SERVICES'` or use helper). |
| 5.18 | Admin services API | `src/app/api/admin/stores/[businessId]/services/route.ts` | Allow SERVICES same as SALON. |
| 5.19 | Admin staff availability API | `src/app/api/admin/stores/[businessId]/staff/availability/route.ts` | Allow SERVICES. |
| 5.20 | Admin metrics API | `src/app/api/admin/stores/[businessId]/metrics/route.ts` | `isSalon` → include SERVICES. |
| 5.21 | Admin discounts API | `src/app/api/admin/stores/[businessId]/discounts/route.ts` | `isSalon` → include SERVICES. |
| 5.22 | Admin customers/orders API | `src/app/api/admin/stores/[businessId]/customers/[customerId]/orders/route.ts` | `isSalon` → include SERVICES. |
| 5.23 | Admin analytics services API | `src/app/api/admin/stores/[businessId]/analytics/services/route.ts` | Allow SERVICES. |
| 5.24 | **Admin sidebar** | `src/components/admin/layout/AdminSidebar.tsx` | Extend `isSalon` to include SERVICES. For **SERVICES only**, add a **Service requests** (or **Requests**) menu item: list + detail for all requests (appointments from existing Appointments; form submissions from ServiceRequest). Same other items as SALON (Dashboard, Appointments, Services, Customers, etc.). See **Admin sidebar for SERVICES** below. |
| 5.25 | **SERVICES response options (admin toggles)** | New or existing settings section | **Only when `businessType === 'SERVICES'`:** add a “Service request options” (or similar) block with three toggles: (1) **Allow appointment booking** — yes/no, (2) **Allow request by email** — yes/no, (3) **Allow request by WhatsApp** — yes/no. Persist to the new Business fields. At least one must be on (validation). Defaults: appointment on, others off. Do not show this block for SALON or other types (0 breaking changes). |
| 5.26 | Business settings API | `src/app/api/admin/stores/[businessId]/settings/business/route.ts` (or appearance/settings route that saves Business) | Accept and save the three SERVICES-only booleans when business is SERVICES; ignore when not SERVICES. |
| 5.27 | Storefront API returns SERVICES flags | `src/app/api/storefront/[slug]/route.ts` | When `businessType === 'SERVICES'`, include the three allow-* flags so ServicesStoreFront can show/hide Book appointment / Request by email / Request by WhatsApp. |
| 5.28 | **Service requests list (admin)** | New: `src/app/admin/stores/[businessId]/service-requests/page.tsx` + API `src/app/api/admin/stores/[businessId]/service-requests/route.ts` | **SERVICES only.** List all service requests: (1) Appointments (from existing Appointment, link to appointment detail), (2) Form submissions (from ServiceRequest). Table or cards: requester type, name/company, contact, services, message snippet, status, payment, date. Filter by type (appointment vs email vs whatsapp), status. GET API with pagination. |
| 5.29 | **Service request detail (admin)** | New: `src/app/admin/stores/[businessId]/service-requests/[requestId]/page.tsx` + API `src/app/api/admin/stores/[businessId]/service-requests/[requestId]/route.ts` | **SERVICES only.** For **ServiceRequest** (form submission): detail view with all stored data (requester type, name, company, email, phone, services, message, preferred contact). Editable: **status**, **payment** (paymentStatus, paymentMethod, amount), **admin notes**. GET + PATCH. For appointment-based requests, redirect or embed link to existing appointment detail. |

---

## 6. WEB CHANGES (Storefront routing + Services storefront)

| # | Item | File | Change |
|---|------|------|--------|
| 6.1 | Storefront routing | `src/app/(site)/[slug]/page.tsx` | For `storeData.businessType === 'SERVICES'`, render **ServicesStoreFront** (new component). For SALON, keep **SalonStoreFront** unchanged. |
| 6.2 | Create Services storefront | New file | Copy `SalonStoreFront.tsx` → `ServicesStoreFront.tsx`. **Book appointment:** if enabled, same flow as Salon. **Request by email / Request by WhatsApp:** never link-only. Show a **form** that collects: **Requester type** (Person \| Company), **Name**, **Company name** (if Company), **Email**, **Phone**, **Service(s) of interest** (select from business services or free text), **Message**, **Preferred contact** (Email \| WhatsApp). On submit → POST to new API (e.g. `/api/storefront/[slug]/service-request`), create **ServiceRequest** with all data, return success; show “We’ve received your request and will contact you by email/WhatsApp.” Only show options that are enabled. Do not modify SalonStoreFront. |
| 6.3 | Storefront data API | `src/app/api/storefront/[slug]/route.ts` | Ensure SERVICES is returned; for SERVICES include the three allow-* flags (see 5.27). SALON and other types unchanged. |
| 6.4 | **SEO (storefront) — match Salon** | `src/app/(site)/[slug]/page.tsx` | Add **SERVICES** to `getBusinessTypeDefaults()` (same structure as SALON, per language): titleSuffix, description, keywords. Use neutral professional-services wording. Meta title, description, Open Graph, canonical, JSON-LD all use these for SERVICES. See **SEO on storefront** below. |
| 6.5 | Order/booking flow (storefront) | `src/app/api/storefront/[slug]/order/route.ts` | Where `business.businessType === 'SALON'` is used, add `\|\| business.businessType === 'SERVICES'` so SERVICES uses same appointment/booking path when customer books an appointment. |
| 6.6 | **Service request form API** | New: `src/app/api/storefront/[slug]/service-request/route.ts` | POST: accept body with requesterType (PERSON \| COMPANY), contactName, companyName?, email, phone, serviceIds?, message, preferredContact (EMAIL \| WHATSAPP). Validate business is SERVICES and slug; create **ServiceRequest** with status NEW. Return 201. No link-only: every submission is stored. |

---

### Admin sidebar for SERVICES (what we show)

SERVICES uses the **same sidebar as SALON**. No Orders, no Products, no Inventory.

| Menu item | When shown | Notes |
|-----------|------------|--------|
| Dashboard | Always | Appointment-centric (SalonDashboard). |
| **Appointments** | Always | Replaces Orders. Children: All Appointments; Calendar View (PRO+). |
| **Service requests** | **SERVICES only** | New. List + detail for all requests (appointments + form submissions). See 5.28, 5.29. |
| **Services** | Always | Replaces Products. Children: List (`/services`), Categories (`/service-categories`). |
| Customers | Always | |
| Appearance | Always | |
| Marketing | Always | |
| Help & Support | Always (unless impersonating) | Help Center, Support Tickets, Messages. |
| Discounts | PRO / BUSINESS | |
| Analytics | PRO / BUSINESS | |
| Team Management | BUSINESS | |
| **Staff Availability** | BUSINESS | Same as Salon. |
| Custom Domain | BUSINESS | |
| API Access | BUSINESS | |

**Not shown for SERVICES:** Orders, Products, Product Categories, Brands, Collections, Groups, Import, Inventory (Dashboard, Activities, Stock Adjustment).

---

### SEO on storefront (SERVICES = same treatment as Salon)

- **Meta title / description / keywords:** SERVICES gets its own defaults in `getBusinessTypeDefaults()` (e.g. "Book Service Online", "Book professional services online") — same structure and languages as SALON, neutral wording.
- **Open Graph, canonical, JSON-LD:** Same logic as today; when `businessType === 'SERVICES'` use the SERVICES defaults so all SEO tags and structured data are correct. No change to SALON or other types.

---

## 7. SUPERADMIN PAGES & APIs (business detail, lists, operations)

| # | Item | File | Change |
|---|------|------|--------|
| 7.1 | Business detail page | `src/app/superadmin/businesses/[businessId]/page.tsx` | Replace or extend every `business.businessType === 'SALON'` with `\|\| === 'SERVICES'` (orders vs appointments, products vs services, links, stats, copy, Twilio, affiliates, sync). Consider `isServiceBusiness(business)` helper. |
| 7.2 | Superadmin business API (stats) | `src/app/api/superadmin/businesses/[businessId]/route.ts` | Where `businessType === 'SALON'` drives stats (e.g. services vs products, appointments), include SERVICES. |
| 7.3 | Superadmin orders redirect | `src/app/superadmin/businesses/[businessId]/orders/page.tsx` | If SERVICES, redirect or show appointments context same as SALON. |
| 7.4 | Superadmin vendors/orders | `src/app/superadmin/businesses/[businessId]/vendors/[vendorId]/orders/page.tsx` | If business is SERVICES, same as SALON. |
| 7.5 | Superadmin appointments stats | `src/app/api/superadmin/businesses/[businessId]/appointments/stats/route.ts` | Allow `businessType === 'SERVICES'` (change guard from `!== 'SALON'` to allow both SALON and SERVICES). |
| 7.6 | Superadmin operations – orders | `src/app/api/superadmin/operations/orders/route.ts` | Exclude SERVICES from orders list same as SALON (or add filter for SERVICES to separate bookings). |
| 7.7 | Superadmin operations – bookings | `src/app/api/superadmin/operations/bookings/route.ts` | Include SERVICES in bookings: filter `businessType: { in: ['SALON', 'SERVICES'] }` (or equivalent). |
| 7.8 | Superadmin users detail | `src/components/superadmin/SuperAdminUserDetails.tsx` | “appointments”/“services” vs “orders”/“products” → include SERVICES. |
| 7.9 | Superadmin dashboard | `src/components/superadmin/SuperAdminDashboard.tsx` | Copy that references SALON → include SERVICES. |
| 7.10 | Superadmin businesses list | `src/components/superadmin/SuperAdminBusinesses.tsx` | Appointments link, “Services”/“Products” column, filters → include SERVICES. |
| 7.11 | Superadmin debug | `src/app/superadmin/system/debug/page.tsx` | Where SALON is selected or hidden, add SERVICES where appropriate. |
| 7.12 | Superadmin analytics | `src/app/api/superadmin/analytics/route.ts` | If any SALON-specific logic, include SERVICES. |
| 7.13 | Superadmin users API | `src/app/api/superadmin/users/[userId]/route.ts` | `salonBusinesses` / `nonSalonBusinesses` → consider “service businesses” (SALON + SERVICES) vs rest. |

---

## 8. OTHER API ROUTES & LIBS

| # | Item | File | Change |
|---|------|------|--------|
| 8.1 | V1 appointments | `src/app/api/v1/appointments/route.ts`, `[appointmentId]/route.ts` | Allow SERVICES: change `!== 'SALON'` to `!== 'SALON' && !== 'SERVICES'` (or use helper). |
| 8.2 | V1 services | `src/app/api/v1/services/route.ts`, `[serviceId]/route.ts` | Allow SERVICES: allow when `businessType === 'SALON' \|\| businessType === 'SERVICES'`. |
| 8.3 | V1 products | `src/app/api/v1/products/route.ts`, `[productId]/route.ts` | Products not for SERVICES: keep redirect to /services for SERVICES (extend SALON check to SERVICES). |
| 8.4 | V1 orders | `src/app/api/v1/orders/route.ts`, `[orderId]/route.ts` | Orders not for SERVICES: same as SALON (extend to SERVICES). |
| 8.5 | User create store | `src/app/api/user/create-store/route.ts` | Defaults for SERVICES same as SALON (`deliveryEnabled`, `dineInEnabled`). |
| 8.6 | Order notification service | `src/lib/orderNotificationService.ts` | `isSalon` → include SERVICES for appointment vs order messaging. |
| 8.7 | Customer email notification | `src/lib/customer-email-notification.ts` | SALON-specific copy → include SERVICES. |
| 8.8 | Compare-stores API | `src/app/api/admin/analytics/compare-stores/route.ts` | `isSalon` → include SERVICES. |

---

## 9. NOT IN SCOPE (confirm no work)

- **Marketing / web copy:** No changes to homepage or other marketing copy for “Services”.
- **New marketing page:** No `/services` or similar landing page. Services can still register and be created via onboarding and admin.
- **Renaming Salon:** Keep “Salon” (or “Salon & Beauty” where it already exists); no change to Salon label.

---

## 10. SERVICES-SPECIFIC BEHAVIOUR (built in full — admin toggles + storefront + stored requests)

- **Admin:** For SERVICES only, settings with three toggles: **Allow appointment booking**, **Allow request by email**, **Allow request by WhatsApp**. At least one on. Stored on Business.
- **Storefront:** ServicesStoreFront shows only enabled options. **Book appointment** = same flow as Salon. **Request by email** and **Request by WhatsApp** = **always a form** (never a bare mailto/WhatsApp link). Form collects: **Requester type** (Person \| Company), **Name**, **Company name** (if Company), **Email**, **Phone**, **Service(s) of interest**, **Message**, **Preferred contact** (Email \| WhatsApp). Submit → stored as **ServiceRequest** in DB. Success message: we’ll contact you by email/WhatsApp.
- **Defaults:** Appointment on, email/WhatsApp off. No breaking changes to SALON.

---

## 11. Service request details: status and payment (complete solution)

### Appointment-based requests (Book appointment)

- **Status:** **Appointment** (`Appointment.status`: REQUESTED, CONFIRMED, IN_PROGRESS, COMPLETED, CANCELLED, NO_SHOW). Admin: appointment detail page.
- **Payment:** **Order** linked to appointment (`Order.paymentStatus`, `Order.paymentMethod`). Shown on appointment detail.
- **Service request details:** Existing appointment detail page (and order). No new UI.

### Form-based requests (Request by email / Request by WhatsApp)

**We do not use link-only.** Every such request is a **form submission** stored in WaveOrder.

- **Stored record:** **ServiceRequest** (see schema 1.3). Includes: **requester type** (PERSON | COMPANY), contact name, company name (if company), email, phone, service(s) of interest, message, preferred contact (EMAIL | WHATSAPP), **status**, **payment** (paymentStatus, paymentMethod, amount), admin notes.
- **Status:** Admin can set and update (e.g. NEW, CONTACTED, QUOTED, CONFIRMED, COMPLETED, CANCELLED).
- **Payment:** Admin can record payment status, method, and amount on the request detail page.
- **Service request details:** Admin **Service requests** list (5.28) and **detail** page (5.29) for each form submission. Full data, status, and payment visible and editable. One place for all request types (appointments linked to existing appointment detail; form submissions open ServiceRequest detail).

---

## Summary counts (approximate)

| Area | Files to touch |
|------|-----------------|
| Schema | 3 (enum + Business flags + **ServiceRequest** model) |
| Onboarding | 3 |
| Superadmin create + leads | 4 |
| Multi-store admin | 2 |
| Admin (dashboard, settings, **Service requests** list + detail, sidebar, APIs) | ~30 |
| Web (storefront, **service-request form + API**) | 5 |
| Superadmin pages & APIs | ~13 |
| Other APIs & libs | ~8 |
| **Total** | **~68** |

Use “SERVICES” and “Professional Services” consistently; use a shared helper (e.g. `isServiceBusiness(businessType)`) where it avoids duplication and mistakes. **Guard all SERVICES-only logic** so SALON and other types are never affected (0 breaking changes).
