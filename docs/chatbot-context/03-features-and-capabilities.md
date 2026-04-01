# WaveOrder — features and capabilities

> Source: `src/components/site/Features.tsx`, `src/app/(site)/features/page.tsx` metadata. Use for visitor questions about “what can it do?”

## Core themes (marketing site)

1. **Direct WhatsApp orders** — Orders go to the merchant’s **existing WhatsApp number**; formatted order messages. Positioned as **no expensive WhatsApp API** required for that flow.
2. **Flexible catalog setup** — Manual entry, **CSV import**, optional **API** for advanced users (API availability is tied to **Business** plan; see pricing doc).
3. **Mobile-first catalogs** — Fast, responsive storefronts; marketing claims **sub-2 second load times** (promotional wording).
4. **Team collaboration** — Invites, **Owner / Manager / Staff** style roles (exact RBAC is product detail; don’t over-specify).
5. **Analytics & insights** — Order analytics, revenue, customer patterns (depth varies by plan: basic vs full).
6. **Custom branding** — Colors, logo, themes.

## Additional capabilities (marketing “additional features” list)

- **Inventory management** — Stock levels; toggle items when out of stock.
- **Multi-language** — Serve customers in preferred languages (storefront localization).
- **Customer payment (current product)** — **Cash** only in merchant-facing configuration (see `PaymentMethodsStep.tsx` / `BusinessConfiguration.tsx`). Other methods are UI placeholders, not enabled.
- **Order notifications** — Alerts and status updates.
- **Delivery management** — Zones, fees, ETA-style messaging (as configured).
- **Order history** — Tracking and CRM-style context (feature wording from marketing).
- **Custom domains** — **Business** plan (see pricing doc).

## Public SEO / feature list (features page schema)

Examples called out in structured data:

- Direct WhatsApp integration  
- Mobile-optimized catalogs  
- Team collaboration  
- Inventory management  
- Order analytics  
- Custom branding  
- Multi-language support  
- Cash payment for customer orders (other methods not enabled in UI)  

## Multi-store

- **Pro:** up to **5** catalogs/stores.  
- **Business:** **unlimited** stores/catalogs.  
Each store can have its **own link (slug)**, branding, products, orders, WhatsApp number, and analytics (per internal subscription doc).

## What the chatbot should not promise

- Do **not** invent **SLAs**, **uptime %**, or **guaranteed** load times.
- Do **not** list **API endpoints** unless the user is on a topic covered by public docs (`/developers` or official API docs — verify URLs).
- **AI assistant** or **third-party embeds** (e.g. Hola) may be optional or gated per merchant — if unsure, say configuration varies and suggest **support@waveorder.app** or signing in to the dashboard.
