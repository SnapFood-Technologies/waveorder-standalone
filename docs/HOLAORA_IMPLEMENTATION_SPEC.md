# HolaOra — WaveOrder implementation spec (from product decisions)

**Status:** WaveOrder-side wiring is in place: **Stripe entitlement sync** (webhook), **provisioning stubs** (`HOLAORA_PROVISIONING_STUB`), **business admin** (Settings → HolaOra), **SuperAdmin force-off** + **AI/Hola mutex**, **storefront embed shell** (`HolaOraEmbed` + `NEXT_PUBLIC_HOLAORA_EMBED_SCRIPT_URL`). Still **deferred:** real provisioning HTTP client and final embed snippet contract from HolaOra.

**Purpose:** One place for **concrete repo changes** agreed for the integration module + HolaOra. Partner HTTP and embed details remain **deferred** until HolaOra documents them.

---

## 1. Decisions (fixed)

| Topic | Decision |
|--------|-----------|
| Kill-switch env var (e.g. `HOLAORA_INTEGRATION_ENABLED`) | **Not used.** Shipping is controlled by merge/deploy when you choose. |
| Platform partner model | **One `Integration` row** for HolaOra (e.g. slug `holaora`). Improve existing **Integrations** feature; no parallel “Hola-only” database product. |
| Hola-specific settings | Stored on that row: **`kind`** + validated **`config`** JSON. |
| Hola tenant id on the shop | **`Business.holaoraAccountId`** (nullable). Single source for HolaOra’s id after provisioning. |
| Catalog access for HolaOra | Existing **`/api/v1/*`** with **`wo_live_…`** API key and **scopes** ([`src/lib/api-auth.ts`](../src/lib/api-auth.ts)). No separate unauthenticated catalog API. |
| Secrets (WaveOrder → HolaOra) | **Environment variables / secret manager** — not plain text in `Integration.config` unless you explicitly choose otherwise later. |

---

## 2. Schema changes (`prisma/schema.prisma`)

1. **`Integration`**
   - Add **`kind`**: `String` or Prisma `enum` with at least **`GENERIC`** and **`HOLAORA`** (match project conventions for enums).

2. **`Business`**
   - **`holaoraAccountId String?`** — Hola tenant id after provisioning.
   - **`holaoraEntitled Boolean`** — subscription includes a Stripe price listed in platform Hola `Integration.config.entitlementStripePriceIds` (synced from webhooks).
   - **`holaoraStorefrontEmbedEnabled Boolean`** — merchant toggle (Settings → HolaOra).
   - **`holaoraSetupUrl String?`** — optional setup URL from future provisioning response.
   - **`holaoraSuperAdminForceOff Boolean`** — SuperAdmin hides embed on storefront regardless of merchant toggle.
   - **`holaoraProvisioningStatus` / `holaoraProvisioningError String?`** — last stub or future HTTP outcome.

3. Run your usual **Prisma** workflow (`db push` / migration) for the database.

---

## 3. `Integration.config` shape for `kind === HOLAORA`

Validate on **create/update** (e.g. Zod in a small lib module such as `src/lib/integration-holaora-config.ts` or `integration-config.ts`).

| Key | Type | Purpose |
|-----|------|---------|
| `holaOraBaseUrl` | string (URL) | Base URL WaveOrder **servers** use to call HolaOra **provisioning** when the API exists. |
| `entitlementStripePriceIds` | `string[]` | Stripe **price** IDs meaning “subscription includes HolaOra” — used later by billing/webhook logic. |
| `defaultV1Scopes` | `string[]` | Scopes for catalog reads (must match real ids in `AVAILABLE_SCOPES` / route requirements). |
| `documentedV1Paths` | `string[]` (optional) | Documented `/api/v1/...` paths for HolaOra — for humans/partner docs; enforcement optional later. |
| `rateLimitPerMinute` | number (optional) | Agreed limit with HolaOra; wire into rate limiting when you implement per-partner limits. |
| `setupNotes` | string (optional) | Internal notes on what we persist from HolaOra (field names — not secret values). |

---

## 4. API changes

| File | Change |
|------|--------|
| [`src/app/api/superadmin/integrations/route.ts`](../src/app/api/superadmin/integrations/route.ts) | **POST:** accept **`kind`**; if **`HOLAORA`**, validate **`config`** with the schema above; persist. |
| [`src/app/api/superadmin/integrations/[integrationId]/route.ts`](../src/app/api/superadmin/integrations/[integrationId]/route.ts) | **PUT:** same validation when **`kind`** / **`config`** changes. |
| List/detail GET | Ensure **`kind`** is returned once it exists on the model. |

Optional later: **GET** `/api/superadmin/integrations/holaora` returning the single HOLAORA row + aggregates (only if you want one round-trip for the dedicated screen).

---

## 5. SuperAdmin UI — shared integrations page

**File:** [`src/app/superadmin/integrations/page.tsx`](../src/app/superadmin/integrations/page.tsx)

- Extend types with **`kind`**.
- **Create / edit modals:** **`kind`** selector; when **`HOLAORA`**, show structured fields for `holaOraBaseUrl`, Stripe price IDs (multi), scopes (multi-select from existing scope list), optional rate limit and notes.
- **Detail view:** when **`kind === HOLAORA`**, read-only summary of Hola **`config`**.
- Existing fields unchanged: name, slug, description, logo URL, webhook URL, active, API key flows, logs.

---

## 6. Dedicated HolaOra screen + sidebar (SuperAdmin hub)

| Item | Action |
|------|--------|
| **New route** | `src/app/superadmin/integrations/holaora/page.tsx` — dedicated **HolaOra** SuperAdmin page. |
| **Content** | Load the **`Integration`** with **`kind === HOLAORA`** (or fixed slug `holaora` if you enforce it); show Hola **config**, **connected businesses** (same rules as today: `externalIds[slug]` until you migrate counts to `holaoraAccountId`), shortcuts to **API Logs** / main integrations list. |
| **Sidebar** | [`src/components/superadmin/layout/SuperAdminSidebar.tsx`](../src/components/superadmin/layout/SuperAdminSidebar.tsx) — under **Integrations**, add child **HolaOra** → `/superadmin/integrations/holaora`. |

**Hub behavior (business directory):** paginated list (`GET .../holaora/directory`) scoped like **SuperAdmin → Businesses** default: **active** and **non-test** only; filters **Active** (all such stores), **Hola linked**, **Hola entitled**; search on name/slug. **Manage** modal → `PATCH /api/superadmin/businesses/[id]/holaora-link` (manual `holaoraAccountId`, `holaoraEntitled`, `holaoraEntitlementSource` **STRIPE** vs **MANUAL**, `holaoraProvisionBundleType` **FREE**/**PAID**, `holaoraSuperAdminForceOff`). **MANUAL** entitlement → Stripe webhooks **do not** change that business’s Hola entitlement. **Sync** → `POST .../holaora-sync` with `{ bundleType: FREE | PAID }` (stores tier, logs, runs stub provision if entitled).

Update **`HOLAORA_INTEGRATION.md` §5** when you want the architecture doc to mention this route explicitly.

---

## 7. Stripe + entitlement (implemented)

- **`src/app/api/webhooks/stripe/route.ts`** — after subscription **created**, **updated**, and **deleted**, calls **`syncHolaOraEntitlementForStripeSubscription`** (`src/lib/holaora-entitlement-sync.ts`).
- Logic: load active **`Integration`** with **`kind === HOLAORA`**, parse config; if subscription **`status`** is **`active`** or **`trialing`** and **any** line item **`price.id`** is in **`entitlementStripePriceIds`**, set **`holaoraEntitled`** for businesses linked to subscription users; otherwise clear entitlement and **deprovision** locally.
- **Provisioning stub:** `src/lib/holaora-provisioning.ts`. Set **`HOLAORA_PROVISIONING_STUB=1`** (or `true`) to write **`holaoraAccountId`** as `stub_<businessId>` for dev; otherwise status **`pending_partner_api`** until real HTTP exists.

---

## 8. AI Store Assistant vs HolaOra (product mutex)

- **Not** in HolaOra’s docs — WaveOrder rule: only one of **AI chat** or **Hola embed** should be on.
- **Validation (400):** AI and Hola storefront embed cannot both be on. **`PATCH .../custom-features`**: cannot enable **AI** while **`holaoraStorefrontEmbedEnabled`** is true (message tells admin to turn off Hola embed first). **`PATCH .../holaora-settings`**: cannot enable **Hola embed** while **`aiAssistantEnabled`** is true (message tells admin to disable AI in Custom features). **`PUT .../admin/stores/[id]`**: rejects if the update would leave both true.
- Toggle **HolaOra embed (force off)** (`holaoraSuperAdminForceOff`) still hides embed on the storefront even if the merchant enabled it.
- **Storefront:** `GET /api/storefront/[slug]` exposes **`showHolaOraEmbed`**; components render **`HolaOraEmbed`** when true and **`AiChatBubble`** only when **`aiAssistantEnabled && !showHolaOraEmbed`**.

---

## 9. Storefront embed (shell)

- **`src/components/storefront/HolaOraEmbed.tsx`** — optional script load from **`NEXT_PUBLIC_HOLAORA_EMBED_SCRIPT_URL`**; passes **`data-holaora-account`** / mount id for partner scripts.
- **Env:** `NEXT_PUBLIC_HOLAORA_EMBED_SCRIPT_URL` — public loader URL when HolaOra provides it.

---

## 10. Deferred (after HolaOra delivers API/docs)

- Provisioning **HTTP client** to **`holaOraBaseUrl`** (request/response per their contract).
- **Deprovisioning** HTTP when bundle ends (if required by partner).
- Optional: **auto-issue** business API keys with **`defaultV1Scopes`** when a business is entitled to HolaOra.

---

## 11. File checklist (summary)

| Action | Path / area |
|--------|----------------|
| Edit | `prisma/schema.prisma` — `Integration.kind`, `Business` Hola fields |
| Add | `src/lib/holaora-ai-mutex-messages.ts`, `holaora-provisioning.ts`, `holaora-entitlement-sync.ts` |
| Edit | `src/app/api/webhooks/stripe/route.ts` — Hola sync |
| Add | `src/app/api/admin/stores/[businessId]/holaora-settings/route.ts` |
| Add | `src/components/admin/settings/HolaOraSettings.tsx`, `src/app/admin/.../settings/holaora/page.tsx` |
| Edit | `src/components/admin/layout/AdminSidebar.tsx` — Settings → HolaOra |
| Edit | `src/app/api/superadmin/.../custom-features/route.ts` + `custom-features/page.tsx` |
| Edit | `src/app/api/storefront/[slug]/route.ts`, `StoreFront` / `ServicesStoreFront` / `SalonStoreFront`, `HolaOraEmbed.tsx` |
| Add | `src/__tests__/lib/holaora-ai-mutex-messages.test.ts`, `holaora-entitlement.test.ts` |
| Edit | `src/app/api/superadmin/integrations/route.ts` |
| Edit | `src/app/api/superadmin/integrations/[integrationId]/route.ts` |
| Edit | `src/app/superadmin/integrations/page.tsx` |
| Add | `src/app/superadmin/integrations/holaora/page.tsx` |
| Edit | `src/components/superadmin/layout/SuperAdminSidebar.tsx` |
| Edit (optional) | `docs/HOLAORA_INTEGRATION.md` — mention dedicated Hola route in §5 |

---

**Last updated:** 2026-03-28 (consolidated from implementation discussion).
