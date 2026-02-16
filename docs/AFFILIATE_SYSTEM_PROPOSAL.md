# Affiliate System - Complete Proposal

## Overview
An affiliate/influencer marketing system that allows businesses to create affiliate users, assign tracking links with UTM parameters, automatically calculate commissions on completed orders, and manage affiliate payments.

## Features

### 1. SuperAdmin Feature Toggle
- **Location**: Business Details page (`/superadmin/businesses/[businessId]`)
- **Field**: `enableAffiliateSystem` (Boolean, default: false)
- **Purpose**: Enable/disable affiliate system per business

### 2. Business Admin Features
- **Affiliate Management**: Create, edit, delete affiliate users (no login required)
- **Affiliate Links**: Generate unique tracking links with UTM parameters
- **Commission Settings**: Set commission type (% or fixed) per affiliate
- **Earnings Dashboard**: View affiliate earnings, pending balances, payment history
- **Payment Management**: Record payments to affiliates

### 3. Automatic Tracking
- **Order Attribution**: Link orders to affiliates via UTM parameters
- **Commission Calculation**: Auto-create commission when order is completed (PAID + DELIVERED/PICKED_UP)
- **Balance Tracking**: Track unpaid balance per affiliate

---

## Database Schema Changes

### 1. Add to Business Model
```prisma
model Business {
  // ... existing fields
  enableAffiliateSystem Boolean @default(false) // SuperAdmin toggle
  affiliates            Affiliate[]
  affiliateEarnings    AffiliateEarning[]
  affiliatePayments     AffiliatePayment[]
}
```

### 2. Update Order Model (Fix UTM Tracking)
```prisma
model Order {
  // ... existing fields
  
  // UTM Tracking (NEW - Fixes imperfect tracking)
  sessionId      String? // Link to VisitorSession/ProductEvent
  utmSource      String? // utm_source from URL
  utmMedium      String? // utm_medium from URL
  utmCampaign    String? // utm_campaign from URL
  utmTerm        String? // utm_term from URL
  utmContent     String? // utm_content from URL
  affiliateId    String? @db.ObjectId // Link to affiliate (if order came from affiliate link)
  
  // Relations
  affiliateEarning AffiliateEarning? // Commission earned from this order
  
  @@index([affiliateId])
  @@index([utmSource, utmCampaign])
  @@index([sessionId])
}
```

### 3. New Affiliate Model
```prisma
model Affiliate {
  id          String   @id @default(auto()) @map("_id") @db.ObjectId
  businessId  String   @db.ObjectId
  business    Business @relation(fields: [businessId], references: [id], onDelete: Cascade)
  
  // Affiliate Info (no login required)
  name        String   // Affiliate name (e.g., "Instagram Influencer @username")
  email       String?  // Optional email for notifications
  phone       String?  // Optional phone
  notes       String?  // Internal notes about affiliate
  
  // Commission Settings
  commissionType  AffiliateCommissionType @default(PERCENTAGE) // PERCENTAGE or FIXED
  commissionValue Float // Percentage (e.g., 10.0 for 10%) OR fixed amount (e.g., 5.00)
  
  // Tracking Code (unique identifier for UTM)
  trackingCode String @unique // e.g., "AFF001", "INSTA_JOHN"
  
  // Status
  isActive    Boolean @default(true)
  
  // Relations
  earnings    AffiliateEarning[]
  payments    AffiliatePayment[]
  orders      Order[] // Orders attributed to this affiliate
  
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  
  @@index([businessId])
  @@index([businessId, isActive])
  @@index([trackingCode])
}

enum AffiliateCommissionType {
  PERCENTAGE // Commission as % of order total
  FIXED      // Fixed amount per order
}
```

### 4. AffiliateEarning Model (Similar to DeliveryEarning)
```prisma
model AffiliateEarning {
  id         String   @id @default(auto()) @map("_id") @db.ObjectId
  businessId String   @db.ObjectId
  business   Business @relation(fields: [businessId], references: [id], onDelete: Cascade)
  
  orderId    String   @db.ObjectId
  order      Order    @relation(fields: [orderId], references: [id], onDelete: Cascade)
  
  affiliateId String   @db.ObjectId
  affiliate   Affiliate @relation(fields: [affiliateId], references: [id], onDelete: Cascade)
  
  // Commission Details
  orderTotal    Float // Order total at time of commission calculation
  commissionType AffiliateCommissionType
  commissionValue Float // % or fixed amount
  amount         Float // Calculated commission amount
  currency       String @default("EUR")
  
  // Status tracking
  status AffiliateEarningStatus @default(PENDING) // PENDING, PAID, CANCELLED
  
  // When the order was completed
  orderCompletedAt DateTime?
  
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  
  @@unique([orderId]) // One commission per order
  @@index([businessId])
  @@index([businessId, affiliateId])
  @@index([businessId, status])
  @@index([affiliateId])
}

enum AffiliateEarningStatus {
  PENDING
  PAID
  CANCELLED
}
```

### 5. AffiliatePayment Model (Similar to DeliveryPayment)
```prisma
model AffiliatePayment {
  id         String   @id @default(auto()) @map("_id") @db.ObjectId
  businessId String   @db.ObjectId
  business   Business @relation(fields: [businessId], references: [id], onDelete: Cascade)
  
  affiliateId String   @db.ObjectId
  affiliate   Affiliate @relation(fields: [affiliateId], references: [id], onDelete: Cascade)
  
  amount   Float // Amount paid to affiliate
  currency String @default("EUR")
  
  periodStart DateTime? // Start of the period this payment covers
  periodEnd   DateTime? // End of the period this payment covers
  
  paymentMethod String? // e.g., "bank_transfer", "paypal", "cash"
  reference     String? // Payment reference/invoice number
  notes         String? // Additional notes
  
  // Link to earnings that were paid
  earningsIds String[] // Array of AffiliateEarning IDs that were paid
  
  paidAt    DateTime @default(now()) // When payment was made
  createdAt DateTime @default(now())
  
  @@index([businessId])
  @@index([businessId, affiliateId])
  @@index([businessId, paidAt])
  @@index([affiliateId])
}
```

---

## API Endpoints

### 1. Affiliates Management
```
GET    /api/admin/stores/[businessId]/affiliates
POST   /api/admin/stores/[businessId]/affiliates
GET    /api/admin/stores/[businessId]/affiliates/[affiliateId]
PUT    /api/admin/stores/[businessId]/affiliates/[affiliateId]
DELETE /api/admin/stores/[businessId]/affiliates/[affiliateId]
```

### 2. Affiliate Links Generation
```
POST   /api/admin/stores/[businessId]/affiliates/[affiliateId]/generate-link
GET    /api/admin/stores/[businessId]/affiliates/[affiliateId]/links
```

### 3. Affiliate Earnings
```
GET    /api/admin/stores/[businessId]/affiliates/earnings
GET    /api/admin/stores/[businessId]/affiliates/[affiliateId]/earnings
```

### 4. Affiliate Payments
```
GET    /api/admin/stores/[businessId]/affiliates/payments
POST   /api/admin/stores/[businessId]/affiliates/payments
GET    /api/admin/stores/[businessId]/affiliates/payments/[paymentId]
```

### 5. Affiliate Dashboard/Summary
```
GET    /api/admin/stores/[businessId]/affiliates/summary
```

---

## UI Components & Pages

### 1. SuperAdmin - Business Details
**File**: `src/app/superadmin/businesses/[businessId]/page.tsx`
- Add checkbox: "Enable Affiliate System"
- Similar to `enableDeliveryManagement` and `showCostPrice`

### 2. Business Admin - Affiliates List
**File**: `src/app/admin/stores/[businessId]/affiliates/page.tsx`
**Component**: `src/components/admin/affiliates/AffiliatesList.tsx`
- List all affiliates
- Create new affiliate button
- Edit/Delete actions
- Show: Name, Email, Commission Type/Value, Tracking Code, Status, Total Earnings, Unpaid Balance

### 3. Business Admin - Create/Edit Affiliate
**File**: `src/app/admin/stores/[businessId]/affiliates/create/page.tsx`
**File**: `src/app/admin/stores/[businessId]/affiliates/[affiliateId]/edit/page.tsx`
**Component**: `src/components/admin/affiliates/AffiliateForm.tsx`
- Form fields:
  - Name (required)
  - Email (optional)
  - Phone (optional)
  - Commission Type: Dropdown (Percentage / Fixed)
  - Commission Value: Number input
  - Notes (optional)
- Auto-generate tracking code (e.g., "AFF001", "AFF002")
- Generate affiliate link button (shows modal with link)

### 4. Business Admin - Affiliate Earnings
**File**: `src/app/admin/stores/[businessId]/affiliates/earnings/page.tsx`
**Component**: `src/components/admin/affiliates/AffiliateEarnings.tsx`
- Summary cards: Total Earnings, Pending Earnings, Paid Earnings
- Earnings list with filters (affiliate, status, date range)
- Show: Order Number, Affiliate Name, Order Total, Commission Amount, Status, Order Date
- Similar to `DeliveryEarnings.tsx`

### 5. Business Admin - Affiliate Payments
**File**: `src/app/admin/stores/[businessId]/affiliates/payments/page.tsx`
**Component**: `src/components/admin/affiliates/AffiliatePayments.tsx`
- List all payments
- Create payment button
- Form: Select affiliate, Select earnings to pay (or enter amount), Payment method, Reference, Notes
- Show payment history
- Similar to `DeliveryPayments.tsx`

### 6. Business Admin - Affiliate Dashboard/Summary
**File**: `src/app/admin/stores/[businessId]/affiliates/page.tsx` (main page)
**Component**: `src/components/admin/affiliates/AffiliateDashboard.tsx`
- Summary cards: Total Affiliates, Total Commissions Paid, Pending Commissions, Total Orders from Affiliates
- Top affiliates by earnings
- Recent earnings
- Quick actions: Create Affiliate, Record Payment

### 7. Navigation Menu
**File**: `src/components/admin/layout/AdminSidebar.tsx`
- Add menu item: "Affiliates" (only if `enableAffiliateSystem` is true)
- Submenu:
  - Overview
  - Affiliates
  - Earnings
  - Payments

---

## Order Attribution Logic

### 1. Storefront - Capture UTM Parameters
**File**: `src/components/storefront/StoreFront.tsx`
- When user visits storefront with UTM params (e.g., `?utm_source=instagram&utm_campaign=AFF001`), store in localStorage
- When order is created, send `sessionId` and UTM params to order API

### 2. Order Creation - Link to Affiliate
**File**: `src/app/api/storefront/[slug]/order/route.ts`
- Extract UTM parameters from request
- Extract `sessionId` from request body (sent from frontend)
- Check if `utm_campaign` matches an affiliate `trackingCode`
- If match found, set `order.affiliateId` and store UTM params
- Store `sessionId` for linking to ProductEvent

### 3. Order Completion - Create Commission
**File**: `src/app/api/admin/stores/[businessId]/orders/[orderId]/route.ts`
- When order status changes to DELIVERED/PICKED_UP AND paymentStatus is PAID:
  - Check if `order.affiliateId` exists
  - If yes, create `AffiliateEarning`:
    - Calculate commission based on affiliate's `commissionType` and `commissionValue`
    - If PERCENTAGE: `amount = order.total * (commissionValue / 100)`
    - If FIXED: `amount = commissionValue`
    - Set status to PENDING
    - Link to order and affiliate

---

## Affiliate Link Generation

### Format
```
https://waveorder.app/[store-slug]?utm_source=affiliate&utm_campaign=[trackingCode]&utm_medium=referral
```

### Example
- Store: `naia-studio`
- Tracking Code: `AFF001`
- Generated Link: `https://waveorder.app/naia-studio?utm_source=affiliate&utm_campaign=AFF001&utm_medium=referral`

### Additional UTM Parameters (Optional)
- `utm_content`: Affiliate name or identifier
- `utm_term`: Product category or campaign name

---

## Commission Calculation Examples

### Example 1: Percentage Commission
- Affiliate: "Instagram Influencer @jewelrylover"
- Commission Type: PERCENTAGE
- Commission Value: 10.0 (10%)
- Order Total: €100.00
- **Commission Amount**: €10.00

### Example 2: Fixed Commission
- Affiliate: "Blogger - Fashion Blog"
- Commission Type: FIXED
- Commission Value: 5.00
- Order Total: €50.00
- **Commission Amount**: €5.00

---

## Payment Flow

### 1. View Unpaid Balance
- Admin goes to Affiliates → Earnings
- Filter by status: PENDING
- See total unpaid balance per affiliate

### 2. Record Payment
- Admin goes to Affiliates → Payments
- Click "Record Payment"
- Select affiliate
- Select specific earnings to pay (or enter amount manually)
- Enter payment details (method, reference, notes)
- Submit
- System marks selected earnings as PAID

---

## Implementation Checklist

### Phase 1: Database & Schema
- [ ] Add `enableAffiliateSystem` to Business model
- [ ] Add UTM fields and `sessionId` to Order model
- [ ] Create Affiliate model
- [ ] Create AffiliateEarning model
- [ ] Create AffiliatePayment model
- [ ] Create enums: `AffiliateCommissionType`, `AffiliateEarningStatus`
- [ ] Run Prisma migrations

### Phase 2: API Endpoints
- [ ] Affiliates CRUD endpoints
- [ ] Affiliate link generation endpoint
- [ ] Affiliate earnings endpoints
- [ ] Affiliate payments endpoints
- [ ] Affiliate summary/dashboard endpoint

### Phase 3: Order Attribution
- [ ] Update storefront to capture UTM params and sessionId
- [ ] Update order creation API to store UTM params and sessionId
- [ ] Update order completion logic to create AffiliateEarning
- [ ] Link orders to affiliates via UTM campaign parameter

### Phase 4: SuperAdmin UI
- [ ] Add "Enable Affiliate System" toggle to business details page

### Phase 5: Business Admin UI
- [ ] Affiliates list page
- [ ] Create/Edit affiliate form
- [ ] Affiliate earnings page
- [ ] Affiliate payments page
- [ ] Affiliate dashboard/summary page
- [ ] Add "Affiliates" to admin sidebar menu

### Phase 6: Testing
- [ ] Test affiliate creation
- [ ] Test affiliate link generation
- [ ] Test order attribution via UTM params
- [ ] Test commission calculation (percentage and fixed)
- [ ] Test commission creation on order completion
- [ ] Test payment recording
- [ ] Test balance calculations

---

## Files to Create/Modify

### New Files
```
prisma/schema.prisma (modify - add models)
src/app/api/admin/stores/[businessId]/affiliates/route.ts
src/app/api/admin/stores/[businessId]/affiliates/[affiliateId]/route.ts
src/app/api/admin/stores/[businessId]/affiliates/[affiliateId]/generate-link/route.ts
src/app/api/admin/stores/[businessId]/affiliates/earnings/route.ts
src/app/api/admin/stores/[businessId]/affiliates/payments/route.ts
src/app/api/admin/stores/[businessId]/affiliates/summary/route.ts
src/app/admin/stores/[businessId]/affiliates/page.tsx
src/app/admin/stores/[businessId]/affiliates/create/page.tsx
src/app/admin/stores/[businessId]/affiliates/[affiliateId]/edit/page.tsx
src/app/admin/stores/[businessId]/affiliates/earnings/page.tsx
src/app/admin/stores/[businessId]/affiliates/payments/page.tsx
src/components/admin/affiliates/AffiliateDashboard.tsx
src/components/admin/affiliates/AffiliatesList.tsx
src/components/admin/affiliates/AffiliateForm.tsx
src/components/admin/affiliates/AffiliateEarnings.tsx
src/components/admin/affiliates/AffiliatePayments.tsx
```

### Modified Files
```
prisma/schema.prisma (add fields to Business and Order models)
src/app/superadmin/businesses/[businessId]/page.tsx (add toggle)
src/app/api/storefront/[slug]/order/route.ts (add UTM tracking)
src/app/api/admin/stores/[businessId]/orders/[orderId]/route.ts (add commission creation)
src/components/storefront/StoreFront.tsx (capture UTM params)
src/components/admin/layout/AdminSidebar.tsx (add menu item)
```

---

## Notes & Considerations

1. **Tracking Code Uniqueness**: Ensure tracking codes are unique per business (not globally unique, but unique within business)

2. **Commission Calculation**: Commission is calculated on order total (including delivery fee, tax, etc.). Consider if commission should be on subtotal only.

3. **Order Cancellation**: If order is cancelled/refunded, should commission be cancelled? (Yes - update AffiliateEarning status to CANCELLED)

4. **Multiple Affiliates**: One order can only be attributed to one affiliate (via UTM campaign parameter). First match wins.

5. **Session Tracking**: `sessionId` links orders to ProductEvent (add_to_cart) for better conversion tracking.

6. **Privacy**: Affiliate emails/phones are optional. No login required for affiliates.

7. **Link Sharing**: Affiliates can share links on Instagram, Facebook, blogs, etc. UTM parameters will track orders back to them.

8. **Payment Frequency**: Business decides when to pay affiliates (manual process, similar to delivery payments).

---

## Future Enhancements (Not in Scope)

1. **Affiliate Portal**: Login portal for affiliates to view their earnings
2. **Automatic Payouts**: Automatic payment processing
3. **Tiered Commissions**: Different commission rates based on performance
4. **Affiliate Performance Dashboard**: For affiliates to see their stats
5. **Email Notifications**: Notify affiliates when they earn commission
6. **Multi-level Affiliates**: Referral chains
7. **Coupon Codes**: Affiliate-specific discount codes

---

## Questions for Review

1. **Commission Base**: Should commission be calculated on order total (including delivery/tax) or subtotal only?
   - **Proposal**: Order total (including delivery/tax)

2. **Tracking Code Format**: Auto-generate (AFF001, AFF002) or allow custom?
   - **Proposal**: Auto-generate, but allow edit

3. **Commission on Cancelled Orders**: Should cancelled orders still generate commission?
   - **Proposal**: No - cancel commission when order is cancelled

4. **Minimum Order Value**: Should there be a minimum order value for commission?
   - **Proposal**: No minimum (can be added later if needed)

5. **Commission on Refunded Orders**: Should refunded orders cancel commission?
   - **Proposal**: Yes - cancel commission when order is refunded

6. **UTM Parameter Priority**: If multiple UTM params exist, which takes priority?
   - **Proposal**: `utm_campaign` must match tracking code for attribution

---

**Ready for Review and Approval**
