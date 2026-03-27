# Test suite (Vitest)

Automated tests run with **Vitest** (`yarn test` / `npm test`). They run in **development and CI** — not as part of the customer-facing app bundle.

## How to run

| Command | What it does |
|--------|----------------|
| `yarn test` | Run **all** tests once |
| `yarn vitest` | Watch mode (re-runs when files change) |
| `yarn vitest run <path> …` | Run specific test file(s) |

**Example — subset (storefront only):**

```bash
yarn vitest run \
  src/__tests__/lib/storefront-order-validation.test.ts \
  src/__tests__/lib/storefront-phone.test.ts \
  src/__tests__/lib/storefront-slug.test.ts \
  src/__tests__/components/StorefrontOrderSubmitButton.test.tsx
```

## Inventory

| Metric | Value |
|--------|------:|
| Test files | 17 |
| Tests (cases) | 69 |

---

## What each test file covers

Plain-language behavior. Use this to map failures (file + test name) to product areas.

### 1. `storefront-order-validation.test.ts` (11 tests)

*Initial tests added: 26 Mar 2026*

**Purpose:** Rules for **whether a customer can submit** a storefront order, and **which problem** to show first.

**Covers:** Temporarily closed store; empty cart; bad phone; pickup OK path; delivery needs address + map pins (non-retail); retail delivery needs country, city, postal/delivery method; minimum order for delivery; invoice AFM + invoice minimum; forced schedule needs a time; “bad phone” can rank before “missing address” for messaging.

**Implementation:** `src/lib/storefront-order-validation.ts`

---

### 2. `storefront-phone.test.ts` (3 tests)

*Initial tests added: 26 Mar 2026*

**Purpose:** **Phone field completeness** for checkout (not full international validation of every country).

**Covers:** Empty rejected; one plausible full Greece-style number accepted; too-short rejected.

**Implementation:** `src/lib/storefront-phone.ts`

---

### 3. `storefront-slug.test.ts` (1 test)

*Initial tests added: 26 Mar 2026*

**Purpose:** Store URLs that differ only by **letter case** still resolve the **same** business in the database.

**Covers:** Slug filter uses case-insensitive matching for Prisma queries.

**Implementation:** `src/lib/storefront-slug.ts`

---

### 4. `StorefrontOrderSubmitButton.test.tsx` (4 tests)

*Initial tests added: 26 Mar 2026*

**Purpose:** The **primary “place order / WhatsApp” control** stays wired correctly (not full page / not all business rules).

**Covers:** Disabled when checkout not allowed; enabled when allowed; click calls submit when enabled; button label and footer hint text render.

**Implementation:** `src/components/storefront/StorefrontOrderSubmitButton.tsx`

---

### 5. `financial-superadmin-notifications.test.ts` (12 tests)

**Purpose:** Helpers for **SuperAdmin financial alerts** (who gets emails, when, and list hygiene).

**Covers:** Email list normalization (trim, lowercase, dedupe, drop invalid); UTC day range for reporting; add days in UTC; **plan tier** comparison (STARTER &lt; PRO &lt; BUSINESS); when to notify on **successful** Stripe payment (skip zero amount; skip first subscription invoice; allow renewals/updates/manual); whether a user **qualifies** for alerts (onboarding with no businesses; all test businesses; all inactive/deactivated; at least one live business).

**Implementation:** `src/lib/financial-superadmin-notification-utils.ts`

---

### 6. `permissions-team.test.ts` (4 tests)

**Purpose:** **Who may edit** another team member’s profile in the business admin.

**Covers:** Owner can edit manager/staff/delivery; cannot edit self; cannot edit another owner; non-owner manager cannot edit others.

**Implementation:** `src/lib/permissions.ts` (`canEditMemberProfile`)

---

### 7. `subscription-period.test.ts` (2 tests)

**Purpose:** **Billing period** boundaries for subscriptions (Stripe-shaped data).

**Covers:** Uses subscription `current_period_start` / `current_period_end`; fallback when `current_period_end` is missing on subscription but present on line item.

**Implementation:** `src/lib/subscription-period.ts`

---

### 8. `whatsapp-campaign-sender.test.ts` (2 tests)

**Purpose:** Rough **cost estimate** for WhatsApp broadcast campaigns.

**Covers:** Zero recipients → zero cost; cost scales with recipient count.

**Implementation:** `src/lib/whatsapp-campaign-sender.ts`

---

### 9. `whatsapp-flow-canvas-converter.test.ts` (4 tests)

**Purpose:** **Visual flow** (canvas nodes) ↔ **saved flow steps** conversion for WaveOrder Flows.

**Covers:** Default trigger when canvas has no trigger node; trigger + message become steps; delay node clamps; round-trip trigger + steps to canvas nodes/edges.

**Implementation:** `src/lib/whatsapp-flow-canvas-converter.ts`

---

### 10. `whatsapp-flow-engine.test.ts` (3 tests)

**Purpose:** **Inside business hours** check used by automation.

**Covers:** No hours configured → treated as always open; empty business days → never open; valid weekday config returns a boolean.

**Implementation:** `src/lib/whatsapp-flow-engine.ts`

---

### 11. `whatsapp-flow-templates.test.ts` (2 tests)

**Purpose:** **Pre-built flow templates** (welcome, away, keyword flows) per business type.

**Covers:** Templates include **store URL** and **business name** where expected; **FAQ-style keyword** template exists for **restaurant** (business type matters — default “OTHER” uses different template ids).

**Implementation:** `src/lib/whatsapp-flow-templates.ts`

---

### 12. `whatsapp-utils.test.ts` (4 tests)

**Purpose:** **Normalize phone numbers** for WhatsApp/Twilio plumbing.

**Covers:** Strip `whatsapp:` prefix; keep digits and `+`; strip spaces/punctuation; add leading `+` when missing.

**Implementation:** `src/lib/whatsapp-utils.ts`

---

### 13. `TriggerNode.test.tsx` (2 tests)

**Purpose:** **Flow builder** trigger node shows the right labels.

**Covers:** “First message” trigger; keyword trigger with keywords list.

**Implementation:** `src/components/admin/whatsapp-flows/flow-nodes/TriggerNode.tsx`

---

### 14. `api/webhooks/twilio/incoming.test.ts` (2 tests)

**Purpose:** **Twilio inbound webhook** rejects bad requests early.

**Covers:** Missing `From` → rejected; missing `To` → rejected.

**Implementation:** `src/app/api/webhooks/twilio/incoming/route.ts`

---

### 15. `website-embed-url.test.ts` (7 tests)

*Added: 27 Mar 2026*

**Purpose:** **Website embed** storefront URLs: fingerprint query param and optional UTM tags; public site base URL for snippets.

**Covers:** `embed_waveorder=1` and slug path; trailing slash on base URL; `utm_source` / `utm_medium` / `utm_campaign` when set; blank UTM fields omitted; slug encoding; default base URL when `NEXT_PUBLIC_BASE_URL` unset; trailing slash stripped from env.

**Implementation:** `src/lib/website-embed-url.ts`

---

### 16. `whatsapp-mix-followup.test.ts` (3 tests)

*Added: 27 Mar 2026*

**Purpose:** **WhatsApp mix** follow-up message for customers after checkout: template placeholders and `wa.me` URL with encoded text.

**Covers:** Default template + `{orderNumber}` / `{businessName}` / `{orderId}` substitution; custom template string; `buildCustomerFollowUpWhatsappUrl` produces `https://wa.me/...` with encoded message (uses `whatsapp-wa-me-url`).

**Implementation:** `src/lib/whatsapp-mix-followup.ts` (and `src/lib/whatsapp-wa-me-url.ts` for number formatting / URL).

---

### 17. `website-embed-settings.test.ts` (3 tests)

*Added: 27 Mar 2026*

**Purpose:** **Marketing → Embedded** saved configuration: merge stored JSON with defaults and ignore invalid values.

**Covers:** Null stored → defaults; partial merge; invalid `size` falls back to default.

**Implementation:** `src/lib/website-embed-settings.ts`

---

## Product area map

| Area | Test files |
|------|------------|
| Public storefront | 1–4 |
| SuperAdmin / billing helpers | 5, 7 |
| Business admin / team | 6 |
| WaveOrder Flows (WhatsApp + canvas) | 8–13 |
| Twilio inbound webhook | 14 |
| Marketing / website embed | 15, 17 |
| WhatsApp mix (order follow-up) | 16 |

---

## Reading test output

1. **Twilio tests** may log `[Twilio webhook] Missing From or To` on **stderr** — that is **expected** (error-path tests).  
2. **Vite “CJS deprecated”** is a **toolchain warning**, not a failed test.  
3. Failures show **file path** and **test title** — match them to the sections above.

---

## Test file → source module (quick reference)

| Test file | Primary implementation |
|-----------|-------------------------|
| `storefront-order-validation.test.ts` | `src/lib/storefront-order-validation.ts` |
| `storefront-phone.test.ts` | `src/lib/storefront-phone.ts` |
| `storefront-slug.test.ts` | `src/lib/storefront-slug.ts` |
| `StorefrontOrderSubmitButton.test.tsx` | `src/components/storefront/StorefrontOrderSubmitButton.tsx` |
| `financial-superadmin-notifications.test.ts` | `src/lib/financial-superadmin-notification-utils.ts` |
| `permissions-team.test.ts` | `src/lib/permissions.ts` |
| `subscription-period.test.ts` | `src/lib/subscription-period.ts` |
| `whatsapp-campaign-sender.test.ts` | `src/lib/whatsapp-campaign-sender.ts` |
| `whatsapp-flow-canvas-converter.test.ts` | `src/lib/whatsapp-flow-canvas-converter.ts` |
| `whatsapp-flow-engine.test.ts` | `src/lib/whatsapp-flow-engine.ts` |
| `whatsapp-flow-templates.test.ts` | `src/lib/whatsapp-flow-templates.ts` |
| `whatsapp-utils.test.ts` | `src/lib/whatsapp-utils.ts` |
| `TriggerNode.test.tsx` | `src/components/admin/whatsapp-flows/flow-nodes/TriggerNode.tsx` |
| `twilio/incoming.test.ts` | `src/app/api/webhooks/twilio/incoming/route.ts` |
| `website-embed-url.test.ts` | `src/lib/website-embed-url.ts` |
| `website-embed-settings.test.ts` | `src/lib/website-embed-settings.ts` |
| `whatsapp-mix-followup.test.ts` | `src/lib/whatsapp-mix-followup.ts` |

---

*Regenerate counts after adding tests: `yarn test` and update the **Inventory** table if file/test counts change.*
