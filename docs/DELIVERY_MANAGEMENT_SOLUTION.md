# Delivery Management & Manual Team Creation - Complete Solution

**Status**: 📋 PROPOSAL - Awaiting Review  
**Date**: February 6, 2026  
**Lead Engineer**: Griseld

---

## Overview

This document outlines the complete solution for two major features:

1. **Manual Team Member Creation** - Allow admins to create team members manually without email invitations, with credentials they can share
2. **Delivery Management System** - Track delivery assignments, earnings, and payments for delivery staff

Both features will be controlled by SuperAdmin toggle settings, similar to the existing "Cost & Margins" feature.

---

## Table of Contents

1. [Feature Flags & Settings](#feature-flags--settings)
2. [Database Schema Changes](#database-schema-changes)
3. [Manual Team Creation Feature](#manual-team-creation-feature)
4. [Delivery Management Feature](#delivery-management-feature)
5. [SuperAdmin Controls](#superadmin-controls)
6. [API Endpoints](#api-endpoints)
7. [UI Components](#ui-components)
8. [User Flows](#user-flows)
9. [Implementation Checklist](#implementation-checklist)

---

## Feature Flags & Settings

### Business Model Fields

Add two new boolean fields to the `Business` model:

```prisma
model Business {
  // ... existing fields
  
  // Feature flags (controlled by SuperAdmin)
  enableManualTeamCreation Boolean @default(false) // Enable manual team member creation
  enableDeliveryManagement Boolean @default(false)  // Enable delivery tracking & payments
}
```

### Settings Behavior

- **Default**: Both features disabled (`false`)
- **Control**: SuperAdmin can enable/disable per business from Business Details page
- **API Checks**: All related APIs must check these flags before allowing operations
- **UI Visibility**: Admin UI should hide features when disabled

---

## Database Schema Changes

### 1. BusinessRole Enum

```prisma
enum BusinessRole {
  OWNER
  MANAGER
  STAFF
  DELIVERY  // NEW: For delivery staff
}
```

### 2. Order Model

```prisma
model Order {
  // ... existing fields
  
  // Delivery assignment
  deliveryPersonId String? @db.ObjectId
  deliveryPerson   User?   @relation("DeliveryOrders", fields: [deliveryPersonId], references: [id])
  
  deliveryEarning DeliveryEarning? // One earning per order
}
```

### 3. User Model

```prisma
model User {
  // ... existing fields
  
  // Delivery orders assigned to this user
  deliveryOrders Order[] @relation("DeliveryOrders")
  
  // Delivery earnings and payments
  deliveryEarnings DeliveryEarning[]
  deliveryPayments DeliveryPayment[]
}
```

### 4. Business Model

```prisma
model Business {
  // ... existing fields
  
  // Feature flags
  enableManualTeamCreation Boolean @default(false)
  enableDeliveryManagement Boolean @default(false)
  
  // Delivery Earnings & Payments
  deliveryEarnings DeliveryEarning[]
  deliveryPayments DeliveryPayment[]
}
```

### 5. DeliveryEarning Model (NEW)

```prisma
model DeliveryEarning {
  id         String   @id @default(auto()) @map("_id") @db.ObjectId
  businessId String   @db.ObjectId
  business   Business @relation(fields: [businessId], references: [id], onDelete: Cascade)

  orderId        String   @db.ObjectId
  order          Order    @relation(fields: [orderId], references: [id], onDelete: Cascade)
  
  deliveryPersonId String   @db.ObjectId
  deliveryPerson   User     @relation(fields: [deliveryPersonId], references: [id], onDelete: Cascade)

  amount   Float // Delivery fee earned
  currency String @default("EUR")

  // Status tracking
  status DeliveryEarningStatus @default(PENDING) // PENDING, PAID, CANCELLED

  // When the order was delivered
  deliveredAt DateTime?

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@unique([orderId]) // One earning per order
  @@index([businessId])
  @@index([businessId, deliveryPersonId])
  @@index([businessId, status])
  @@index([deliveryPersonId])
}

enum DeliveryEarningStatus {
  PENDING
  PAID
  CANCELLED
}
```

### 6. DeliveryPayment Model (NEW)

```prisma
model DeliveryPayment {
  id         String   @id @default(auto()) @map("_id") @db.ObjectId
  businessId String   @db.ObjectId
  business   Business @relation(fields: [businessId], references: [id], onDelete: Cascade)

  deliveryPersonId String   @db.ObjectId
  deliveryPerson   User     @relation(fields: [deliveryPersonId], references: [id], onDelete: Cascade)

  amount   Float // Amount paid to delivery person
  currency String @default("EUR") // Currency of payment

  periodStart DateTime? // Start of the period this payment covers
  periodEnd   DateTime? // End of the period this payment covers

  paymentMethod String? // e.g., "bank_transfer", "cash", "card"
  reference     String? // Payment reference/invoice number
  notes         String? // Additional notes

  // Link to earnings that were paid
  earningsIds String[] // Array of DeliveryEarning IDs that were paid

  paidAt    DateTime @default(now()) // When payment was made
  createdAt DateTime @default(now())

  @@index([businessId])
  @@index([businessId, deliveryPersonId])
  @@index([businessId, paidAt])
  @@index([deliveryPersonId])
}
```

---

## Manual Team Creation Feature

### Purpose

Allow business owners/managers to create team members manually without sending email invitations. Admin receives credentials to share with the new member.

### Requirements

1. **Feature Flag Check**: Only works if `enableManualTeamCreation` is `true`
2. **UI Location**: Team Management page - "Create Manually" button (alongside "Invite via Email")
3. **Form Fields**:
   - Name (required)
   - Email (required, validated)
   - Phone (optional)
   - Role (MANAGER, STAFF, or DELIVERY)
4. **Password Generation**: System generates secure random password
5. **Credentials Display**: After creation, show email + password for admin to copy/share
6. **User Account**: Creates full User account with hashed password
7. **BusinessUser**: Creates BusinessUser relationship with selected role

### User Flow

```
Admin clicks "Create Manually"
  ↓
Modal opens with form
  ↓
Admin fills: Name, Email, Phone (optional), Role
  ↓
Admin clicks "Create Member"
  ↓
API creates User account + BusinessUser
  ↓
System generates password
  ↓
Modal shows credentials (Email + Password)
  ↓
Admin copies credentials to share with member
  ↓
Member can login immediately with provided credentials
```

### API Endpoint

**POST** `/api/admin/stores/[businessId]/team/members/create`

**Request Body**:
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "phone": "+1234567890", // optional
  "role": "DELIVERY" // MANAGER, STAFF, or DELIVERY
}
```

**Response**:
```json
{
  "success": true,
  "member": {
    "id": "...",
    "userId": "...",
    "name": "John Doe",
    "email": "john@example.com",
    "role": "DELIVERY"
  },
  "credentials": {
    "email": "john@example.com",
    "password": "aB3$kL9mN2pQ" // Generated password
  },
  "message": "Team member created successfully"
}
```

**Validation**:
- Check `enableManualTeamCreation` flag
- Check team member limits (plan-based)
- Validate email format
- Check if user already exists (if exists, add to business; if not, create new)
- Validate role (MANAGER, STAFF, DELIVERY)

---

## Delivery Management Feature

### Purpose

Track delivery assignments, calculate earnings from delivery fees, and manage payments to delivery staff.

### Requirements

1. **Feature Flag Check**: Only works if `enableDeliveryManagement` is `true`
2. **Order Assignment**: Assign delivery person to DELIVERY orders
3. **Earnings Tracking**: Automatically create DeliveryEarning when order is delivered
4. **Earnings Summary**: View earnings by delivery person, status, date range
5. **Payment Collection**: Record payments to delivery persons and mark earnings as PAID
6. **Settings Page**: Admin can view/manage delivery settings

### Components

#### 1. Order Assignment

- **Location**: Order Details page
- **UI**: Dropdown to select delivery person (filtered to DELIVERY role)
- **Action**: Assign/unassign delivery person
- **Auto-Creation**: When order status changes to DELIVERED, create DeliveryEarning if deliveryPersonId exists

#### 2. Delivery Earnings Dashboard

- **Location**: Admin panel → Delivery → Earnings
- **Features**:
  - Summary cards: Total Earnings, Pending Earnings, Paid Earnings
  - Earnings list with filters (person, status, date range)
  - Earnings breakdown by delivery person
  - Export functionality

#### 3. Delivery Payments

- **Location**: Admin panel → Delivery → Payments
- **Features**:
  - List all payments made to delivery persons
  - Create new payment
  - Link payments to specific earnings
  - Payment history by delivery person

#### 4. Delivery Settings

- **Location**: Admin panel → Settings → Delivery
- **Features**:
  - View delivery management status (enabled/disabled by SuperAdmin)
  - List delivery persons
  - View delivery statistics

### User Flows

#### Assigning Delivery Person

```
Admin opens Order Details
  ↓
Order type is DELIVERY
  ↓
Admin clicks "Assign Delivery Person"
  ↓
Dropdown shows available delivery persons (DELIVERY role)
  ↓
Admin selects delivery person
  ↓
API assigns deliveryPersonId to order
  ↓
API creates DeliveryEarning (status: PENDING)
  ↓
Order shows assigned delivery person
```

#### Order Delivered → Earnings Created

```
Order status changes to DELIVERED
  ↓
System checks if deliveryPersonId exists
  ↓
If yes, create/update DeliveryEarning:
  - amount = order.deliveryFee
  - status = PENDING
  - deliveredAt = now()
  ↓
Earning appears in Delivery Earnings dashboard
```

#### Paying Delivery Person

```
Admin goes to Delivery → Payments
  ↓
Admin clicks "Record Payment"
  ↓
Admin selects delivery person
  ↓
Admin selects earnings to pay (or enters amount manually)
  ↓
Admin enters payment details (method, reference, notes)
  ↓
API creates DeliveryPayment
  ↓
API marks selected earnings as PAID
  ↓
Payment appears in payment history
```

---

## SuperAdmin Controls

### Business Details Page

**Location**: `/superadmin/businesses/[businessId]`

Add two toggle switches in the settings section (similar to Cost & Margins):

```tsx
<FeatureToggle
  label="Manual Team Creation"
  description="Allow business to create team members manually with credentials"
  enabled={business.enableManualTeamCreation}
  onChange={handleToggleManualTeamCreation}
/>

<FeatureToggle
  label="Delivery Management"
  description="Enable delivery tracking, earnings, and payment management"
  enabled={business.enableDeliveryManagement}
  onChange={handleToggleDeliveryManagement}
/>
```

### API Endpoint

**PATCH** `/api/superadmin/businesses/[businessId]/settings`

**Request Body**:
```json
{
  "enableManualTeamCreation": true,
  "enableDeliveryManagement": true
}
```

---

## API Endpoints

### Manual Team Creation

1. **POST** `/api/admin/stores/[businessId]/team/members/create`
   - Creates team member manually
   - Checks `enableManualTeamCreation` flag
   - Returns credentials

### Delivery Management

1. **PATCH** `/api/admin/stores/[businessId]/orders/[orderId]/assign-delivery`
   - Assign/unassign delivery person to order
   - Checks `enableDeliveryManagement` flag
   - Creates/updates DeliveryEarning

2. **GET** `/api/admin/stores/[businessId]/delivery/earnings`
   - List delivery earnings
   - Filters: deliveryPersonId, status, date range
   - Returns summary stats

3. **POST** `/api/admin/stores/[businessId]/delivery/payments`
   - Create payment to delivery person
   - Mark earnings as PAID
   - Checks `enableDeliveryManagement` flag

4. **GET** `/api/admin/stores/[businessId]/delivery/payments`
   - List all payments
   - Filters: deliveryPersonId, date range

5. **PUT** `/api/admin/stores/[businessId]/orders/[orderId]`
   - Updated to auto-create DeliveryEarning when status = DELIVERED
   - Checks `enableDeliveryManagement` flag

### SuperAdmin

1. **PATCH** `/api/superadmin/businesses/[businessId]/settings`
   - Update feature flags
   - Requires SuperAdmin role

---

## UI Components

### Admin Panel

1. **TeamManagement.tsx** (Updated)
   - Add "Create Manually" button
   - Show button only if `enableManualTeamCreation` is enabled

2. **CreateMemberModal.tsx** (New)
   - Form: Name, Email, Phone, Role
   - Display credentials after creation
   - Copy to clipboard functionality

3. **OrderDetails.tsx** (Updated)
   - Add delivery person assignment dropdown
   - Show assigned delivery person
   - Only for DELIVERY orders
   - Only if `enableDeliveryManagement` is enabled

4. **DeliveryEarnings.tsx** (New)
   - Summary cards
   - Earnings list with filters
   - Earnings by person breakdown

5. **DeliveryPayments.tsx** (New)
   - Payment list
   - Create payment form
   - Link to earnings

6. **DeliverySettings.tsx** (New)
   - View feature status
   - List delivery persons
   - Statistics

### SuperAdmin Panel

1. **BusinessDetails.tsx** (Updated)
   - Add feature toggle switches
   - Similar to Cost & Margins toggle

---

## Permissions

### DELIVERY Role Permissions

- ✅ View orders (assigned deliveries)
- ✅ Manage orders (update delivery status)
- ❌ Manage products
- ❌ Manage inventory
- ❌ Manage settings
- ❌ View analytics
- ❌ Invite team members

### Role Hierarchy

```
OWNER (4) > MANAGER (3) > STAFF (2) > DELIVERY (1)
```

---

## Implementation Checklist

### Phase 1: Database & Schema ✅
- [x] Add DELIVERY to BusinessRole enum
- [x] Add deliveryPersonId to Order model
- [x] Create DeliveryEarning model
- [x] Create DeliveryPayment model
- [x] Add feature flags to Business model
- [x] Add relations to User and Business models

### Phase 2: Permissions & Roles ✅
- [x] Update permissions.ts with DELIVERY role
- [x] Add DELIVERY to role display functions
- [x] Define DELIVERY role permissions

### Phase 3: Manual Team Creation APIs ✅
- [x] Create POST `/api/admin/stores/[businessId]/team/members/create`
- [x] Add feature flag check
- [x] Password generation logic
- [x] Credentials return

### Phase 4: Manual Team Creation UI ✅
- [x] Create CreateMemberModal component
- [x] Update TeamManagement with "Create Manually" button
- [x] Add credentials display with copy functionality

### Phase 5: Delivery Management APIs ✅
- [x] Create PATCH `/api/admin/stores/[businessId]/orders/[orderId]/assign-delivery`
- [x] Create GET `/api/admin/stores/[businessId]/delivery/earnings`
- [x] Create GET/POST `/api/admin/stores/[businessId]/delivery/payments`
- [x] Update PUT `/api/admin/stores/[businessId]/orders/[orderId]` for auto-earnings
- [x] Add feature flag checks to all APIs

### Phase 6: SuperAdmin Controls ⏳
- [ ] Add feature flags to Business Details page
- [ ] Create PATCH `/api/superadmin/businesses/[businessId]/settings`
- [ ] Add toggle switches UI

### Phase 7: Delivery Management UI ⏳
- [ ] Update OrderDetails to show/assign delivery person
- [ ] Create DeliveryEarnings component/page
- [ ] Create DeliveryPayments component/page
- [ ] Create DeliverySettings component/page
- [ ] Add navigation menu items

### Phase 8: Testing & Polish ⏳
- [ ] Test manual member creation flow
- [ ] Test delivery assignment flow
- [ ] Test earnings creation on order delivery
- [ ] Test payment recording
- [ ] Test feature flag toggles
- [ ] Test permissions for DELIVERY role
- [ ] Update documentation

---

## Security Considerations

1. **Password Generation**: Use cryptographically secure random generation
2. **Feature Flags**: Always check flags in APIs, not just UI
3. **Role Validation**: Verify DELIVERY role before assignment
4. **Business Access**: All APIs must verify business access
5. **Earnings Integrity**: Prevent duplicate earnings per order
6. **Payment Validation**: Verify earnings belong to delivery person before marking as PAID

---

## Future Enhancements

1. **Delivery Person Availability**: Track working hours/availability
2. **Delivery Routes**: Optimize delivery routes for multiple orders
3. **Real-time Tracking**: GPS tracking for delivery persons
4. **Delivery Analytics**: Performance metrics, delivery times
5. **Automated Payments**: Schedule automatic payments based on rules
6. **Delivery Person App**: Mobile app for delivery persons to view assignments

---

## Questions for Review

1. Should manual team creation require email verification?
2. Should delivery persons be able to see their own earnings?
3. Should there be a minimum delivery fee threshold for earnings?
4. Should payments be linked to specific earnings or just amounts?
5. Should delivery persons receive notifications when assigned?
6. Should there be delivery zones/territories for assignment?

---

**End of Document**
