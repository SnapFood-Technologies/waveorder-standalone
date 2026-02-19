# WaveOrder — Stripe & Financial System Overhaul

**Created:** February 18, 2026 @ 15:00  
**Context:** Issues discovered during the Petiole Foods (Viridian) subscription case and financial dashboard review.  
**Reference:** Linkos.bio financial system (`/dbz/financial/dashboard`, `/dbz/financial/transactions`, `/dbz/analytics/financial`, `/dbz/analytics/cx`)

---

## Problem Summary

The current system has critical gaps in how Stripe subscriptions are managed and how financial data is displayed:

1. **`start-trial` route doesn't save the Stripe subscription ID** → every trial creates an orphaned Stripe subscription with no DB link
2. **`start-trial` allows duplicate subscriptions** → users clicking trial multiple times create multiple Stripe subscriptions (e.g., Petiole Foods had 3 paused subs)
3. **Webhook handlers can't sync paused subscriptions** → they look up by `stripeId` in the DB Subscription table, but since it was never saved, they silently fail
4. **All financial screens show $0** → MRR, ARR, ARPU are calculated from DB Subscription records which are mostly empty
5. **No transaction history** → no record of actual Stripe charges, invoices, or refunds in the platform
6. **No way to fix mismatches** → SuperAdmin has to manually edit the DB via Prisma Studio when Stripe and DB are out of sync

---

## All Files That Need Changes — By Flow

### Flow 1: User Onboarding / Setup Wizard

These files handle the first-time user experience where they pick a plan and start a trial.

| # | File | Type | What It Does Now | What Needs To Change |
|---|------|------|------------------|---------------------|
| 1 | `src/app/api/setup/start-trial/route.ts` | API Route | Creates Stripe trial subscription, saves `plan`/`trialEndsAt`/`graceEndsAt` on User. Does NOT save Stripe subscription ID. Does NOT create Subscription record. Does NOT check for existing subs. | **CRITICAL FIX** — Save Stripe subscription ID, create Subscription record in DB, check for existing Stripe subs before creating new ones, cancel any paused duplicates. |
| 2 | `src/app/api/setup/checkout/route.ts` | API Route | Creates Stripe Checkout Session for paid plan selection during setup. | Verify it correctly creates Subscription record in DB on success (or relies on `checkout.session.completed` webhook). Ensure no duplicate creation. |
| 3 | `src/app/api/setup/check-trial-status/route.ts` | API Route | Checks trial status for the setup flow. | May need to also check Stripe subscription status (not just DB dates) to catch paused/canceled states. |
| 4 | `src/app/api/setup/save-progress/route.ts` | API Route | Saves setup wizard progress. | Review — may store plan selection that needs to be consistent with Stripe. |
| 5 | `src/app/api/setup/complete/route.ts` | API Route | Completes the setup wizard. | Verify subscription state is consistent at completion time. |
| 6 | `src/app/api/setup/finalize/route.ts` | API Route | Finalizes the setup process. | Same as above — ensure subscription record exists before finalizing. |
| 7 | `src/components/setup/Setup.tsx` | Component | Main setup wizard container. | May need to handle error states if trial creation fails (e.g., display "subscription already exists"). |
| 8 | `src/components/setup/steps/PricingStep.tsx` | Component | Pricing/plan selection step, triggers `start-trial`. | Add loading/error handling for duplicate subscription scenarios. Disable button after first click to prevent duplicates. |

### Flow 2: SuperAdmin Creates a Business

These files handle when a SuperAdmin manually creates a new business.

| # | File | Type | What It Does Now | What Needs To Change |
|---|------|------|------------------|---------------------|
| 9 | `src/app/api/superadmin/businesses/route.ts` | API Route | Lists businesses (GET) and creates businesses (POST). On create, sets `subscriptionPlan` and `subscriptionStatus`. | If creating with a trial or paid plan, ensure Stripe customer + subscription are created and Subscription record is saved to DB. |
| 10 | `src/components/superadmin/CreateBusinessForm.tsx` | Component | UI form for creating businesses. Sets initial plan. | Ensure form communicates trial/plan choice to API properly. Show feedback if Stripe customer creation fails. |
| 11 | `src/app/api/superadmin/businesses/[businessId]/complete-setup/route.ts` | API Route | Completes business setup from SuperAdmin. | Verify subscription state is set correctly on completion. |

### Flow 3: SuperAdmin Changes Business Details (Upgrade, Reset Trial, etc.)

These files handle when a SuperAdmin modifies a business's subscription from the admin panel.

| # | File | Type | What It Does Now | What Needs To Change |
|---|------|------|------------------|---------------------|
| 12 | `src/app/api/superadmin/businesses/[businessId]/upgrade-plan/route.ts` | API Route | Creates a new Stripe subscription with trial days and `missing_payment_method: 'pause'`. | Fix: Check for existing subs before creating. Decide if SuperAdmin upgrades should bypass payment requirement (free override vs. actual billing). Save Subscription record to DB. |
| 13 | `src/app/api/superadmin/businesses/[businessId]/reset-trial/route.ts` | API Route | Resets trial for a business. | Fix: Must cancel any existing Stripe subscription before creating a new trial. Must save the new Subscription record. Prevent orphaned Stripe subs. |
| 14 | `src/app/api/superadmin/businesses/[businessId]/route.ts` | API Route | GET/PATCH business details (includes subscription fields). | Review: When patching `subscriptionPlan`/`subscriptionStatus`, ensure Stripe is also updated (or at minimum flag that DB and Stripe may be out of sync). |
| 15 | `src/app/api/superadmin/businesses/[businessId]/subscription/route.ts` | API Route | Gets/updates business subscription details. | Should read from both DB and Stripe. On update, sync to Stripe. |
| 16 | `src/app/superadmin/businesses/[businessId]/page.tsx` | Page | Business detail page — shows subscription info, trial dates. | **NEW SECTION:** Add "Stripe Sync" section with "Analyse Now" button, sync status indicator, and "Sync Now" action. (See Part 4.2 below.) |
| 17 | `src/components/superadmin/UpgradePlanModal.tsx` | Component | Modal for upgrading business plan. | Fix: Prevent creating duplicate Stripe subs. Show warning if business already has a Stripe subscription. |
| 18 | `src/components/superadmin/SuperAdminBusinesses.tsx` | Component | Business list with subscription columns. | May need to show sync status indicator per business (green/red/gray dot). |
| 19 | `src/components/superadmin/SuperAdminUserDetails.tsx` | Component | User details view with `stripeCustomerId` and subscription info. | Ensure it displays actual Stripe subscription status, not just DB plan. |
| 20 | `src/app/api/superadmin/users/[userId]/route.ts` | API Route | Gets/updates user details (includes `stripeCustomerId`, subscription). | May need to return Stripe subscription status alongside DB data. |

### Flow 4: Business Owner Uses Billing Panel

These files handle when a business owner manages their subscription from their admin dashboard.

| # | File | Type | What It Does Now | What Needs To Change |
|---|------|------|------------------|---------------------|
| 21 | `src/components/admin/billing/BillingPanel.tsx` | Component | Main billing UI — shows plan, trial status, upgrade/downgrade options, billing portal link. | Ensure displayed data matches Stripe reality. If DB says PRO but Stripe is paused, show accurate state. |
| 22 | `src/app/api/billing/create-checkout/route.ts` | API Route | Creates Stripe Checkout Session for plan purchase/upgrade. | Verify: After checkout completes (via webhook), Subscription record is created/updated in DB. Check for existing subs. |
| 23 | `src/app/api/billing/create-portal/route.ts` | API Route | Creates Stripe Billing Portal session (manage payment methods, cancel, etc.). | No major change — portal is Stripe-hosted. But ensure webhook events from portal actions (update/cancel) are handled correctly. |
| 24 | `src/app/api/billing/cancel-subscription/route.ts` | API Route | Cancels user subscription. | Verify: Cancels in both Stripe AND updates DB Subscription record + User.plan + Business.subscriptionPlan/Status. |
| 25 | `src/app/api/user/subscription/route.ts` | API Route | Returns user's subscription status. | Should cross-check Stripe status vs DB. Return accurate state. |
| 26 | `src/app/api/admin/stores/[businessId]/subscription/route.ts` | API Route | Gets subscription details for a store. | Same — read from Stripe if possible, fall back to DB. |
| 27 | `src/app/admin/stores/[businessId]/settings/billing/page.tsx` | Page | Billing settings page for a store. | Ensure it renders accurate Stripe state. |
| 28 | `src/hooks/useSubscription.ts` | Hook | React hook for subscription data used across admin UI. | May need to fetch fresh Stripe status instead of just DB cache. |
| 29 | `src/components/admin/dashboard/UpgradePrompt.tsx` | Component | Shows upgrade prompts when plan limits are reached. | Should check real Stripe status — don't show upgrade if user is on PRO but Stripe is paused (show "payment required" instead). |

### Flow 5: Stripe Webhooks (Trial Ends, Payment Succeeds/Fails, etc.)

These files handle events coming FROM Stripe into WaveOrder.

| # | File | Type | What It Does Now | What Needs To Change |
|---|------|------|------------------|---------------------|
| 30 | `src/app/api/webhooks/stripe/route.ts` | API Route | Handles `checkout.session.completed`, `customer.subscription.created/updated/deleted`, `invoice.payment_succeeded/failed`, `customer.subscription.paused`. Looks up DB Subscription by `stripeId`. | **CRITICAL FIX** — Currently fails silently when Subscription record doesn't exist (trial-started users). Fix: Create Subscription record if missing (look up by `stripeCustomerId` on User). Add `StripeTransaction` creation for payment events. Handle `customer.subscription.resumed` event. |
| 31 | `src/lib/email.ts` | Library | Sends subscription-related emails (`sendSubscriptionChangeEmail`, `sendPaymentFailedEmail`). | May need new email template for "trial ended, subscription paused" notification. |

### Flow 6: Core Stripe & Subscription Libraries

These are shared utility files used across multiple flows.

| # | File | Type | What It Does Now | What Needs To Change |
|---|------|------|------------------|---------------------|
| 32 | `src/lib/stripe.ts` | Library | Stripe client, plan definitions, `createTrialSubscription`, `createSubscriptionByPlan`, `createFreeSubscription`, `updateSubscription`, `cancelSubscription`. All trial functions use `missing_payment_method: 'pause'`. | Review `missing_payment_method: 'pause'` behavior. Consider adding a helper function `getOrCreateSubscription()` that checks for existing subs. Add a `syncSubscriptionFromStripe()` utility. |
| 33 | `src/lib/subscription.ts` | Library | `createUserWithSubscription`, `upgradeUserSubscription`, `cancelUserSubscription`, `getUserSubscriptionStatus`, `syncSubscriptionFromStripe`. | Review all functions — ensure they create/update DB Subscription records. The `syncSubscriptionFromStripe()` function may be the foundation for the Sync feature. |
| 34 | `src/lib/trial.ts` | Library | Trial status helpers, grace period checks, trial conversion logic. | Verify trial status checks also consider Stripe subscription status (not just `trialEndsAt` date). A trial may "end" in DB but Stripe sub may already be paused. |
| 35 | `src/lib/store-limits.ts` | Library | Enforces catalog/store limits based on plan. | Should check real subscription status — if Stripe is paused, enforce STARTER limits even if DB says PRO. |

### Flow 7: Database Schema

| # | File | Type | What It Does Now | What Needs To Change |
|---|------|------|------------------|---------------------|
| 36 | `prisma/schema.prisma` | Schema | `Subscription` model (has `stripeId`, `priceId`, `status`, etc.), `User` model (has `stripeCustomerId`, `subscriptionId`, `plan`, `trialEndsAt`, `graceEndsAt`), `Business` model (has `subscriptionPlan`, `subscriptionStatus`, `trialEndsAt`, `graceEndsAt`). | **ADD:** New `StripeTransaction` model. **ADD:** `lastStripeSync` and `stripeSyncStatus` fields on Business model. **REVIEW:** Whether `subscriptionId` on User correctly links to Subscription model (it should, but verify it's actually populated). |

### Flow 8: SuperAdmin Analytics Screens (Fix Existing)

| # | File | Type | What It Does Now | What Needs To Change |
|---|------|------|------------------|---------------------|
| 37 | `src/app/api/superadmin/analytics/financial/route.ts` | API Route | Calculates MRR/ARR/ARPU from DB Subscription `priceId`. Returns $0 when records are missing. | **FIX:** Read revenue data from Stripe API (list active subscriptions) or from synced DB data. Use `StripeTransaction` table for historical revenue. |
| 38 | `src/app/superadmin/analytics/financial/page.tsx` | Page | Financial analytics dashboard UI. | Update to display accurate data from fixed API. May need to show "data may be stale" warning if sync hasn't run. |
| 39 | `src/app/api/superadmin/analytics/route.ts` | API Route | General analytics endpoint. | Review if it includes subscription metrics — fix data source. |
| 40 | `src/components/superadmin/SuperAdminAnalytics.tsx` | Component | Analytics component. | Review what subscription data it displays and fix source. |

### Flow 9: CX Analytics Screen (Fix Existing)

| # | File | Type | What It Does Now | What Needs To Change |
|---|------|------|------------------|---------------------|
| 41 | CX analytics API route (find exact path) | API Route | Churn from DB `deactivatedAt`, CLV from DB subscription data. | **FIX:** Churn should use Stripe subscription cancellation events. CLV should use actual Stripe payment history. |

### Flow 10: AI Financial Insights (Wavemind)

| # | File | Type | What It Does Now | What Needs To Change |
|---|------|------|------------------|---------------------|
| 42 | `src/app/api/superadmin/wavemind/insights/route.ts` | API Route | Gathers financial data from DB and sends to GPT-4o-mini for analysis. | Once financial data is accurate (after fixing analytics + sync), this will automatically improve. No direct changes needed — it depends on the same data sources. |
| 43 | `src/app/superadmin/wavemind/financial/page.tsx` | Page | AI financial insights UI. | Same — will improve automatically with accurate data. |

### Flow 11: SuperAdmin Sidebar Navigation

| # | File | Type | What It Does Now | What Needs To Change |
|---|------|------|------------------|---------------------|
| 44 | `src/components/superadmin/layout/SuperAdminSidebar.tsx` | Component | Sidebar with Analytics submenu (Overview, Financial, Marketing, CX, etc.). | **ADD:** New top-level "Financial" menu with Dashboard and Transactions children. |

### Flow 12: Subscription Guards & Context

These files enforce plan restrictions across the entire app.

| # | File | Type | What It Does Now | What Needs To Change |
|---|------|------|------------------|---------------------|
| 45 | `src/components/SubscriptionGuard.tsx` | Component | Guards routes based on subscription plan from DB. | Should also consider Stripe subscription status. If Stripe is paused but DB says PRO, user should see a "payment required" state, not full PRO access. |
| 46 | `src/contexts/BusinessContext.tsx` | Context | Provides business data (including plan) to all components. | The subscription data in context should reflect accurate state. |
| 47 | `src/components/admin/layout/AdminHeader.tsx` | Component | Admin header — may show subscription badge. | Should show accurate status (paused, expired, active). |
| 48 | `src/components/admin/layout/AdminSidebar.tsx` | Component | Admin sidebar — may gate features by plan. | Same — use accurate subscription state. |

### Flow 13: Migration Scripts

| # | File | Type | What It Does Now | What Needs To Change |
|---|------|------|------------------|---------------------|
| 49 | `scripts/migrate-free-to-starter.ts` | Script | Migrates free users to starter plan. | Review — ensure it creates Subscription records properly. |
| 50 | `scripts/update-business-subscription.ts` | Script | Updates business subscriptions. | Review — ensure Stripe sync. |

---

## NEW Files To Create

### New API Routes

| # | File | Purpose |
|---|------|---------|
| N1 | `src/app/api/superadmin/financial/dashboard/route.ts` | Financial Dashboard API — fetches real-time data from Stripe (revenue, MRR, ARR, balance, subscriptions, recent transactions) |
| N2 | `src/app/api/superadmin/financial/transactions/route.ts` | Transactions API — fetches all charges/invoices/refunds from Stripe with filtering, search, pagination |
| N3 | `src/app/api/superadmin/stripe-sync/route.ts` | Global Sync API — compares all Stripe customers/subscriptions with DB, returns mismatches |
| N4 | `src/app/api/superadmin/stripe-sync/fix/route.ts` | Global Sync Fix API — applies fixes for all mismatches at once |
| N5 | `src/app/api/superadmin/businesses/[businessId]/stripe-sync/route.ts` | Per-Business Sync API — analyses one business's Stripe data vs DB, returns problems |
| N6 | `src/app/api/superadmin/businesses/[businessId]/stripe-sync/fix/route.ts` | Per-Business Sync Fix API — applies fixes for one business |
| N7 | `src/app/api/superadmin/financial/backfill/route.ts` | Historical Backfill API — one-time import of all past Stripe transactions into StripeTransaction table |

### New Pages

| # | File | Purpose |
|---|------|---------|
| N8 | `src/app/superadmin/financial/dashboard/page.tsx` | Financial Dashboard page — KPI cards, charts, recent transactions, sync button/modal |
| N9 | `src/app/superadmin/financial/transactions/page.tsx` | Transactions page — filterable table of all Stripe charges/invoices/refunds |

---

## Part 4: Stripe Sync System — Detail

### 4.1 Global Sync (Financial Dashboard)

**Trigger:** "Sync" button on `/superadmin/financial/dashboard`  
**API:** `POST /api/superadmin/stripe-sync`

**What it does:**
1. Fetch all Stripe customers that have WaveOrder metadata
2. For each customer, fetch their subscriptions from Stripe
3. Compare against DB records (User.plan, Business.subscriptionPlan, Subscription table)
4. Identify mismatches:
   - Stripe says active, DB says STARTER → mismatch
   - Stripe says paused, DB says PRO/ACTIVE → mismatch
   - No Subscription record in DB for a Stripe subscription → missing
   - Multiple subscriptions for same customer → duplicates
5. Show results in a modal:
   - Count of in-sync businesses
   - List of mismatches with details
   - "Sync All" button to fix all at once
   - Per-business "Fix" buttons

### 4.2 Per-Business Sync (Business Detail Page)

**Location:** New section on `/superadmin/businesses/[businessId]`  
**API:** `POST /api/superadmin/businesses/[businessId]/stripe-sync`

**UI: "Stripe Sync" section**
- Shows current sync status:
  - Green: "In sync — Last checked: Feb 18, 2026 @ 14:30"
  - Red: "Out of sync — 2 issues found"
  - Gray: "Never synced"
- "Analyse Now" button

**On "Analyse Now":**
1. Fetch the business owner's `stripeCustomerId`
2. Fetch all subscriptions for that customer from Stripe
3. Compare with DB state
4. Show findings:
   - DB plan vs Stripe subscription status
   - Missing Subscription record
   - Duplicate subscriptions (with option to cancel extras)
   - Payment method on file (yes/no)
   - Last payment date and amount
5. "Sync Now" button to fix — updates DB to match Stripe:
   - Creates/updates Subscription record
   - Updates User.plan and Business.subscriptionPlan/subscriptionStatus
   - Clears stale trialEndsAt/graceEndsAt if subscription is active
   - Cancels duplicate Stripe subscriptions

**Tracking:**
- Store `lastStripeSync` timestamp on Business model (or separate SyncLog)
- Store sync result (in_sync / issues_found / synced)

---

## Part 5: Transaction Storage

### 5.1 New Database Model

```prisma
model StripeTransaction {
  id        String   @id @default(auto()) @map("_id") @db.ObjectId
  
  stripeId  String   @unique  // ch_xxx, in_xxx, re_xxx
  type      String             // "charge", "invoice", "refund"
  status    String             // "succeeded", "paid", "failed", "refunded"
  
  amount    Int                // Amount in cents
  currency  String             // "usd", "eur"
  
  customerId     String?       // Stripe customer ID
  subscriptionId String?       // Stripe subscription ID
  
  customerEmail  String?
  customerName   String?
  
  description    String?
  plan           String?       // STARTER, PRO, BUSINESS
  billingType    String?       // monthly, yearly, trial, free
  
  refundedAmount Int?          // For charges that were refunded
  
  businessId     String?  @db.ObjectId
  userId         String?  @db.ObjectId
  
  stripeCreatedAt DateTime    // When Stripe created it
  createdAt       DateTime @default(now())
  
  @@index([customerId])
  @@index([businessId])
  @@index([type])
  @@index([status])
  @@index([stripeCreatedAt])
  @@map("stripe_transactions")
}
```

### 5.2 Population Methods

**A. Going forward — Webhook capture:**
- On `invoice.payment_succeeded`, `invoice.payment_failed`, `charge.refunded` → create a StripeTransaction record
- Extend existing webhook handler in `src/app/api/webhooks/stripe/route.ts`

**B. Historical backfill — One-time sync:**
- Admin action to fetch all past charges/invoices/refunds from Stripe API and populate the table
- Can be a manual action button on the Financial Dashboard

---

## Part 6: Sidebar Navigation Update

**Current SuperAdmin sidebar:**
```
Analytics
├── Overview
├── Financial    ← reads from DB, shows $0
├── Marketing
├── CX           ← incomplete churn/CLV
├── Geolocation
└── Archived
```

**Updated SuperAdmin sidebar:**
```
Analytics
├── Overview
├── Financial    ← FIXED: accurate data from Stripe + DB
├── Marketing
├── CX           ← FIXED: Stripe-backed churn/CLV
├── Geolocation
└── Archived

Financial (NEW)
├── Dashboard    ← Real-time Stripe data, sync button
└── Transactions ← All charges/invoices/refunds
```

---

## Implementation Priority

### Phase 1 — Critical Fixes (unblocks everything)
1. Fix `start-trial` to save Subscription record + prevent duplicates
2. Fix `upgrade-plan` and `reset-trial` to prevent orphaned Stripe subs
3. Fix webhook handler to create missing Subscription records
4. New `StripeTransaction` model + webhook capture (start storing transactions going forward)

### Phase 2 — Sync System
5. Per-business Stripe Sync on business detail page ("Analyse Now" + "Sync")
6. Global Sync on Financial Dashboard

### Phase 3 — New Financial Section
7. Financial Dashboard (`/superadmin/financial/dashboard`)
8. Transactions page (`/superadmin/financial/transactions`)
9. Sidebar navigation update
10. Historical transaction backfill

### Phase 4 — Fix Existing Screens
11. Fix Financial Analytics to use accurate data
12. Fix CX Analytics churn/CLV with Stripe data
13. Fix Subscription Guards to check real Stripe status

---

## Summary: Total Changes

| Category | Existing Files to Modify | New Files to Create |
|----------|-------------------------|-------------------|
| API Routes | 20 | 7 |
| Pages | 4 | 2 |
| Components | 12 | 0 |
| Libraries | 4 | 0 |
| Schema | 1 | 0 |
| Scripts | 2 | 0 |
| Sidebar | 1 | 0 |
| **Total** | **44** | **9** |

---

## Context: The Petiole Foods Case

**Customer:** Petiole Foods Marketing Team (`marketing@petiolefoods.com`)  
**Stripe Customer:** `cus_Tu4wm7NvvuhYjC`  
**Business:** Viridian (slug: `viridian`, Bahrain restaurant)

**What happened:**
1. User started trial 3 times (Feb 2 twice, Feb 3 once) → 3 Stripe subscriptions created
2. `start-trial` overwrote DB dates each time but never saved any subscription ID
3. Trial ended Feb 17 → all 3 subscriptions paused in Stripe
4. Webhook `subscription.paused` couldn't find DB record → silent failure
5. DB still shows `plan: PRO`, `subscriptionStatus: ACTIVE` (stale)
6. Financial dashboard shows $0 MRR because no Subscription records exist

**Immediate resolution:**
1. Cancel 2 older paused subscriptions in Stripe
2. Share payment update link for remaining one
3. After payment: Resume subscription, then manually sync DB or use the new Stripe Sync feature

---

*This document covers all Stripe and financial system work needed. 50 existing files to review/modify + 9 new files to create across 13 flows.*
