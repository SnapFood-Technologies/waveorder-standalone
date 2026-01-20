## SuperAdmin Onboarding & Free Plan Configuration

This document explains how SuperAdmins can onboard businesses, assign plans (including special free plans), and how Stripe + the database stay in sync.

---

## 1. Creating Businesses from SuperAdmin

**Location**: `SuperAdmin → Businesses → Create Business`

### 1.1 Form Fields

- **Business details**:
  - **Name**
  - **Slug** (store URL)
  - **Business type** (RESTAURANT, CAFE, RETAIL, etc.)
  - **Currency**
  - **Language**
  - **WhatsApp number**
  - Optional: address, website, logo, cover image, etc.

- **Owner details**:
  - **Owner name**
  - **Owner email**
  - Optional: password (depending on flow)

- **Subscription**:
  - **Plan**:
    - `STARTER`
    - `PRO`
  - **Billing type**:
    - `monthly`
    - `yearly`
    - `free` (SuperAdmin only)

### 1.2 What Happens on Create

When a SuperAdmin creates a business:

- **Stripe customer**:
  - If the owner does not have `stripeCustomerId`, we create one in Stripe.
  - We store `stripeCustomerId` on the owner user record.

- **Stripe subscription**:
  - We call `createSubscriptionByPlan(customerId, plan, billingType)`:
    - For `monthly` → uses normal monthly price ID.
    - For `yearly` → uses normal annual price ID.
    - For `free` → uses special free price ID (see section 2).
  - We store:
    - `subscription.stripeId`
    - `subscription.priceId`
    - `subscription.plan` (STARTER or PRO)
    - Status and period dates.

- **Database sync** (inside a transaction):
  - **User**:
    - `plan = 'STARTER' | 'PRO'`
    - `subscriptionId` relationship pointing to the subscription.
  - **Business**:
    - `subscriptionPlan = 'STARTER' | 'PRO'`
    - `subscriptionStatus = 'ACTIVE'`
  - **Subscription**:
    - `plan = 'STARTER' | 'PRO'`
    - `priceId` matches Stripe subscription item.

**Important**: this keeps `User.plan`, `Business.subscriptionPlan`, and `Subscription.plan` in sync.

---

## 2. Free Plan Support in Stripe (Starter & Pro)

We created **dedicated Stripe prices** for free subscriptions:

- **Environment variables**:
  - `STRIPE_STARTER_FREE_PRICE_ID`
  - `STRIPE_PRO_FREE_PRICE_ID`

### 2.1 lib/stripe.ts Configuration

- `PLANS.STARTER.freePriceId = process.env.STRIPE_STARTER_FREE_PRICE_ID`
- `PLANS.PRO.freePriceId = process.env.STRIPE_PRO_FREE_PRICE_ID`

`createSubscriptionByPlan(customerId, plan, billingType)`:

- If `billingType === 'free'`:
  - For `STARTER` → uses `PLANS.STARTER.freePriceId`
  - For `PRO` → uses `PLANS.PRO.freePriceId`
  - Sets Stripe subscription metadata:
    - `plan: 'STARTER' | 'PRO'`
    - `billingType: 'free'`
    - `source: 'waveorder_platform'`

This gives us:

- A **real Stripe subscription** with a **0 amount** price.
- Clean upgrade/downgrade paths later (no special-casing “no subscription”).

---

## 3. Where Free Is Allowed (and Not Allowed)

### 3.1 SuperAdmin

- **Can**:
  - Create businesses with:
    - `STARTER (Free)`
    - `PRO (Free)`
  - Change existing businesses via:
    - `PATCH /api/superadmin/businesses/[businessId]/subscription`
    - To any combination of:
      - Plan: STARTER / PRO
      - Billing type: `monthly` / `yearly` / `free`

### 3.2 Normal Onboarding (/setup)

- **Cannot** pick free:
  - `/setup` flow always redirects to Stripe Checkout for:
    - `STARTER (paid)`
    - `PRO (paid)`
  - There is no “skip payment” or “free tier” in the end-user onboarding.

Summary:

- **Free plans** are **SuperAdmin-only tooling** for special cases.
- Regular users must go through **paid** checkout to activate Starter or Pro.

---

## 4. Billing UI Behavior for Free Plans

Location: **Admin → Settings → Billing & Subscription**

When `billingType = 'free'` (STARTER or PRO free):

- **Current Plan banner**:
  - Shows `$0 / month` (for the current free plan).
  - Shows message:
    - “You are currently on a special free plan.”
  - Adds helper text:
    - “To change your plan, please contact our support team through the Help & Support module.”

- **Billing cycle toggle**:
  - Hidden for free plans (no Monthly/Annual switch).

- **Manage Billing button**:
  - Hidden for free plans.

- **Plans grid buttons**:
  - For the **current** free plan:
    - Replaced with:
      - “Contact Support to Change Plan”
      - “Available in Help & Support”
  - For other plans:
    - Buttons are disabled while free is active (so users can’t self-upgrade/downgrade from a special free configuration).

This ensures:

- Only SuperAdmins (or support) can migrate special free accounts to paid.
- End-users on free Pro/Starter do not see confusing billing options.

---

## 5. Special SuperAdmin-Created PRO Free Businesses

We used the above mechanism to configure **4 specific businesses**:

- **Neps Shop**
- **Swarovski**
- **Villeroy & Boch**
- **Swatch**

### 5.1 Their Configuration

- **Plan**:
  - `subscriptionPlan = 'PRO'`
  - `subscriptionStatus = 'ACTIVE'`

- **Stripe**:
  - Active subscription with **Pro free price** (`STRIPE_PRO_FREE_PRICE_ID`).

- **Features**:
  - They have **all PRO features** (same as normal paid PRO).

### 5.2 How They Appear in the UI

- **SuperAdmin**:
  - In SuperAdmin Businesses list and analytics:
    - Plan badge shows: `PRO (Free)`
  - In SuperAdmin subscription change modal:
    - Plan: `PRO`
    - Billing: `Free`
  - SuperAdmin can later change them to:
    - `PRO (Monthly)`, `PRO (Yearly)`
    - Or downgrade to `STARTER (Free/Monthly/Yearly)`

- **Business Owner (Admin Panel)**:
  - Sees **Pro** plan everywhere (same experience as paid Pro).
  - Billing page is **locked** into special free state with support messaging (no self-service plan change).

---

## 6. Implementation Notes (High Level)

- **Schema**:
  - `Business.subscriptionPlan` enum: `STARTER | PRO`
  - `Business` includes Stripe + appearance + contact settings.
  - New fields for free plan tooling are all **optional** to avoid breaking old records.

- **Core libraries**:
  - `src/lib/stripe.ts`
    - `PLANS` definition + `freePriceId` fields.
    - `createSubscriptionByPlan(...)` with `billingType: 'free' | 'monthly' | 'yearly'`.
  - `src/lib/subscription.ts`
    - Keeps `User`, `Business`, `Subscription` synchronized when:
      - Creating users with subscriptions.
      - Upgrading/downgrading.
      - Syncing with Stripe webhooks.

- **SuperAdmin APIs**:
  - `POST /api/superadmin/businesses`
    - Creates business + owner + subscription from plan + billingType.
  - `PATCH /api/superadmin/businesses/[businessId]/subscription`
    - Changes plan and billingType, cancels old subscription, creates new one, and syncs DB.

This setup gives SuperAdmin full control over:

- Which businesses are **paid** vs **free**.
- Which of those free businesses are **Starter** vs **Pro**.
- Clean transition paths from **Free → Paid** without hacking around missing subscriptions.

