# Salon Plan Features - Admin Access by Plan

**Status:** ✅ COMPLETE  
**Last Updated:** February 12, 2026  
**Lead Engineer:** Griseld

This document defines what admin features and pages are available for **SALON** businesses based on their subscription plan (STARTER, PRO, BUSINESS).

---

## ✅ IMPLEMENTATION COMPLETE

All plan-based feature restrictions have been successfully implemented and tested.

## 🔑 Key Points

**Team Members System:**
- ✅ **Same system as other business types** (restaurants/retail)
- ✅ **BUSINESS plan only** - Up to 5 team members
- ✅ **Same roles** - OWNER, MANAGER, STAFF (same permissions)
- ✅ **Same invitation workflow** - Email invitations, accept via link
- ✅ **Subscription inheritance** - Team members inherit BUSINESS plan from Business model

**Salon-Specific Features (Additional):**
- ✅ **Staff Assignment** (PRO+) - Assign team members to services/appointments
- ✅ **Staff Availability** (BUSINESS only) - Set working hours/availability for team members

**Important:** Team members work exactly the same way for salons as for restaurants/retail. The only difference is that salons can ALSO assign those team members to services/appointments and manage their availability.

---

## 📋 Plan Overview

| Plan | Price | Key Focus |
|------|-------|-----------|
| **STARTER** | $19/month | Basic salon operations |
| **PRO** | $39/month | Advanced scheduling & insights |
| **BUSINESS** | $79/month | Team collaboration & enterprise features |

---

## ✅ STARTER Plan ($19/month) - Salon Features

### Core Features (Always Available)
- ✅ **Services Management**
  - Up to **50 services**
  - Service categories (up to 15)
  - Basic service info (name, description, price, duration, images)
  - Service add-ons/modifiers
  - Service status (active/inactive, featured)

- ✅ **Appointments Management**
  - View all appointments
  - Create appointments manually
  - Update appointment status
  - View appointment details
  - Basic appointment filters (status, date, customer)

- ✅ **Customers**
  - View customer list
  - Customer details & history
  - Customer contact info

- ✅ **Dashboard**
  - Basic appointment overview
  - Recent appointments
  - Appointment stats (today, this week)

- ✅ **Appearance**
  - Storefront customization
  - Colors, fonts, logo
  - Service display settings

- ✅ **Marketing**
  - WhatsApp message templates
  - Basic marketing tools

- ✅ **Settings**
  - Business profile
  - Billing & subscription
  - Order/appointment notifications
  - Basic configurations

- ✅ **Help & Support**
  - Help center
  - Support tickets
  - Support messages

### Limitations
- ❌ **No Calendar View** - List view only
- ❌ **No Staff Assignment** - Cannot assign staff to services/appointments
- ❌ **No Staff Availability** - Cannot set staff schedules
- ❌ **No Advanced Analytics** - Basic stats only
- ❌ **No Team Management** - Single user only
- ❌ **No Custom Domain** - waveorder.app subdomain only
- ❌ **No API Access** - No programmatic access
- ❌ **No Discounts** - Cannot create discount codes
- ❌ **No Inventory Management** - Not applicable for services

---

## 🚀 PRO Plan ($39/month) - Salon Features

### Everything in STARTER, Plus:

- ✅ **Services Management**
  - **Unlimited services**
  - **Unlimited categories**
  - All STARTER features

- ✅ **Appointments Management**
  - **Calendar View** - Daily/weekly/monthly calendar
  - **Advanced Filters** - Staff, date range, status
  - **Bulk Actions** - Update multiple appointments
  - **Appointment Reminders** - Automated notifications

- ✅ **Staff Assignment** (Basic)
  - **Assign Team Members to Services** - Link team members (from Team Management) to specific services
  - **Assign Team Members to Appointments** - Assign team members when booking appointments
  - **View Staff Schedule** - See which team member is assigned to each appointment
  - **Note**: Requires team members to be added first (BUSINESS plan only). On PRO plan, you can assign staff IF team members exist, but cannot add new team members.

- ✅ **Advanced Analytics**
  - Appointment trends & insights
  - Service performance metrics
  - Customer insights
  - Revenue analytics
  - Peak hours analysis

- ✅ **Discounts**
  - Create discount codes
  - Service-specific discounts
  - Time-based promotions

- ✅ **Priority Support**
  - Faster response times
  - Priority ticket handling

### Still Not Available
- ❌ **No Staff Availability Management** - Cannot set working hours/availability
- ❌ **No Team Access** - Single user account only
- ❌ **No Custom Domain** - waveorder.app subdomain only
- ❌ **No API Access** - No programmatic access

---

## 💼 BUSINESS Plan ($79/month) - Salon Features

### Everything in PRO, Plus:

- ✅ **Team Management** (Same as Other Business Types)
  - **Up to 5 team members** - Same limit as restaurants/retail
  - **Role-based access** - OWNER, MANAGER, STAFF roles (same permissions as other business types)
  - **Same invitation workflow** - Invite via email, accept invitation
  - **Same permissions**:
    - OWNER: Full access, billing, team management
    - MANAGER: Manage services/appointments, invite staff
    - STAFF: View/manage appointments, view customers (no services, no settings)
  - **Subscription inheritance** - Team members inherit BUSINESS plan from Business (not individual users)
  - **Note**: This is the SAME team member system used by restaurants/retail businesses

- ✅ **Staff Assignment** (Enhanced)
  - **Assign Team Members to Services** - Link team members to specific services
  - **Assign Team Members to Appointments** - Assign team members when booking
  - **View Staff Schedule** - See which team member is assigned
  - **Note**: Uses the same team members from Team Management above

- ✅ **Staff Availability Management** (Salon-Specific Feature)
  - **Set Staff Working Hours** - Define when each team member is available
  - **Staff Availability Calendar** - Visual schedule management
  - **Time Off Management** - Block unavailable dates/times for team members
  - **Auto-Assignment** - System suggests team members based on availability
  - **Note**: This is a SALON-SPECIFIC feature that works with Team Management

- ✅ **Custom Domain**
  - Connect custom domain (e.g., `book.yoursalon.com`)
  - SSL certificate auto-provisioning
  - Branded booking experience

- ✅ **API Access**
  - REST API for services (CRUD)
  - REST API for appointments (Read/Create/Update)
  - API key management
  - Rate limiting
  - Integration capabilities

- ✅ **Unlimited Stores/Catalogs**
  - Multi-location support
  - Separate service catalogs per location

- ✅ **Dedicated Support**
  - Priority support channel
  - Direct support contact

---

## 📊 Feature Comparison Table

| Feature | STARTER | PRO | BUSINESS |
|---------|---------|-----|----------|
| **Services** |
| Max Services | 50 | Unlimited | Unlimited |
| Max Categories | 15 | Unlimited | Unlimited |
| Service Add-ons | ✅ | ✅ | ✅ |
| **Appointments** |
| View Appointments | ✅ | ✅ | ✅ |
| Create Appointments | ✅ | ✅ | ✅ |
| Calendar View | ❌ | ✅ | ✅ |
| Appointment Reminders | ❌ | ✅ | ✅ |
| **Staff** |
| Assign Team Members to Services | ❌ | ✅* | ✅ |
| Assign Team Members to Appointments | ❌ | ✅* | ✅ |
| Staff Availability Management | ❌ | ❌ | ✅ |
| *PRO: Can assign IF team members exist (but cannot add new team members - BUSINESS plan only) |
| **Analytics** |
| Basic Stats | ✅ | ✅ | ✅ |
| Advanced Analytics | ❌ | ✅ | ✅ |
| Customer Insights | ❌ | ✅ | ✅ |
| **Team** |
| Team Members (Same as Other Business Types) | 0 | 0 | 5 |
| Role-Based Access (OWNER/MANAGER/STAFF) | ❌ | ❌ | ✅ |
| Team Management UI | ❌ | ❌ | ✅ |
| **Other** |
| Discounts | ❌ | ✅ | ✅ |
| Custom Domain | ❌ | ❌ | ✅ |
| API Access | ❌ | ❌ | ✅ |
| Priority Support | ❌ | ✅ | ✅ |

---

## 🎯 Admin Pages by Plan

### STARTER Plan Pages

**Always Visible:**
- Dashboard (salon-specific)
- Services (list, create/edit)
- Service Categories
- Appointments (list, details, create)
- Customers
- Appearance
- Marketing
- Settings (all sub-pages)
- Help & Support

**Hidden/Blocked:**
- `/appointments/calendar` - Redirected with upgrade message
- `/staff/availability` - Hidden from sidebar
- `/analytics` - Hidden from sidebar
- `/discounts` - Hidden from sidebar
- `/team` - Hidden from sidebar
- `/domains` - Hidden from sidebar
- `/api` - Hidden from sidebar

### PRO Plan Pages

**Everything in STARTER, Plus:**
- `/appointments/calendar` - Calendar view
- `/analytics` - Advanced analytics
- `/discounts` - Discount management

**Still Hidden:**
- `/staff/availability` - Hidden from sidebar
- `/team` - Hidden from sidebar
- `/domains` - Hidden from sidebar
- `/api` - Hidden from sidebar

### BUSINESS Plan Pages

**Everything in PRO, Plus:**
- `/staff/availability` - Staff availability management
- `/team` - Team management
- `/domains` - Custom domain setup
- `/api` - API access & keys

---

## 🔒 Plan Restrictions Implementation

### Service Limits
- **STARTER**: Max 50 services (enforced in API)
- **PRO/BUSINESS**: Unlimited services

### Category Limits
- **STARTER**: Max 15 categories (enforced in API)
- **PRO/BUSINESS**: Unlimited categories

### Feature Access
- Use `SubscriptionGuard` component for plan-restricted pages
- Check `subscription.plan` in sidebar to show/hide menu items
- Show upgrade prompts when accessing PRO/BUSINESS features on lower plans

### Example Implementation

```typescript
// In AdminSidebar.tsx
const isSalon = businessType === 'SALON'

// Show calendar only for PRO+
if (isSalon && (plan === 'PRO' || plan === 'BUSINESS')) {
  menuItems.push({
    name: 'Calendar',
    href: `${baseUrl}/appointments/calendar`,
    requiredPlan: 'PRO'
  })
}

// Show staff availability only for BUSINESS
if (isSalon && plan === 'BUSINESS') {
  menuItems.push({
    name: 'Staff Availability',
    href: `${baseUrl}/staff/availability`,
    requiredPlan: 'BUSINESS'
  })
}
```

---

## 📝 Notes

1. **Shared Features**: Custom Domain and API Access are shared features (same for all business types) - BUSINESS plan only.

2. **Service Limits**: Services follow the same limits as Products (50 for STARTER, unlimited for PRO/BUSINESS).

3. **Appointments**: Basic appointment management is available on all plans. Advanced features (calendar, reminders) require PRO+.

4. **Team Members** (Same System for All Business Types):
   - **STARTER/PRO**: Single user account only (no team members)
   - **BUSINESS**: Up to 5 team members with role-based access
   - **Roles**: OWNER (full access), MANAGER (can manage + invite), STAFF (orders/appointments only)
   - **Same permissions** as restaurants/retail businesses
   - **Same invitation workflow** - Email invitations, accept via link
   - **Subscription inheritance** - Team members inherit BUSINESS plan from Business model

5. **Staff Assignment** (Salon-Specific Feature):
   - **PRO**: Can assign existing team members to services/appointments (but cannot add new team members - BUSINESS plan only)
   - **BUSINESS**: Can assign team members + add new team members + manage availability
   - **Note**: Staff assignment uses the same team members from Team Management

6. **Staff Availability Management** (Salon-Specific Feature):
   - **BUSINESS plan only**
   - Works with Team Management system
   - Allows setting working hours, time off, availability calendar for team members
   - Enables auto-assignment based on availability

7. **Analytics**: Basic stats available on STARTER, advanced analytics require PRO+.

8. **Team Members vs Staff Assignment**:
   - **Team Members** = Users who can log into admin panel (BUSINESS plan only, same for all business types)
   - **Staff Assignment** = Assigning those team members to services/appointments (PRO+ for salons)
   - **Staff Availability** = Setting working hours/availability for team members (BUSINESS plan only, salon-specific)

---

## ✅ Implementation Checklist

- [x] Update `AdminSidebar` to show/hide menu items based on plan + businessType
- [x] Add `SubscriptionGuard` to plan-restricted pages
- [x] Enforce service limits in API (50 for STARTER)
- [x] Enforce category limits in API (15 for STARTER)
- [x] Show upgrade prompts for PRO/BUSINESS features
- [x] Update billing page to show salon-specific plan features
- [x] Test plan restrictions for each plan level

---

## ✅ IMPLEMENTATION COMPLETE

**All plan-based feature restrictions have been successfully implemented.**

**Completed Date:** February 12, 2026  
**Lead Engineer:** Griseld

### Summary:
- ✅ AdminSidebar conditionally shows/hides features based on plan
- ✅ SubscriptionGuard protects PRO/BUSINESS pages
- ✅ Service and category limits enforced in APIs
- ✅ Upgrade prompts shown for restricted features
- ✅ Plan-specific terminology (services vs products) implemented
