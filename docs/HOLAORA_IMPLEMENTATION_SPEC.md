# HolaOra — WaveOrder implementation spec (from product decisions)

**Status:** Implemented in codebase (schema, API validation, SuperAdmin UI, HolaOra page). Still **deferred:** live provisioning HTTP client, Stripe webhook wiring, storefront embed.

**Purpose:** One place for **concrete repo changes** agreed for the integration module + HolaOra. Wire format from HolaOra (provisioning API, auth headers, embed snippet) remains **deferred** until they deliver documentation.

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
   - Add **`holaoraAccountId String?`** (nullable).

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

## 6. Dedicated HolaOra screen + sidebar

| Item | Action |
|------|--------|
| **New route** | `src/app/superadmin/integrations/holaora/page.tsx` — dedicated **HolaOra** SuperAdmin page. |
| **Content** | Load the **`Integration`** with **`kind === HOLAORA`** (or fixed slug `holaora` if you enforce it); show Hola **config**, **connected businesses** (same rules as today: `externalIds[slug]` until you migrate counts to `holaoraAccountId`), shortcuts to **API Logs** / main integrations list. |
| **Sidebar** | [`src/components/superadmin/layout/SuperAdminSidebar.tsx`](../src/components/superadmin/layout/SuperAdminSidebar.tsx) — under **Integrations**, add child **HolaOra** → `/superadmin/integrations/holaora`. |

Update **`HOLAORA_INTEGRATION.md` §5** when you want the architecture doc to mention this route explicitly.

---

## 7. Deferred (after HolaOra delivers API + you wire billing)

- Provisioning **HTTP client** (request/response per their contract).
- **Stripe** (or subscription) webhook / job: read **`entitlementStripePriceIds`** from the HOLAORA **`Integration`**, call provisioning, write **`Business.holaoraAccountId`**.
- **Deprovisioning** when bundle ends (per joint agreement).
- **Storefront embed** (snippet + `holaoraAccountId`) per HolaOra embed docs.
- Optional: **auto-issue** business API keys with **`defaultV1Scopes`** when a business is entitled to HolaOra.

---

## 8. File checklist (summary)

| Action | Path / area |
|--------|----------------|
| Edit | `prisma/schema.prisma` — `Integration.kind`, `Business.holaoraAccountId` |
| Add | `src/lib/…` — validate HOLAORA `config` |
| Edit | `src/app/api/superadmin/integrations/route.ts` |
| Edit | `src/app/api/superadmin/integrations/[integrationId]/route.ts` |
| Edit | `src/app/superadmin/integrations/page.tsx` |
| Add | `src/app/superadmin/integrations/holaora/page.tsx` |
| Edit | `src/components/superadmin/layout/SuperAdminSidebar.tsx` |
| Edit (optional) | `docs/HOLAORA_INTEGRATION.md` — mention dedicated Hola route in §5 |

---

**Last updated:** 2026-03-28 (consolidated from implementation discussion).
