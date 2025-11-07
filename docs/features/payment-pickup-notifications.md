# Payment & Pickup Notifications Feature

## Overview

This feature adds automatic email notifications for payment status changes and pickup order completion. It helps businesses keep customers informed about payment receipt and order pickup status, improving customer communication and satisfaction.

## Features

### 1. Payment Received Notification

Sends an email to the customer when payment status changes from any status to **PAID**.

**Trigger:**
- Payment status changes to `PAID`
- Customer has an email address
- Customer notifications are enabled globally
- `notifyCustomerOnPaymentReceived` setting is enabled (default: true)

**Email Content:**
- Subject: "Order [ORDER_NUMBER] Update - [BUSINESS_NAME]"
- Status: `PAYMENT_RECEIVED`
- Message: "We have received your payment. Thank you!"
- Includes order details, items, and total

### 2. Picked Up & Paid Notification

Sends an email to the customer when a pickup order is both **READY** (or **DELIVERED**) and payment is **PAID**.

**Trigger:**
- Order type is `PICKUP`
- Order status is `READY` or `DELIVERED`
- Payment status is `PAID`
- Payment was just marked as PAID OR status was just changed to READY/DELIVERED (with payment already PAID)
- Customer has an email address
- Customer notifications are enabled globally
- `notifyCustomerOnPickedUpAndPaid` setting is enabled (default: true)

**Email Content:**
- Subject: "Order [ORDER_NUMBER] Update - [BUSINESS_NAME]"
- Status: `PICKED_UP_AND_PAID`
- Message: "Your order has been picked up and payment received. Thank you for your order!"
- Includes order details, items, and total

## Configuration

### Notification Settings

Navigate to **Settings → Order Notifications**

**Payment & Pickup Notifications Section:**
- **Payment Received** - Notify customer when payment status is marked as PAID
- **Picked Up & Paid (Pickup Orders)** - Notify customer when pickup order is READY/DELIVERED and payment is PAID

Both settings default to **enabled (true)**.

### Database Schema

```prisma
model Business {
  notifyCustomerOnPaymentReceived Boolean @default(true)
  notifyCustomerOnPickedUpAndPaid Boolean @default(true)
}
```

## Workflow Examples

### Example 1: Pickup Order - Payment First

1. Customer places order → `PENDING` / `PENDING`
   - Business receives notification (if enabled)
   
2. Admin confirms order → `CONFIRMED` / `PENDING`
   - Customer receives "Order Confirmed" email (if enabled)
   
3. Admin marks ready → `READY` / `PENDING`
   - Customer receives "Order Ready" email (if enabled)
   
4. Customer picks up and pays → Admin marks payment as `PAID`
   - **Payment Received** email sent ✅
   - **Picked Up & Paid** email sent ✅ (because order is READY and payment is now PAID)
   
5. Admin marks delivered → `DELIVERED` / `PAID`
   - Customer receives "Order Delivered" email (if enabled)

### Example 2: Pickup Order - Status First

1. Customer places order → `PENDING` / `PENDING`
2. Admin confirms → `CONFIRMED` / `PENDING`
3. Admin marks ready → `READY` / `PENDING`
   - Customer receives "Order Ready" email
4. Admin marks payment as `PAID` → `READY` / `PAID`
   - **Payment Received** email sent ✅
   - **Picked Up & Paid** email sent ✅ (because order is READY and payment is now PAID)

### Example 3: Pickup Order - Payment Already PAID

1. Order is `READY` / `PAID` (payment was marked earlier)
2. Admin marks as `DELIVERED` → `DELIVERED` / `PAID`
   - **Picked Up & Paid** email sent ✅ (because status changed to DELIVERED and payment is already PAID)

## Implementation Details

### API Endpoint

**File:** `src/app/api/admin/stores/[businessId]/orders/[orderId]/route.ts`

**Payment Received Notification:**
```typescript
if (body.paymentStatus === 'PAID' && 
    existingOrder.paymentStatus !== 'PAID' && 
    updatedOrder.customer.email &&
    updatedOrder.business.customerNotificationEnabled &&
    updatedOrder.business.notifyCustomerOnPaymentReceived !== false) {
  // Send payment received email
}
```

**Picked Up & Paid Notification:**
```typescript
if (updatedOrder.type === 'PICKUP' &&
    updatedOrder.paymentStatus === 'PAID' &&
    (updatedOrder.status === 'READY' || updatedOrder.status === 'DELIVERED') &&
    updatedOrder.customer.email &&
    updatedOrder.business.customerNotificationEnabled &&
    updatedOrder.business.notifyCustomerOnPickedUpAndPaid !== false) {
  
  const paymentJustPaid = body.paymentStatus === 'PAID' && existingOrder.paymentStatus !== 'PAID'
  const statusJustChanged = body.status && 
                            body.status !== existingOrder.status &&
                            (body.status === 'READY' || body.status === 'DELIVERED') &&
                            existingOrder.paymentStatus === 'PAID' &&
                            existingOrder.status !== 'READY' &&
                            existingOrder.status !== 'DELIVERED'
  
  if (paymentJustPaid || statusJustChanged) {
    // Send picked up & paid email
  }
}
```

### Email Notification Service

**File:** `src/lib/customer-email-notification.ts`

**New Status Types:**
- `PAYMENT_RECEIVED` - Payment received notification
- `PICKED_UP_AND_PAID` - Pickup order completed notification

**Status Messages:**
```typescript
case 'PAYMENT_RECEIVED':
  return 'We have received your payment. Thank you!'
  
case 'PICKED_UP_AND_PAID':
  return 'Your order has been picked up and payment received. Thank you for your order!'
```

**Email Styling:**
- `PAYMENT_RECEIVED`: Green theme (payment success)
- `PICKED_UP_AND_PAID`: Green theme (completion success)
- Icons: 💳 for payment, ✅ for completion

## Notification Settings UI

**File:** `src/components/admin/settings/OrderNotificationSettings.tsx`

**New Section:**
- "Payment & Pickup Notifications"
- Two checkboxes with descriptions
- Located after "All Order Types" section
- Styled with green theme to indicate success/completion notifications

## Order Workflow

### Complete Pickup Order Flow

```
1. PENDING / PENDING
   ↓ (Admin confirms)
2. CONFIRMED / PENDING
   ↓ (Admin marks ready)
3. READY / PENDING
   ↓ (Customer picks up, Admin marks payment)
4. READY / PAID
   → Payment Received email ✅
   → Picked Up & Paid email ✅
   ↓ (Admin marks delivered - optional)
5. DELIVERED / PAID
```

### Important Notes

- **Payment Received** notification sends for ALL order types (Delivery, Pickup, Dine-in)
- **Picked Up & Paid** notification only sends for **PICKUP** orders
- Notifications only send if customer has an email address
- Notifications respect global customer notification settings
- Each notification can be individually enabled/disabled

## Testing

### Test Scenarios

1. **Payment Received:**
   - Create order with customer email
   - Mark payment as PAID
   - Verify "Payment Received" email sent
   - Check email content and styling

2. **Picked Up & Paid (Payment First):**
   - Create PICKUP order
   - Mark as READY
   - Mark payment as PAID
   - Verify both "Payment Received" and "Picked Up & Paid" emails sent

3. **Picked Up & Paid (Status First):**
   - Create PICKUP order
   - Mark payment as PAID first
   - Mark as READY
   - Verify "Picked Up & Paid" email sent

4. **Settings Disabled:**
   - Disable "Payment Received" notification
   - Mark payment as PAID
   - Verify no email sent

5. **No Email Address:**
   - Create order without customer email
   - Mark payment as PAID
   - Verify no email sent (graceful handling)

## API Endpoints

### Get Notification Settings
```
GET /api/admin/stores/[businessId]/settings/notifications
```
Returns: `notifyCustomerOnPaymentReceived`, `notifyCustomerOnPickedUpAndPaid`

### Update Notification Settings
```
PUT /api/admin/stores/[businessId]/settings/notifications
```
Body: `{ notifyCustomerOnPaymentReceived: true, notifyCustomerOnPickedUpAndPaid: true }`

### Update Order (Triggers Notifications)
```
PUT /api/admin/stores/[businessId]/orders/[orderId]
```
Body: `{ paymentStatus: "PAID" }` or `{ status: "READY" }`

## Troubleshooting

### Notifications Not Sending

1. Check customer has email address
2. Verify `customerNotificationEnabled` is `true`
3. Check specific notification setting is enabled
4. Verify payment/status actually changed (not already in that state)
5. Check email service (Resend) is configured
6. Review server logs for errors

### Duplicate Notifications

- System prevents duplicates by checking:
  - Payment status actually changed (not already PAID)
  - Status actually changed (not already READY/DELIVERED)
  - Only sends when transition occurs

### Email Delivery Issues

- Check Resend API key is configured
- Verify email address format is valid
- Check spam folder
- Review Resend dashboard for delivery status

## Related Features

- **Order Status Notifications** - Existing feature for order status updates
- **Customer Email Notifications** - Global notification settings
- **WhatsApp Messages** - Manual WhatsApp message sending from order details

## Future Enhancements

- SMS notifications for payment received
- Push notifications (if mobile app added)
- Custom email templates per notification type
- Notification preferences per customer
- Batch notification sending for multiple orders

