<!-- d2805476-35f0-419f-934f-85d714c393c3 a82ad38c-2a41-400d-819f-bd7ede0e7588 -->
# Team Management Admin Implementation Plan

## Overview

Create a dedicated Team Management section in the admin panel (already in sidebar for PRO plan) where business owners can invite, manage, and remove team members. Team members inherit the business subscription and access admin features based on role permissions (OWNER, MANAGER, STAFF).

## Current System Understanding

**Existing Infrastructure:**

- Team invitations work in setup wizard (`TeamSetupStep.tsx`)
- API routes exist: `/api/team/send-invitations`, `/api/team/invite/[token]`
- Database models: `BusinessUser` (active members), `TeamInvitation` (pending invites)
- Roles: OWNER, MANAGER, STAFF (defined in `BusinessRole` enum)
- Subscription inheritance: Team members access business via `BusinessUser` relation, inherit `subscriptionPlan` from `Business` model

**What's Missing:**

- Admin UI page for team management
- API routes for listing team members and invitations
- API routes for resending/canceling invitations
- API routes for removing team members
- API routes for updating member roles
- Permission system documentation

## Implementation Steps

### 1. Backend API Routes

#### Create `/src/app/api/admin/stores/[businessId]/team/members/route.ts` (~120 lines)

**GET** - List all team members:

```typescript
{
  members: [
    {
      id: string,
      userId: string,
      name: string,
      email: string,
      role: 'OWNER' | 'MANAGER' | 'STAFF',
      joinedAt: timestamp,
      lastActive: timestamp // from User.updatedAt
    }
  ]
}
```

- Fetch from `BusinessUser` with joined `User` data
- Include role and join date
- Sort by role (OWNER first) then by joinedAt

**POST** - Invite new team member (reuse existing `/api/team/send-invitations`):

- Validates requester is OWNER or MANAGER
- Creates `TeamInvitation` record
- Sends email via `sendTeamInvitationEmail()`
- Returns invitation details

#### Create `/src/app/api/admin/stores/[businessId]/team/members/[userId]/route.ts` (~100 lines)

**PATCH** - Update member role:

- Only OWNER can update roles
- Cannot change OWNER role (must be exactly one OWNER)
- Updates `BusinessUser.role`

**DELETE** - Remove team member:

- Only OWNER can remove members
- Cannot remove OWNER (business must have one OWNER)
- Deletes `BusinessUser` record
- Optionally send "removed from team" email

#### Create `/src/app/api/admin/stores/[businessId]/team/invitations/route.ts` (~100 lines)

**GET** - List pending invitations:

```typescript
{
  invitations: [
    {
      id: string,
      email: string,
      role: 'MANAGER' | 'STAFF',
      status: 'PENDING' | 'ACCEPTED' | 'EXPIRED' | 'CANCELLED',
      expiresAt: timestamp,
      sentAt: timestamp
    }
  ]
}
```

- Fetch from `TeamInvitation` for businessId
- Include status and expiry info
- Filter by status (default: PENDING)

#### Create `/src/app/api/admin/stores/[businessId]/team/invitations/[invitationId]/route.ts` (~80 lines)

**POST** - Resend invitation:

- Check invitation is PENDING and not expired
- Generate new token and extend expiry (+7 days)
- Resend email via `sendTeamInvitationEmail()`

**DELETE** - Cancel invitation:

- Update status to CANCELLED
- Cannot accept cancelled invitations

### 2. Permission System & Guards

#### Create `/src/lib/permissions.ts` (~150 lines)

Role-based permission system:

```typescript
export const PERMISSIONS = {
  // Team Management
  INVITE_TEAM_MEMBERS: ['OWNER', 'MANAGER'],
  REMOVE_TEAM_MEMBERS: ['OWNER'],
  UPDATE_MEMBER_ROLES: ['OWNER'],
  
  // Business Settings
  UPDATE_BUSINESS_SETTINGS: ['OWNER', 'MANAGER'],
  UPDATE_BILLING: ['OWNER'],
  
  // Products & Inventory
  MANAGE_PRODUCTS: ['OWNER', 'MANAGER', 'STAFF'],
  MANAGE_INVENTORY: ['OWNER', 'MANAGER'],
  
  // Orders
  VIEW_ORDERS: ['OWNER', 'MANAGER', 'STAFF'],
  MANAGE_ORDERS: ['OWNER', 'MANAGER', 'STAFF'],
  
  // Customers
  VIEW_CUSTOMERS: ['OWNER', 'MANAGER', 'STAFF'],
  MANAGE_CUSTOMERS: ['OWNER', 'MANAGER'],
  
  // Analytics
  VIEW_ANALYTICS: ['OWNER', 'MANAGER'],
  
  // Appearance & Marketing
  MANAGE_APPEARANCE: ['OWNER', 'MANAGER'],
  MANAGE_MARKETING: ['OWNER', 'MANAGER']
}

export function hasPermission(
  userRole: BusinessRole,
  permission: keyof typeof PERMISSIONS
): boolean {
  return PERMISSIONS[permission].includes(userRole)
}

export function canManageTeam(role: BusinessRole): boolean {
  return role === 'OWNER' || role === 'MANAGER'
}

export function canInviteMembers(role: BusinessRole): boolean {
  return role === 'OWNER' || role === 'MANAGER'
}

export function canRemoveMembers(role: BusinessRole): boolean {
  return role === 'OWNER'
}
```

**Note:** Team members inherit subscription from the `Business.subscriptionPlan` field, not from individual users. When a team member logs in:

1. `/api/user/businesses` returns businesses they're associated with via `BusinessUser`
2. Each business includes `subscriptionPlan` from `Business` model
3. `BusinessContext` sets subscription based on business, not user
4. This means ALL team members see the same subscription level (FREE or PRO)

### 3. Admin UI - Team Management Page

#### Create `/src/app/admin/stores/[businessId]/team/page.tsx` (~15 lines)

Server component wrapper that passes businessId to client component.

#### Create `/src/components/admin/team/TeamManagement.tsx` (~600 lines)

**Main component structure:**

**Header Section:**

- Page title: "Team Management"
- Subtitle: "Manage team members and invitations"
- "Invite Member" button (if has permission)

**Active Members Section:**

- Table/Card list of active team members
- Columns: Name, Email, Role, Joined Date, Actions
- Role badges with colors (OWNER: blue, MANAGER: purple, STAFF: gray)
- Actions dropdown (for OWNER only):
  - Change Role (cannot change own role or other OWNER)
  - Remove Member (cannot remove self or other OWNER)
- Empty state if no team members yet

**Pending Invitations Section:**

- Table/Card list of pending invitations
- Columns: Email, Role, Sent Date, Expires, Actions
- Status badges (PENDING: yellow, EXPIRED: red)
- Actions:
  - Resend Invitation
  - Cancel Invitation
- Auto-refresh to update expired invitations
- Empty state if no pending invitations

**Invite Modal:**

- Email input with validation
- Role selector (MANAGER or STAFF)
- Multiple invites at once (reusable from setup)
- Preview invitation email
- Send button

**Role Change Modal:**

- Confirmation modal for role changes
- Show current role → new role
- Warning for downgrading permissions
- Confirm button

**Remove Member Modal:**

- Confirmation modal for removal
- Warning about access loss
- Checkbox: "Send notification email to removed member"
- Confirm button

**Permissions Display:**

- Collapsible "Role Permissions" section
- Shows what each role can do
- Helps OWNER understand before assigning roles

**Features:**

- Real-time status updates (poll every 30s for invitation status)
- Toast notifications for all actions
- Loading states for API calls
- Error handling with user-friendly messages
- Responsive design (table on desktop, cards on mobile)
- Search/filter members by name or email
- Sort by role or join date

#### Create `/src/components/admin/team/InviteMemberModal.tsx` (~200 lines)

Reusable modal for inviting team members:

- Email input with validation
- Role selection (MANAGER, STAFF)
- Support for multiple invitations
- Form validation
- Submit handler
- Success/error states

#### Create `/src/components/admin/team/TeamMemberCard.tsx` (~150 lines)

Reusable component for displaying team member info:

- Member avatar (initials or profile image)
- Name and email
- Role badge
- Join date
- Actions menu (if has permission)
- Responsive design

### 4. Update Sidebar Navigation

`/src/components/admin/layout/AdminSidebar.tsx` - Already has:

- Lines 175-179: "Team Management" nav item
- Icon: `UserPlus`
- Only visible for PRO plan
- **No changes needed** ✓

### 5. Email Notifications

Update `/src/lib/email.ts` (~80 lines added):

**New email templates:**

`sendTeamMemberRemovedEmail()`:

```typescript
interface TeamMemberRemovedParams {
  to: string
  name: string
  businessName: string
  removedBy: string
  reason?: string
}
```

- Notifies removed member
- Professional tone
- No access to business data anymore

`sendRoleChangedEmail()`:

```typescript
interface RoleChangedParams {
  to: string
  name: string
  businessName: string
  oldRole: string
  newRole: string
  changedBy: string
}
```

- Notifies member of role change
- Lists new permissions
- Link to admin panel

### 6. Update BusinessContext for Role Tracking

Update `/src/contexts/BusinessContext.tsx` (~20 lines added):

Add `userRole` to context:

```typescript
interface BusinessContextValue {
  businesses: Business[]
  subscription: { plan: 'FREE' | 'PRO'; isActive: boolean }
  loading: boolean
  currentBusiness: Business | null
  accessChecked: boolean
  userRole: 'OWNER' | 'MANAGER' | 'STAFF' | null // NEW
  refetch: () => void
}
```

Fetch and store user's role for current business from `/api/user/businesses` response (already includes `role` field from `BusinessUser`).

This allows components to check permissions:

```typescript
const { userRole } = useBusiness()
const canInvite = canInviteMembers(userRole)
```

### 7. Security & Validation

**Authorization Checks:**

- All team API routes verify user has access to businessId
- Check user's role from `BusinessUser` table
- OWNER actions: remove members, change roles, update billing
- MANAGER actions: invite members, manage products/orders
- STAFF actions: view and manage orders, products

**Validation:**

- Cannot remove last OWNER
- Cannot change OWNER role (business must have exactly one OWNER)
- Cannot remove or change own role if OWNER
- Email validation for invitations
- Check invitation not already sent to same email
- Rate limiting on invitation sends (max 10/hour per business)

**Edge Cases:**

- Expired invitations auto-filtered or shown with expired badge
- Prevent duplicate active members (check before accepting invitation)
- Handle user already has account vs new user signup
- Graceful degradation if email service fails

### 8. Subscription Inheritance Flow

**How It Works (Already Implemented):**

1. Team member accepts invitation → creates `BusinessUser` record
2. Team member logs in → `/api/user/businesses` returns businesses via `BusinessUser`
3. Response includes `business.subscriptionPlan` and `business.subscriptionStatus`
4. `BusinessContext` sets `subscription.plan` from business, not user
5. **Result:** All team members see same subscription features (PRO or FREE)

**No changes needed** - subscription inheritance already works correctly! Team members automatically get PRO features if business is on PRO plan.

### 9. Testing Checklist

**Team Member Management:**

- [ ] OWNER can invite MANAGER
- [ ] OWNER can invite STAFF
- [ ] MANAGER can invite STAFF
- [ ] MANAGER cannot invite MANAGER (permission check)
- [ ] STAFF cannot access team management page
- [ ] Invitation email sent successfully
- [ ] Invitation link works (accept flow)
- [ ] Cannot invite duplicate email

**Role Management:**

- [ ] OWNER can change MANAGER → STAFF
- [ ] OWNER can change STAFF → MANAGER
- [ ] OWNER cannot change own role
- [ ] OWNER cannot change another OWNER's role
- [ ] MANAGER cannot change any roles
- [ ] Role change email sent

**Member Removal:**

- [ ] OWNER can remove MANAGER
- [ ] OWNER can remove STAFF
- [ ] OWNER cannot remove self
- [ ] OWNER cannot remove another OWNER
- [ ] Cannot remove last OWNER
- [ ] MANAGER cannot remove anyone
- [ ] Removed member loses access
- [ ] Removal notification email sent

**Invitations:**

- [ ] Pending invitations listed correctly
- [ ] Expired invitations shown with badge
- [ ] Resend invitation works
- [ ] Resend extends expiry by 7 days
- [ ] Cancel invitation works
- [ ] Cancelled invitation cannot be accepted
- [ ] Invitation status updates in real-time

**Permissions & Access:**

- [ ] Team member inherits business subscription
- [ ] PRO business → all members see PRO features
- [ ] FREE business → all members see FREE features
- [ ] MANAGER has correct permissions
- [ ] STAFF has correct permissions
- [ ] Permission checks work in UI
- [ ] Permission checks work in API

**UI/UX:**

- [ ] Responsive design (mobile, tablet, desktop)
- [ ] Loading states shown
- [ ] Error messages clear and actionable
- [ ] Success notifications displayed
- [ ] Modals work correctly
- [ ] Search/filter works
- [ ] Empty states shown appropriately
- [ ] Role badges color-coded correctly

## File Summary

**New Files (9 total):**

- `/src/app/api/admin/stores/[businessId]/team/members/route.ts` (120 lines)
- `/src/app/api/admin/stores/[businessId]/team/members/[userId]/route.ts` (100 lines)
- `/src/app/api/admin/stores/[businessId]/team/invitations/route.ts` (100 lines)
- `/src/app/api/admin/stores/[businessId]/team/invitations/[invitationId]/route.ts` (80 lines)
- `/src/app/admin/stores/[businessId]/team/page.tsx` (15 lines)
- `/src/components/admin/team/TeamManagement.tsx` (600 lines)
- `/src/components/admin/team/InviteMemberModal.tsx` (200 lines)
- `/src/components/admin/team/TeamMemberCard.tsx` (150 lines)
- `/src/lib/permissions.ts` (150 lines)

**Modified Files (2 total):**

- `/src/lib/email.ts` (+80 lines) - Add removal and role change emails
- `/src/contexts/BusinessContext.tsx` (+20 lines) - Add userRole tracking

**No Changes Needed:**

- `/src/components/admin/layout/AdminSidebar.tsx` - Team nav already exists
- Subscription inheritance - Already works via Business.subscriptionPlan

## Key Design Decisions

1. **Subscription Model:** Team members don't have their own subscriptions. They inherit from the Business they're associated with. This is already implemented correctly.

2. **Single OWNER Rule:** Each business must have exactly one OWNER at all times. Cannot remove or change OWNER role.

3. **Permission Hierarchy:** OWNER > MANAGER > STAFF. Higher roles can manage lower roles but not peer or higher roles.

4. **Invitation Expiry:** 7 days default, can be extended by resending.

5. **Real-time Updates:** Poll invitation status every 30s to show expired state without page refresh.

6. **Email Notifications:** Send emails for: invitations, role changes, removals. All optional but recommended.

7. **Responsive Design:** Table view on desktop, card view on mobile for better UX.

## API Flow Examples

**Invite Team Member:**

```
1. POST /api/admin/stores/{businessId}/team/members
2. Validate requester role (OWNER or MANAGER)
3. Create TeamInvitation record
4. Send email with invitation link
5. Return success with invitation details
```

**Accept Invitation:**

```
1. GET /api/team/invite/{token} (verify invitation)
2. User logs in or signs up
3. POST /api/team/invite/{token} with userId
4. Create BusinessUser record
5. Mark invitation as ACCEPTED
6. Redirect to business dashboard
```

**Team Member Login:**

```
1. User logs in via NextAuth
2. GET /api/user/businesses
3. Returns businesses from BusinessUser relations
4. Each business includes subscriptionPlan
5. BusinessContext sets subscription from business
6. User sees appropriate features (PRO/FREE)
```

### To-dos

- [ ] Create team members API routes for listing, updating roles, and removing members
- [ ] Create invitations API routes for listing, resending, and canceling invitations
- [ ] Build role-based permissions system with permission checks for all actions
- [ ] Create team management admin page with members list and invitations list
- [ ] Build reusable components for member cards, invite modal, and confirmation modals
- [ ] Add email templates for team member removal and role changes
- [ ] Update BusinessContext to track current user's role for permission checks
- [ ] Test all team management flows including permissions, invitations, and subscription inheritance