# WaveOrder — Remaining TODOs

**Created:** February 18, 2026  
**Last Updated:** February 18, 2026 @ 14:00

All previous implementation plan docs have been marked as completed. This is the single source of truth for remaining work — including both doc-level items and `// TODO` comments found in code.

---

## Changelog

| Date | Update |
|---|---|
| Feb 18, 2026 @ 14:00 | Initial creation. Consolidated all TODOs from 16+ implementation docs and full codebase `// TODO` scan. 15 items total (5 high, 5 medium, 5 low). |

---

## High Priority

### 1. ByBest Shop Reverse Sync — *added Feb 18, 2026*
- **What:** Sync product updates, stock changes, and orders FROM WaveOrder TO ByBest Shop
- **Current state:** `src/lib/bybestshop.ts` has interfaces defined but all functions are commented-out stubs. 13 call sites across the codebase reference this with `// TODO` comments.
- **Scope:** Implement the 6 functions in `bybestshop.ts` (`createByBestShop`, `prepareProductForByBestShop`, `updateProductInByBestShop`, `syncProductToByBestShop`, `updateOrderInByBestShop`, `syncOrderToByBestShop`). Then uncomment the call sites.
- **Code TODOs:**
  - `src/lib/bybestshop.ts` — 7 TODOs (all function stubs)
  - `src/app/api/storefront/[slug]/order/route.ts:353` — sync order creation
  - `src/app/api/admin/stores/[businessId]/orders/route.ts:612` — sync admin order creation
  - `src/app/api/admin/stores/[businessId]/orders/[orderId]/route.ts:1014` — sync order status update
  - `src/app/api/admin/stores/[businessId]/orders/[orderId]/revert-stock/route.ts:121` — sync stock revert
  - `src/app/api/admin/stores/[businessId]/products/route.ts:391` — sync product create/update
  - `src/app/api/admin/stores/[businessId]/products/[productId]/route.ts:190` — sync product update
  - `src/app/api/admin/stores/[businessId]/products/[productId]/inventory/route.ts:83` — sync stock update

### 2. OmniStack Gateway Stock Sync on Orders — *added Feb 18, 2026*
- **What:** Sync stock decrements back to OmniStack when orders are placed or stock is reverted
- **Current state:** OmniStack product sync (inbound) works. Outbound stock sync after orders does not.
- **Scope:** After order creation or stock revert, call OmniStack Gateway to update the product stock so both systems stay in sync.
- **Code TODOs:**
  - `src/app/api/storefront/[slug]/order/route.ts:348` — sync stock after customer order
  - `src/app/api/admin/stores/[businessId]/orders/route.ts:607` — sync stock after admin order
  - `src/app/api/admin/stores/[businessId]/orders/[orderId]/route.ts:1008` — sync stock on status change
  - `src/app/api/admin/stores/[businessId]/orders/[orderId]/revert-stock/route.ts:116` — sync stock on revert

### 3. Appointment Reminders — *added Feb 18, 2026*
- **What:** Automated notifications sent 24h before scheduled appointments (PRO+ feature)
- **Current state:** No cron endpoint or scheduled task exists
- **Scope:** Create `/api/cron/appointment-reminders` or integrate as an external integration service (like low-stock-alerts). Send WhatsApp/email reminders. Track sent reminders to avoid duplicates.
- **Previously documented in:** `docs/SALON_FEATURES_REVIEW.md`

### 4. Payment Gateways for Orders — *added Feb 18, 2026*
- **What:** Stripe / PayPal / BKT checkout for order payments
- **Current state:** Stripe works for subscriptions only. Orders are CASH-only.
- **Scope:** Add online payment flow at checkout on the storefront. Handle payment confirmation, refunds, and receipts.
- **Previously documented in:** `docs/implementation/plan-mode/general/admin.md`

### 5. Coupon / Promo Code System — *added Feb 18, 2026*
- **What:** Discount codes customers can apply at checkout
- **Current state:** Product-level discounts exist (originalPrice > price). No coupon/code system.
- **Scope:** Create Coupon model, admin CRUD UI, storefront apply-at-checkout flow, usage limits, expiry dates.
- **Previously documented in:** `docs/implementation/plan-mode/cursor/store-admin-discounts-plan.md`

---

## Medium Priority

### 6. OmniStack externalProductId Investigation — *added Feb 18, 2026*
- **What:** Investigate why `externalProductId` is not being populated in product metadata
- **Current state:** The `prepareProductForOmniGateway` function falls back to SKU or WaveOrder ID because `externalProductId` is empty.
- **Scope:** Check if externalProductId is stored correctly during inbound sync, verify metadata structure.
- **Code TODO:** `src/lib/omnigateway.ts:147`

### 7. Custom Domain — Middleware Wiring — *added Feb 18, 2026*
- **What:** Prisma client lookup in Next.js middleware for custom domain routing
- **Current state:** Domain settings UI, Netlify API integration, and DNS verification are done. Middleware does not yet resolve custom domains to business slugs.
- **Scope:** Wire Prisma (or a lightweight lookup) in `middleware.ts` to map incoming custom domain hostnames to business slugs.
- **Previously documented in:** `docs/implementation/plan-mode/cursor/custom-domain-setup.md`

### 8. Custom Domain — WWW Redirect — *added Feb 18, 2026*
- **What:** Redirect `www.custom-domain.com` to `custom-domain.com` (or vice versa)
- **Current state:** No www vs non-www redirect logic exists
- **Scope:** Add redirect handling in middleware or Netlify config.
- **Previously documented in:** `docs/implementation/plan-mode/cursor/custom-domain-setup.md`

### 9. Auth Rate Limiting — *added Feb 18, 2026*
- **What:** Rate limiting on NextAuth login / magic link endpoints
- **Current state:** Rate limiting exists for integration API keys. No rate limiting on `/api/auth/*` routes.
- **Scope:** Add rate limiting middleware for login attempts, magic link requests, and password reset requests.
- **Previously documented in:** `docs/implementation/plan-mode/general/auth-tasks.md`

### 10. Account Linking UI — *added Feb 18, 2026*
- **What:** UI for users to link Google + email accounts
- **Current state:** Backend supports `allowDangerousEmailAccountLinking`. No user-facing UI.
- **Scope:** Add account linking section in profile/settings where users can connect additional auth methods.
- **Previously documented in:** `docs/implementation/plan-mode/general/auth-tasks.md`

---

## Low Priority

### 11. Bulk Appointment Actions — *added Feb 18, 2026*
- **What:** Bulk operations on appointments (cancel multiple, reschedule, etc.)
- **Current state:** Individual appointment management works. No bulk actions.
- **Scope:** Add multi-select and bulk action buttons to the appointments list (PRO+ feature).
- **Previously documented in:** `docs/SALON_FEATURES_REVIEW.md`

### 12. Social Share Buttons — *added Feb 18, 2026*
- **What:** Social media share buttons for store/product sharing
- **Current state:** QR code generator and embed code exist. No social share buttons.
- **Scope:** Add share-to-Facebook, Instagram, Twitter, WhatsApp buttons in admin marketing section and storefront.
- **Previously documented in:** `docs/implementation/plan-mode/general/admin.md`

### 13. Real-time Dashboard (WebSocket) — *added Feb 18, 2026*
- **What:** Replace polling with WebSocket for live dashboard updates
- **Current state:** Dashboard uses `setInterval` polling for data refresh.
- **Scope:** Implement WebSocket or Server-Sent Events for real-time order notifications and dashboard metric updates.
- **Previously documented in:** Codebase review

### 14. Storefront FAQ Chatbot — *added Feb 18, 2026*
- **What:** A configurable FAQ chat bubble on the storefront, similar to the scroll-to-top button positioning. Opens a small bottom modal with a chat-bubble style FAQ list.
- **Current state:** Does not exist.
- **Scope:**
  - **Admin side:** FAQ management page where business owners can create/edit/delete FAQ entries (question + answer pairs), reorder them, and toggle the chatbot on/off.
  - **Storefront side:** Floating chat bubble icon (bottom-right, alongside scroll-to-top). On click, opens a compact bottom sheet / chat-style modal listing the FAQ questions. Tapping a question expands the answer inline. No AI — just a simple configurable FAQ.
  - **Model:** `FaqEntry` (or similar) with `businessId`, `question`, `answer`, `order`, `isActive`.

### 15. SEO Price Range API — *added Feb 18, 2026*
- **What:** API endpoint for storefront SEO price range metadata
- **Current state:** `getPriceRange()` in `src/app/(site)/[slug]/page.tsx` returns hardcoded `'$$'` because categories no longer include products for performance.
- **Scope:** Add a lightweight API to compute min/max prices per business for structured data.
- **Code TODO:** `src/app/(site)/[slug]/page.tsx:272`

---

## Informational Code Comments (Not Actionable)

These are `// TODO` comments in code that serve as documentation/warnings, not work items:

| File | Line | Note |
|---|---|---|
| `src/components/storefront/StoreFront.tsx` | 832 | Explains why testing country override was removed (bug context) |
| `src/components/admin/settings/BusinessSettingsForm.tsx` | 106 | Same as above — testing override context |
| `src/components/setup/steps/PaymentMethodsStep.tsx` | 294 | Dev-only helper note (renders only in development) |
| `src/app/api/storefront/[slug]/route.ts` | 537 | Future MongoDB aggregation optimization note |

---

## Future Considerations

These are not blockers but were noted for future evaluation:

- **Real customer testimonials** — replace placeholder testimonials when available
- **Additional industry landing pages** — cafes, florists, etc.

---

*This file consolidates all remaining TODOs from both docs and codebase. Individual implementation plan docs now reference this file.*
