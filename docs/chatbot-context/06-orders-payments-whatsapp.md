# WaveOrder — orders, WhatsApp, and payments

> Source: `src/components/setup/steps/PaymentMethodsStep.tsx`, `src/components/admin/settings/BusinessConfiguration.tsx` (merchant payment UI). **Do not** use old marketing FAQ text about Stripe/PayPal for customer checkout — it was inaccurate vs the product.

## WhatsApp / API (public FAQ)

**“Do I need WhatsApp Business API?”** — Marketing answer:

> **No.** WaveOrder works with **regular WhatsApp** or **WhatsApp Business app**. Orders go to the merchant’s **existing number** without API setup, verification, or **per-message fees** (positioning for the core flow).

**“How do customers place orders?”** — Marketing answer:

> Customers browse the **online catalog**, select items, and use **“Order via WhatsApp”**. That **opens WhatsApp** with a **pre-formatted message** ready to send.

## Link in bio / Instagram

**“Can I use this with my Instagram bio link?”** — Marketing answer:

> **Yes.** Share the catalog link in **bio, stories, or posts**; followers browse and order through WhatsApp.

## Customer payment methods (verified against product code)

**What merchants can configure today**

- Only **cash** (`PaymentMethod` id `CASH`) is selectable — labeled as cash when the order is **delivered**, **picked up**, or when an **appointment/session** completes (copy varies by `businessType` in `BusinessConfiguration.tsx`).
- **Stripe, PayPal, bank transfer** (and similar) are shown in the same flows with **`available: false`** or **`comingSoon: true`** — **not** usable for customer checkout in the app today.

**Schema vs UI**

- `prisma/schema.prisma` enum `PaymentMethod` includes `CASH`, `BANK_TRANSFER`, `STRIPE`, `PAYPAL`, etc. That does **not** mean all are exposed in the storefront/settings UI.

**Subscription billing (WaveOrder → merchant)**

- Merchants **pay WaveOrder** via **Stripe** (plans/trials). That is **not** the same as end-customer payment methods.

**Commission**

- WaveOrder states it does **not** take a commission on order revenue (see pricing/marketing FAQs) — do **not** contradict that without a verified policy update.

**Important:** Do **not** describe WaveOrder as a **payment processor** for customer card charges. Cash is arranged **outside** integrated card rails; settlement is between merchant and customer.

## Order management

- Merchants use the **dashboard** for order pipeline (status, notifications — exact labels depend on business configuration).
- **Order notifications** and **delivery zones / fees** are feature areas (see features doc).

## Refunds / disputes

- **Do not invent** policy. Say disputes are between **merchant and customer** unless official WaveOrder policy says otherwise — when unsure, **support@waveorder.app**.
