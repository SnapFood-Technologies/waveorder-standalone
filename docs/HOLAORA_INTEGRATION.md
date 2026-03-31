# HolaOra × WaveOrder Integration

**Status:** Design / specification (implementation TBD)  
**Last updated:** 5 March 2026  

This document describes how **WaveOrder** (source of truth for catalog and billing) integrates with **HolaOra** (scheduling / customer-facing widget and business dashboard). The intent is a **tight platform integration** (bundled offering, shared customers), not a loose optional plugin.

---

## 1. Goals

| Goal | Owner |
|------|--------|
| Businesses subscribe to a **bundle** on WaveOrder that includes HolaOra | WaveOrder (Stripe / subscription) |
| **Provision** a HolaOra tenant when the bundle is active | WaveOrder server → HolaOra provisioning API |
| HolaOra **reads catalog** (services, availability context) from WaveOrder | HolaOra backend → WaveOrder API |
| **Storefront** embeds HolaOra widget where appropriate | HolaOra embed + WaveOrder storefront |
| **SuperAdmin** can enable the integration, set connection details, and tie bundles/prices | WaveOrder SuperAdmin |

---

## 2. Terminology

- **Business** — WaveOrder tenant (`Business` model). Not “merchant.”
- **HolaOra account / tenant** — The HolaOra-side workspace tied to one WaveOrder `businessId`.
- **Reciprocal IDs** — WaveOrder stores HolaOra’s id (e.g. `holaoraAccountId` on `Business`); HolaOra stores WaveOrder `businessId` for API calls and support.

---

## 3. High-level architecture

```
┌─────────────────┐     provisioning      ┌─────────────────┐
│  WaveOrder API  │ ───────────────────► │  HolaOra API    │
│  (on bundle)    │ ◄─────────────────── │  (create tenant)│
└────────┬────────┘   holaoraAccountId    └────────┬────────┘
         │                                         │
         │  catalog / v1 API                       │ embed + dashboard
         │  (API key per business)                 │
         ▼                                         ▼
┌─────────────────┐                       ┌─────────────────┐
│  WaveOrder DB   │                       │  HolaOra app    │
│  (source of     │                       │  (UI + widget)  │
│   catalog)      │                       └─────────────────┘
└─────────────────┘
```

- **WaveOrder** remains **source of truth** for products/services/pricing that HolaOra must reflect.
- **HolaOra** owns scheduling UX, widget behavior, and (unless agreed otherwise) **dashboard login** for business users who manage HolaOra settings.

---

## 4. Flows

### 4.1 Provisioning (WaveOrder → HolaOra)

**Trigger:** New subscription or upgrade to a bundle that includes HolaOra (exact trigger: product decision—e.g. Stripe webhook after successful payment).

**Action:** WaveOrder **server** calls HolaOra **provisioning** endpoint (HTTPS, base URL from config).

**Request payload (conceptual):** Must include at least:

- WaveOrder `businessId` (stable external key for HolaOra)
- Business display name, timezone, locale (as needed)
- **Owner contact email** (for HolaOra user / invite—see §6)
- Any fields HolaOra requires to create a tenant and link catalog

**Response (conceptual):**

- `holaoraAccountId` (or equivalent) — **persisted on `Business`** (e.g. `Business.holaoraAccountId`)
- Optional: one-time setup URL, status flags

**Requirements to finalize with HolaOra:**

- **Authentication** between WaveOrder and HolaOra (shared secret, HMAC, mTLS, etc.)
- **Idempotency** for the same `businessId` (retry-safe provisioning)
- **Failure handling** if provisioning fails after payment (retry queue, support alert, manual reconcile)
- **Deprovisioning** on bundle cancel (disable tenant vs soft-delete vs no-op)

### 4.2 Catalog / read path (HolaOra → WaveOrder)

HolaOra’s backend calls WaveOrder’s **documented API** (e.g. `/api/v1` style) using a **per-business API key** (e.g. `wo_live_…`) or an agreed server token.

- HolaOra must **never** use end-user browser sessions to scrape WaveOrder admin.
- Scope and rate limits should match WaveOrder’s published external API rules where applicable.

### 4.3 Embed (storefront)

- Businesses receive **embed code** from HolaOra (or WaveOrder generates/injects it using `holaoraAccountId` once HolaOra documents the snippet format).
- Embed is for **customers** on the **WaveOrder storefront**; it is **not** the same as HolaOra **dashboard login** (§6).

---

## 5. SuperAdmin on WaveOrder (configuration)

SuperAdmin should be able to:

| Setting | Purpose |
|---------|---------|
| **Master enable** | Turn HolaOra integration on/off for the platform (or per environment). |
| **HolaOra base URL** | Origin used by WaveOrder **servers** for provisioning (and optionally health checks). |
| **Server-to-server auth** | Credential or signing config for WaveOrder → HolaOra (prefer **environment variables** or encrypted secrets; avoid plain secrets in DB). |
| **Bundle / pricing linkage** | Which Stripe products/prices or internal plan SKUs **include** HolaOra so provisioning runs at the right time. |
| **Optional** | Webhook URL from HolaOra → WaveOrder for future events (not required for day one if provisioning + polling suffice). |

**Note:** Exact UI and storage follow existing WaveOrder SuperAdmin and billing patterns.

**Implemented in app:** HolaOra uses a platform **`Integration`** row with `kind: HOLAORA` and validated `config` (base URL, Stripe price IDs, default v1 API scopes). SuperAdmin: **Integrations → All integrations** (create/edit) and **Integrations → HolaOra** (`/superadmin/integrations/holaora`) for a focused dashboard. See `docs/HOLAORA_IMPLEMENTATION_SPEC.md`.

---

## 6. Business users: HolaOra login vs embed

Business **owners/staff** may use **HolaOra’s own app** for settings, analytics, and appearance. That is **separate** from the **embed** on the WaveOrder storefront.

**How owners get dashboard access** is primarily a **HolaOra product** decision. HolaOra should document which of these applies (or a combination):

| Pattern | Description | WaveOrder’s job |
|---------|-------------|-----------------|
| **A — Email from HolaOra** | After provisioning, HolaOra emails the owner (invite, magic link, or set password). | Send **accurate owner email** and `businessId` in provisioning payload; optionally show “Check email for HolaOra” in WaveOrder admin. |
| **B — Link in API response** | Provisioning returns a **one-time setup URL**. | Store or display in business admin: “Complete HolaOra setup” (single use or time-limited per HolaOra rules). |

WaveOrder does **not** need to “choose between embed and credentials”: **embed** = widget for shoppers; **credentials / invite** = access to HolaOra **dashboard**. Both can exist.

**Open point:** Confirm with HolaOra whether they send email, return a link, or both for a given tenant creation.

---

## 7. Customizing the HolaOra embed from WaveOrder admin

- **If** HolaOra’s embed supports **documented** customization (URL query params, `data-*` attributes, `postMessage`, theme API): WaveOrder admin can expose **pass-through** fields (e.g. primary color, language) that map 1:1 to HolaOra’s API.
- **If** customization is **only** inside HolaOra’s UI: WaveOrder should **link** to HolaOra settings (“Manage appearance in HolaOra”) rather than duplicate unsupported options.

**Rule:** No WaveOrder-only “skin” that HolaOra does not support—avoid drift and double maintenance.

---

## 8. Security and secrets

- **No API keys in client bundles** for server-only HolaOra provisioning.
- **Per-business** WaveOrder API keys for HolaOra → WaveOrder catalog calls: rotate and scope per HolaOra documentation.
- Store secrets in environment variables or a secure secret manager; validate inputs on all endpoints.

---

## 9. Open decisions (checklist)

Track outcomes in **Notion or shared docs** (source of truth), not only verbal agreement:

- [ ] Provisioning endpoint contract (URL, method, body, response, errors)
- [ ] WaveOrder → HolaOra authentication mechanism
- [ ] Idempotency key strategy (`businessId`-based)
- [ ] Failure and retry behavior; dead-letter / admin tooling
- [ ] Bundle cancellation → HolaOra tenant disable/archive
- [ ] How HolaOra obtains or registers the business **WaveOrder API key** for v1 reads
- [ ] Owner onboarding: email vs returned URL (or both)
- [ ] Embed customization surface (params vs HolaOra-only)
