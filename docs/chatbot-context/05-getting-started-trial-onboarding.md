# WaveOrder — getting started, trial, onboarding

> Source: `src/components/site/Features.tsx` (CTA), `src/app/(site)/page.tsx` FAQ JSON-LD, `docs/SUBSCRIPTION_MULTISTORE_IMPLEMENTATION.md`.

## Free trial (marketing + internal docs)

- Marketing site promotes a **14-day free trial** (“Start 14-Day Free Trial” on Features hero).
- Internal implementation notes: **Pro features during trial**, **no credit card required**, **Stripe**-backed subscription lifecycle — **confirm** current signup flow if a visitor asks for legal/contractual certainty.

## Typical onboarding (public FAQ on homepage)

**“How quickly can I get started?”** — Marketing answer:

> Most businesses have their catalog live within **5 minutes**. Sign up, add products (manually or **CSV import**), connect your **WhatsApp number**, and share your link.

Use this as **guidance**, not a guarantee for every user.

## Steps (generic)

1. **Register** — account creation on the marketing site (`/auth/register` exists in app routes).
2. **Configure business** — setup wizard / store settings (exact steps vary by business type).
3. **Add catalog** — manual entry and/or **CSV** (Starter+); **API** only on **Business** plan for integrations.
4. **Connect WhatsApp** — so the storefront can hand off orders to the merchant’s number.
5. **Share link** — bio, stories, QR, etc.

## Demo

- Marketing site includes a **View Demo** path (`/demo` in Features component). Visitors can explore before signing up.

## Multi-store

- Not required on day one. **Starter** = **1** store. Scaling to more catalogs is a **Pro/Business** topic (see pricing doc).

## If the chatbot is asked for “hand-holding”

- Direct to **support@waveorder.app** for account-specific issues.
- Do **not** invent **phone support** or **onboarding call** packages unless documented elsewhere.
