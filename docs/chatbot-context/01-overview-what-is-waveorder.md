# WaveOrder — what it is (overview)

> Chatbot context: high-level positioning. Details live in the other files in this folder.

## One-line pitch

**WaveOrder helps businesses sell through a web catalog and receive orders on WhatsApp** — without requiring the WhatsApp Business API for basic ordering flows.

## Who it is for

- **Instagram sellers / link-in-bio commerce** — share a catalog URL; customers browse and order via WhatsApp.
- **Restaurants, cafes, grocery, retail** — product-style catalogs, delivery/pickup flows (as configured).
- **Salons and professional services businesses** — appointment/session-style flows (terminology differs from product shops; see business-types doc).

## What customers experience

- A **mobile-friendly storefront / catalog** (public URL per business).
- Customers build a cart or selection, then **open WhatsApp** with a **pre-formatted order message** to the business’s number.

## What merchants get

- **Admin dashboard** to manage catalog, orders, branding, and (depending on plan) analytics, scheduling, team access, and more.
- **Multi-store / multi-catalog** support on higher tiers (separate links and settings per store).

## Product principles (from marketing copy)

- **Simplicity** — no technical expertise required for core setup.
- **No WhatsApp Cloud/API requirement** for the core “order via WhatsApp app” experience (as stated on the marketing site).
- **Customer payments (merchant → buyer)** — In the product UI, merchants can enable **cash** only (cash on delivery / at pickup or when the service is completed, depending on business type). Stripe, PayPal, and bank transfer appear in setup/settings as **not available yet** (`available: false` / `comingSoon` in `PaymentMethodsStep.tsx` and `BusinessConfiguration.tsx`). The Prisma `PaymentMethod` enum lists more values for schema/future use — **do not** tell visitors those are live. **WaveOrder does not take a commission on order revenue** (subscription pricing FAQ).
- **Paying WaveOrder (your subscription)** — Billed via **Stripe** (credit cards, etc.); that is separate from how customers pay merchants.

## Canonical web presence

- Primary marketing site: **https://waveorder.app**
- Public support email (from site schema): **support@waveorder.app**

## Not in scope for this doc

- Exact legal entity name, SLA, or uptime guarantees — **do not invent**; defer to Terms or support.
- Feature-level limits — see `02-pricing-and-plans.md`.
