# Billing & Subscription – Scenarios and Implementation

This document describes how all billing and subscription scenarios are handled in WaveOrder: onboarding, billing panel actions, Stripe webhooks, and superadmin logging.

---

## 1. Onboarding

| Scenario | Flow | APIs / Webhooks |
|----------|------|------------------|
| **Paid plan at setup** (Starter, Pro, or Business; monthly or annual) | User selects plan → Setup checkout creates Stripe Checkout session → User pays → `checkout.session.completed` webhook → `handleSubscriptionCreated` updates DB (plan, status, business). | `POST /api/setup/checkout`, Stripe webhook `checkout.session.completed` |
| **Pro trial at setup** | User chooses “Start 14-Day Free Trial” → Start-trial API creates Stripe subscription with trial → Webhook syncs DB. | `POST /api/setup/start-trial`, Stripe webhooks |

---

## 2. Billing Panel – Plan Changes

### 2.1 Upgrades

| Action | Flow | API |
|--------|------|-----|
| **Starter → Pro** | User clicks “Upgrade to Pro” → Create Checkout session for PRO → Redirect to Stripe → Payment → Webhook updates subscription. | `POST /api/billing/create-checkout` with `planId: 'PRO'` |
| **Starter → Business** | Same as above for BUSINESS. | `POST /api/billing/create-checkout` with `planId: 'BUSINESS'` |
| **Pro → Business** | Same as above for BUSINESS. | `POST /api/billing/create-checkout` with `planId: 'BUSINESS'` |

Billing interval (monthly vs annual) is taken from the billing panel toggle and sent as `isAnnual` in the request.

### 2.2 Downgrades (switch to another paid plan)

Downgrades go through Stripe Checkout so the user pays for the new plan. The previous subscription is cancelled when the new one is created (webhook).

| Action | Flow | API |
|--------|------|-----|
| **Pro → Starter** | User clicks “Downgrade to Starter” → Confirmation modal “Switch to Starter Plan?” → Create Checkout for **paid** Starter → Redirect to Stripe → Payment → Webhook creates new Starter sub and **cancels** old Pro sub. | `POST /api/billing/create-checkout` with `planId: 'STARTER'` |
| **Business → Pro** | User clicks “Downgrade to Pro” → Modal “Switch to Pro Plan?” → Create Checkout for Pro → Redirect → Webhook creates new Pro sub and cancels old Business sub. | `POST /api/billing/create-checkout` with `planId: 'PRO'` |
| **Business → Starter** | Same as Pro → Starter; modal then Checkout for Starter. | `POST /api/billing/create-checkout` with `planId: 'STARTER'` |

- **Create-checkout** allows `planId: 'STARTER'` or `'PRO'` when current plan is higher (downgrade).
- **Webhook** `handleSubscriptionCreated`: when the new subscription replaces an existing one (same DB subscription record, new `stripeId`), the **previous** Stripe subscription is cancelled immediately via `cancelSubscriptionImmediately(oldStripeSubId)`.

### 2.3 Cancel subscription (no new plan)

User stops paying at period end; they keep access until then, then drop to Starter limits.

| Action | Flow | API |
|--------|------|-----|
| **Cancel subscription** | Shown only when on Pro or Business and not already cancelling. User clicks “Cancel subscription” → Confirmation modal (keep access until period end, then Starter limits) → Confirm → Cancel API runs. Stripe: `cancel_at_period_end: true`. DB: subscription record gets `cancelAtPeriodEnd`, businesses may be updated. User keeps full access until period end (Stripe still returns active). When period ends, Stripe sends `customer.subscription.deleted` → webhook sets plan to STARTER and status CANCELLED. | `POST /api/billing/cancel-subscription` |

- **Cancel** is **not** “downgrade to paid Starter”: no checkout, no new payment.
- After period end, user has Starter limits (e.g. 50 products/services, 1 store, basic analytics) and can resubscribe from the billing page.

### 2.4 Manage Billing (Stripe Customer Portal)

| Action | Flow | API |
|--------|------|-----|
| **Manage Billing** | Opens Stripe Customer Portal in a new tab (update payment method, view invoices, etc.). Return URL points back to the store’s billing settings. | `POST /api/billing/create-portal` with `businessId` |

---

## 3. Stripe Webhooks

| Event | Handler | Effect |
|-------|---------|--------|
| `checkout.session.completed` | `handleCheckoutSessionCompleted` → `handleSubscriptionCreated` | New subscription created or existing record updated with new `stripeId`; if replacing, old Stripe sub cancelled. User, subscription, and businesses updated. Emails: upgrade / trial_converted / downgraded. |
| `customer.subscription.created` | `handleSubscriptionCreated` | Same as above (idempotent if already processed). |
| `customer.subscription.updated` | `handleSubscriptionUpdated` | Sync status, priceId, plan, period, cancelAtPeriodEnd; update businesses. Optionally send subscription change email. |
| `customer.subscription.deleted` | `handleSubscriptionDeleted` | Set subscription status to canceled; set user plan and businesses to STARTER and CANCELLED. Send cancellation email. |
| `invoice.payment_succeeded` | `handlePaymentSucceeded` | Record transaction; renewals trigger subscription update and optional renewal email. |
| `invoice.payment_failed` | `handlePaymentFailed` | Record failure; optional payment-failed email with link to portal. |

---

## 4. Billing Panel Logging (Superadmin)

All billing panel actions are logged with type **`billing_panel_action`** so superadmins can filter and audit them.

| Action | Log message | Metadata (examples) |
|--------|-------------|----------------------|
| **Checkout started** (upgrade or downgrade) | `Checkout started: {planId} (annual|monthly)` | `userId`, `userEmail`, `planId`, `isAnnual`, `action: 'checkout_started'`, `sessionId` |
| **Cancel requested** | `Subscription cancel requested ({oldPlan})` | `userId`, `userEmail`, `oldPlan`, `action: 'cancel_requested'`, `currentPeriodEnd` |
| **Portal opened** | `Billing portal opened` | `userId`, `userEmail`, `action: 'portal_opened'` |

- **Log type:** `billing_panel_action`
- **Severity:** `info`
- **Context:** `businessId` (when available), `ipAddress`, `userAgent`
- **Superadmin:** System → Logs → filter by type **“Billing Panel Action”**

---

## 5. API Reference (billing)

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/billing/create-checkout` | POST | Create Stripe Checkout session for a plan (upgrade or downgrade). Body: `{ planId, isAnnual, businessId }`. Returns `{ checkoutUrl, sessionId }`. |
| `/api/billing/cancel-subscription` | POST | Cancel current subscription at period end. No body. User keeps access until period end. |
| `/api/billing/create-portal` | POST | Create Stripe Customer Portal session. Body: `{ businessId }`. Returns `{ portalUrl }`. |
| `/api/setup/checkout` | POST | Create Checkout session from setup flow. Body: `{ planId, isAnnual }`. |
| `/api/setup/start-trial` | POST | Start Pro trial (Stripe subscription with trial). |

---

## 6. Summary Table – “Do we handle it?”

| Scenario | Handled |
|----------|--------|
| Onboard with paid plan (Starter/Pro/Business) | Yes – setup checkout + webhook |
| Onboard with Pro trial | Yes – start-trial + webhook |
| Upgrade (Starter→Pro, Starter→Business, Pro→Business) | Yes – create-checkout + webhook |
| Downgrade to Starter (from Pro or Business) | Yes – create-checkout(STARTER) + webhook (replace + cancel old) |
| Downgrade to Pro (from Business) | Yes – create-checkout(PRO) + webhook (replace + cancel old) |
| Cancel subscription (access until period end, then Starter) | Yes – cancel-subscription + webhook at period end |
| Manage Billing (portal) | Yes – create-portal |
| Payment succeeds / renewals | Yes – invoice.payment_succeeded webhook |
| Payment fails | Yes – invoice.payment_failed webhook |
| Subscription deleted (period end) | Yes – customer.subscription.deleted webhook |
| Billing panel actions in superadmin logs | Yes – billing_panel_action logs + filter |

---

*Last updated: February 2025*
