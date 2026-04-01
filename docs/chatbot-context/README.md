# WaveOrder chatbot context (knowledge base)

These Markdown files are **intended as grounding context** for the WaveOrder visitor chatbot (features, pricing, business fit, how it works).

**Source:** Derived from this repository (`src/lib/stripe.ts`, `PaymentMethodsStep.tsx`, `BusinessConfiguration.tsx`, `prisma/schema.prisma`, internal subscription docs). **Merchant customer payment methods** were verified against setup/admin UI (cash only); **not** from marketing FAQ copy where it conflicted. **Re-verify** live pricing on [waveorder.app](https://waveorder.app) before production use.

| # | File | Topic |
|---|------|--------|
| 01 | `01-overview-what-is-waveorder.md` | Product positioning |
| 02 | `02-pricing-and-plans.md` | Plans, limits, annual discount |
| 03 | `03-features-and-capabilities.md` | Feature list aligned with marketing site |
| 04 | `04-business-types-and-verticals.md` | Supported business types |
| 05 | `05-getting-started-trial-onboarding.md` | Trial, signup flow, time-to-live |
| 06 | `06-orders-payments-whatsapp.md` | WhatsApp flow, payments |
| 07 | `07-integrations-technical.md` | API, domains, multi-store |
| 08 | `08-chatbot-guardrails.md` | What not to invent; support contact |
