# WaveOrder — integrations and technical notes

> Source: `src/lib/stripe.ts`, internal docs, marketing site routes. For **developers**, prefer pointing to live **/developers** and **/api-docs** on waveorder.app.

## API access

- **Business** plan includes **API access** in `PLANS` (`apiAccess: true`, `teamMembers: 5`).
- **Pro** and **Starter** have `apiAccess: false` in code.
- Do **not** list undocumented endpoints; refer visitors to **official API documentation** (`/api-docs` route exists in the app).

## Custom domains

- **Business** plan: **custom domain** enabled in plan limits.
- **Pro/Starter**: `customDomain: false` in `PLANS`.

## Payments: two different things

1. **Merchants paying WaveOrder (subscription)** — Handled with **Stripe** (`src/lib/stripe.ts`, checkout webhooks). Credit cards etc. apply here.
2. **Customers paying merchants (storefront)** — Merchant-facing settings only enable **cash** today (`PaymentMethodsStep.tsx`, `BusinessConfiguration.tsx`). Do **not** claim integrated Stripe/PayPal checkout for buyers.

## Analytics and tracking

- The product may support **analytics** dashboards and optional **marketing pixels** (e.g. Meta) — **do not** assert a merchant has a feature enabled; say “available depending on plan and settings.”

## Observability

- Engineering may use **Sentry** (`@sentry/nextjs` in codebase) — **not** a visitor-facing feature; don’t mention unless asked technically.

## Multi-store architecture (for “how does multi-store work?”)

- Each **store** can have its own **slug/URL**, **branding**, **catalog**, **orders**, **WhatsApp number**, and **analytics** (per internal multistore doc).
- Limits: **1 / 5 / unlimited** stores by **Starter / Pro / Business**.

## Security & data (generic)

- Do **not** invent **certifications** (SOC2, HIPAA, etc.).
- For **data residency**, **GDPR**, **export** — say **contact support** or read **Privacy Policy** at **waveorder.app/privacy** unless you have verified text.
