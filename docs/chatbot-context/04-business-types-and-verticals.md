# WaveOrder — business types and verticals

> Source: `prisma/schema.prisma` enum `BusinessType`, marketing `Features.tsx`, `BillingPanel.tsx` (salon/services wording).

## Supported business types (application enum)

The system distinguishes these **BusinessType** values:

| Type | Meaning (high level) |
|------|----------------------|
| **RESTAURANT** | Food service; delivery/pickup/dine-in style flows |
| **CAFE** | Cafés; similar ordering patterns |
| **RETAIL** | Product retail / general merchandise |
| **GROCERY** | Grocery-specific positioning |
| **SALON** | Appointments / salon scheduling emphasis |
| **SERVICES** | Professional services — **appointments + form-based requests** (per schema comment) |
| **OTHER** | Catch-all |

## Marketing positioning

- **“Any business”** narrative on the marketing site includes **Instagram sellers, restaurants, retail**, etc.
- **Features** page mentions optimization for **restaurants, cafes, retail, grocery**, and more — **align answers with the enum** above; do **not** claim verticals that are not in the product (e.g. do not invent “jewelry” or “florist” as named types unless the live product still exposes them).

## How flows differ (Salon / Services vs product businesses)

- **Product-heavy types** (e.g. retail, grocery, restaurant): language around **products**, **delivery scheduling**, **CSV import** on Starter.
- **Salon**: billing copy uses **appointment scheduling**, **services** instead of products where appropriate, **WhatsApp booking** on Starter.
- **Services**: billing copy uses **session scheduling**, **services** limit wording, **WhatsApp booking**; CSV import may be omitted for services on Starter in the billing UI.

## When visitors ask “is WaveOrder for my business?”

Safe guidance:

- If they sell **products** online and take orders via **WhatsApp** → **yes**, typical fit.
- If they run **appointments** (salon / services) → **yes**, product supports **SALON** and **SERVICES** with scheduling-oriented language.
- If they need **custom enterprise** terms, **SSO**, or **compliance guarantees** → **don’t promise**; direct to **sales/support**.

## Geography / language

- Multi-language is a **feature** for storefronts — do **not** assert a specific list of locales without a verified list; say “multiple languages” and point to signup or support for details.
