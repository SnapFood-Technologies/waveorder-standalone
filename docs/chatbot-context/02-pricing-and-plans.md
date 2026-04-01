# WaveOrder — pricing and subscription plans

> Source: `src/lib/stripe.ts` (`PLANS`), `src/components/admin/billing/BillingPanel.tsx`, `docs/SUBSCRIPTION_MULTISTORE_IMPLEMENTATION.md`. **Confirm current prices on waveorder.app/pricing before quoting.**

## Currency

Plans in code are priced in **USD** (monthly headline; annual billing uses effective monthly rates below).

## Plans (monthly list price)

| Plan | Monthly | Annual (effective $/mo, ~17% discount) |
|------|---------|----------------------------------------|
| **Starter** | $19 | $16/mo (billed annually) |
| **Pro** | $39 | $32/mo (billed annually) |
| **Business** | $79 | $66/mo (billed annually) |

Annual discount is documented in code as **~17%**.

## Starter — included features (from `PLANS`)

- Up to **50 products**
- Up to **15 categories**
- **1** store/catalog
- **Basic** analytics
- **WhatsApp ordering**
- **CSV import**
- **Email** support

## Starter — limits / not included (from `PLANS`)

- No **scheduling** (appointment/delivery scheduling flags off)
- No **customer insights** (flag off)
- No **team members** (0)
- No **custom domain**, **advanced analytics**, **inventory management**, **wholesale**, **priority support**, **advanced branding**, **API access**

## Pro — included features (from `PLANS`)

- **Unlimited** products and categories
- Up to **5** stores/catalogs
- **Full** analytics
- **Delivery scheduling** (product/restaurant-style wording in `stripe.ts`; **Salon/Services** businesses see “appointment” or “session” scheduling in billing UI copy)
- **Customer insights**
- **Priority** support
- **Inventory management**, **advanced branding**, **wholesale pricing** (per limits)

## Pro — still not included (from `PLANS`)

- **Custom domain** — false
- **API access** — false
- **Team members** — 0 in limits table

## Business — included features (from `PLANS`)

- Everything in Pro, plus:
- **Unlimited** stores/catalogs
- **Team access: 5 users**
- **Custom domain**
- **API access**
- **Dedicated support** (feature list string)

## Salon & Services — wording in billing UI

For **SALON** and **SERVICES** business types, the billing panel swaps copy:

- “**Up to 50 services**” / “**Unlimited services**” instead of products where applicable.
- “**WhatsApp booking**” instead of “WhatsApp ordering” on Starter.
- Starter may **omit CSV import** for services/salon (products-only import).
- Scheduling line: **Appointment scheduling** (salon) vs **Session scheduling** (services) vs **Delivery scheduling** (others).

## Subscription model (code)

- `SubscriptionPlan` enum in Prisma: **STARTER**, **PRO**, **BUSINESS** (not legacy FREE/BASIC names).

## Free trial (from internal subscription implementation doc)

- **14-day free trial**
- **Pro-level features during trial** (per doc)
- **No credit card required** (per doc — verify against live checkout if user asks)
- Trial/subscription behavior is handled via **Stripe** (checkout, webhooks, cancel at period end, proration on changes — implementation detail; don’t quote exact policy without confirming current Terms)
