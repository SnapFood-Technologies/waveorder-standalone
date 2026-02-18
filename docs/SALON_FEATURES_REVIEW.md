# Salon Features Review - February 6, 2026

> **STATUS: COMPLETED (Feb 2026)**
> - Staff assignment UI plan gating: DONE (useSubscription hook added)
>
> Remaining items moved to `docs/REMAINING_TODOS.md`

## ✅ What's Working Well

1. **Plan Restrictions on Pages**
   - ✅ Calendar page protected with `SubscriptionGuard` (PRO+)
   - ✅ Staff Availability page protected with `SubscriptionGuard` (BUSINESS only)
   - ✅ Analytics page protected with `SubscriptionGuard` (PRO+)
   - ✅ Discounts page protected with `SubscriptionGuard` (PRO+)
   - ✅ AdminSidebar correctly shows/hides menu items based on plan

2. **Service & Category Limits**
   - ✅ Service limits enforced in API (50 for STARTER)
   - ✅ Category limits enforced in API (15 for STARTER)
   - ✅ Proper error messages with upgrade prompts

3. **Database Schema**
   - ✅ Appointment model with staffId field
   - ✅ Product model with staffIds array for services
   - ✅ Proper indexes for performance

4. **API Endpoints**
   - ✅ Staff assignment supported in appointments API
   - ✅ Staff assignment supported in services API
   - ✅ Staff availability API implemented

## ⚠️ Issues Found

### 1. Staff Assignment UI Not Gated by Plan

**Issue:** The staff assignment UI in `ServiceForm.tsx` and `AppointmentDetails.tsx` shows the staff assignment section whenever team members exist, but it doesn't check if the user has PRO+ plan access.

**Expected Behavior (per docs):**
- Staff assignment should only be visible/available for PRO+ plans
- STARTER plan users should not see staff assignment options

**Current Behavior:**
- Staff assignment UI shows if team members exist (regardless of plan)
- This allows STARTER plan users to assign staff (which violates plan restrictions)

**Files Affected:**
- `src/components/admin/services/ServiceForm.tsx` (line ~818)
- `src/components/admin/appointments/AppointmentDetails.tsx` (line ~694)

**Fix Required:**
- Add `useSubscription` hook to check plan
- Only show staff assignment UI if `effectivePlan === 'PRO' || effectivePlan === 'BUSINESS'`
- Show upgrade message for STARTER plan users

### 2. Missing Appointment Reminders Feature

**Issue:** Documentation mentions "Appointment Reminders - Automated notifications" as a PRO+ feature, but there's no implementation for automated reminders sent 24 hours before appointments.

**Expected Behavior (per docs):**
- PRO+ plan users should have automated appointment reminders
- Reminders should be sent 24 hours before appointment time
- Should use WhatsApp or email (based on customer preferences)

**Current Behavior:**
- No automated reminder system exists
- Only manual notifications are available

**Fix Required:**
- Create cron job or scheduled task to check for appointments 24h in advance
- Send WhatsApp/email reminders to customers
- Add reminder settings in appointment notification settings
- Only enable for PRO+ plans

**Suggested Implementation:**
- Create `/api/cron/appointment-reminders` endpoint
- Run daily (or hourly) to check upcoming appointments
- Send reminders via existing notification services
- Track sent reminders to avoid duplicates

## 📋 Recommendations

### High Priority
1. ✅ **Fix staff assignment UI plan restrictions** - Critical for plan enforcement
2. ✅ **Implement appointment reminders** - Documented feature that's missing

### Medium Priority
3. Consider adding bulk appointment actions (mentioned in PRO plan features)
4. Add appointment reminder preferences in settings
5. Add reminder history/logging for tracking

### Low Priority
6. Consider adding appointment conflict detection
7. Add staff availability-based auto-assignment suggestions

## ✅ Verification Checklist

- [x] Calendar view requires PRO+ plan
- [x] Staff availability requires BUSINESS plan
- [x] Analytics requires PRO+ plan
- [x] Discounts require PRO+ plan
- [x] Service limits enforced (50 for STARTER)
- [x] Category limits enforced (15 for STARTER)
- [ ] Staff assignment UI gated by PRO+ plan ⚠️
- [ ] Appointment reminders implemented ⚠️
- [x] Team management requires BUSINESS plan
- [x] Custom domain requires BUSINESS plan
- [x] API access requires BUSINESS plan

## Next Steps

1. Fix staff assignment UI to check plan before showing
2. Implement appointment reminders system
3. Test all plan restrictions end-to-end
4. Update documentation with reminder implementation details
