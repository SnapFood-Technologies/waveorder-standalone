# WaveOrder - Order Workflow and Notifications

## Complete Order Workflow & Notification System

### 📦 **When a Customer Places an Order**

**Customer receives:**
- ✅ **WhatsApp Link** - A pre-formatted message link that opens WhatsApp with order details ready to send
- ❌ **Email** - Customer does NOT automatically receive email on order creation

**Business/Admin receives:**
- ✅ **Email Notification** - If email notifications are enabled in Settings → Notifications
  - Email sent to the business notification email address (or business email if not set)
  - Contains complete order details: items, customer info, delivery address, total, etc.
- ❌ **WhatsApp Message** - Not automatically sent (admin must send manually via dashboard)

---

### ✅ **When Admin Accepts/Confirms Order**

**Customer receives:**
- ✅ **Email Notification** - If:
  1. Customer has an email address on file
  2. Customer notifications are enabled in Settings → Notifications → Customer Email Notifications
  3. The specific status notification is enabled (e.g., "Notify on Confirmed" for that order type)

**Business/Admin receives:**
- ✅ **WhatsApp Modal Option** - Admin sees a modal to manually send WhatsApp update to customer (optional)
- ❌ **Email** - Business does NOT receive email on status changes (only on new orders)

---

### 🍳 **When Admin Marks Order as Preparing**

**Customer receives:**
- ✅ **Email Notification** - If enabled for "Preparing" status in customer notification settings

**Business/Admin receives:**
- ✅ **WhatsApp Modal Option** - Can manually send WhatsApp update

---

### 📦 **When Admin Marks Order as Ready (Pickup/Dine-in)**

**Customer receives:**
- ✅ **Email Notification** - If enabled for "Ready" status (by default: enabled for Pickup and Dine-in orders)

**Business/Admin receives:**
- ✅ **WhatsApp Modal Option** - Can manually send WhatsApp update

---

### 🚚 **When Admin Marks Order as Out for Delivery**

**Customer receives:**
- ✅ **Email Notification** - If enabled for "Out for Delivery" status (by default: enabled, only applies to DELIVERY orders)

**Business/Admin receives:**
- ✅ **WhatsApp Modal Option** - Can manually send WhatsApp update

---

### ✅ **When Admin Marks Order as Delivered/Fulfilled**

**Customer receives:**
- ✅ **Email Notification** - If enabled for "Delivered" status (by default: enabled for all order types)

**Business/Admin receives:**
- ✅ **WhatsApp Modal Option** - Can manually send WhatsApp update

---

### ❌ **When Admin Cancels or Rejects Order**

**Customer receives:**
- ✅ **Email Notification** - If:
  1. Customer has an email address on file
  2. Customer notifications are enabled
  3. "Notify on Cancelled" is enabled (by default: enabled for all order types)

**Business/Admin receives:**
- ❌ **WhatsApp Modal** - NOT shown for cancelled orders (cancellation requires reason)
- ❌ **Email** - Business does NOT receive email on cancellation

---

## ⚙️ **Notification Settings (Admin Control)**

Businesses can configure notifications in **Settings → Notifications**:

1. **Business Email Notifications:**
   - Enable/disable email notifications for new orders
   - Set notification email address
   - Option to notify when admin creates orders

2. **Customer Email Notifications:**
   - Enable/disable customer email notifications globally
   - Configure per-order-type settings (DELIVERY, PICKUP, DINE_IN):
     - Confirmed
     - Preparing
     - Ready (Pickup/Dine-in only)
     - Out for Delivery (Delivery only)
     - Delivered
     - Cancelled (applies to all types)

---

## 📋 **Summary Table**

| Action | Customer Email | Business Email | Customer WhatsApp | Admin WhatsApp Option |
|--------|---------------|----------------|-------------------|----------------------|
| **New Order** | ❌ No | ✅ Yes (if enabled) | ✅ Link provided | ❌ No |
| **Confirmed** | ✅ Yes* | ❌ No | ❌ No | ✅ Yes (manual) |
| **Preparing** | ✅ Yes* | ❌ No | ❌ No | ✅ Yes (manual) |
| **Ready** | ✅ Yes* | ❌ No | ❌ No | ✅ Yes (manual) |
| **Out for Delivery** | ✅ Yes* | ❌ No | ❌ No | ✅ Yes (manual) |
| **Delivered** | ✅ Yes* | ❌ No | ❌ No | ✅ Yes (manual) |
| **Cancelled** | ✅ Yes* | ❌ No | ❌ No | ❌ No |

*Customer email only sent if:
- Customer has email address on file
- Customer notifications are enabled in settings
- The specific status notification is enabled for that order type

---

## 💡 **Example Workflow: In-Store Pickup Order**

1. **Customer places order** → Business receives email, Customer gets WhatsApp link
2. **Admin confirms order** → Customer receives email (if enabled for "Confirmed")
3. **Admin marks as preparing** → Customer receives email (if enabled for "Preparing")
4. **Admin marks as ready** → Customer receives email (if enabled for "Ready" - default: ON)
5. **Admin marks as delivered** → Customer receives email (if enabled for "Delivered" - default: ON for Pickup)

**Note:** At each status change, admin can also manually send WhatsApp update via the modal that appears.

---

## 📧 **Email vs WhatsApp**

- **Email**: Automatic (when enabled in settings)
- **WhatsApp**: 
  - For customers: Link provided at order creation (customer sends to business)
  - For business: Manual option after each status change (admin can customize message)

---

## 🔧 **Settings Location**

Navigate to: **Settings → Notifications**

Configure:
- Business notification email
- Customer notification preferences (per order type and status)

---

## 📝 **Answer for Customer Questions**

**Q: "Can you tell me the workflow you use in your app? For example: A customer places an order for in-store pickup --- Both the customer and I receive an email and a WhatsApp message. If I cancel or reject the order, do we get a notification? If I accept it and mark it as fulfilled, do we also get it?"**

**A:** 

When a customer places an order:
- **You (Business)**: Receive an email notification with complete order details (if email notifications are enabled in Settings)
- **Customer**: Receives a WhatsApp link to send you the order details directly via WhatsApp

When you accept/confirm an order:
- **Customer**: Receives an email notification (if customer has email and notifications are enabled for "Confirmed" status)
- **You**: Can manually send a WhatsApp update to the customer via the modal that appears

When you mark as fulfilled (Ready/Delivered):
- **Customer**: Receives an email notification (if enabled for "Ready"/"Delivered" status - these are enabled by default)
- **You**: Can manually send a WhatsApp update

When you cancel or reject:
- **Customer**: Receives an email notification (if enabled for "Cancelled" status - enabled by default)
- **You**: Do not receive an automatic notification, but the order is recorded in your dashboard

All email notifications are configurable per order type (Delivery, Pickup, Dine-in) in **Settings → Notifications → Customer Email Notifications**.

