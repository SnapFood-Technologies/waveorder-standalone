# Team Access with Roles - Current State

> **Status**: Good and Improved  
> **Last Updated**: January 2026  
> **Reviewer**: Griseld (3)

## Summary

WaveOrder has a complete team access system with three roles (OWNER, MANAGER, STAFF), invitation workflow, permission checks, and a full UI for team management. This feature is available on the **Business plan**.

---

## What We Have

### Roles System

| Role | Level | Description |
|------|-------|-------------|
| **OWNER** | 3 | Full access, can manage billing and transfer ownership |
| **MANAGER** | 2 | Can manage products, orders, invite staff |
| **STAFF** | 1 | Can view/manage orders and products only |

### Permission Matrix

| Permission | OWNER | MANAGER | STAFF |
|------------|:-----:|:-------:|:-----:|
| Invite Team Members | ✅ | ✅ | ❌ |
| Remove Team Members | ✅ | ❌ | ❌ |
| Update Member Roles | ✅ | ❌ | ❌ |
| Update Business Settings | ✅ | ✅ | ❌ |
| Update Billing | ✅ | ❌ | ❌ |
| Manage Products | ✅ | ✅ | ✅ |
| Manage Inventory | ✅ | ✅ | ❌ |
| View/Manage Orders | ✅ | ✅ | ✅ |
| View/Manage Customers | ✅ | ✅ | ✅ |
| View Analytics | ✅ | ✅ | ❌ |
| Manage Appearance | ✅ | ✅ | ❌ |
| Manage Marketing | ✅ | ✅ | ❌ |

---

## Database Schema

### BusinessUser Model
```prisma
model BusinessUser {
  id         String       @id @default(cuid())
  userId     String
  businessId String
  role       BusinessRole @default(STAFF)
  createdAt  DateTime     @default(now())
  user       User         @relation(...)
  business   Business     @relation(...)

  @@unique([userId, businessId])
}
```

### TeamInvitation Model
```prisma
model TeamInvitation {
  id         String           @id @default(cuid())
  email      String
  businessId String
  role       BusinessRole     @default(STAFF)
  token      String           @unique
  status     InvitationStatus @default(PENDING)
  expiresAt  DateTime         // 7 days from creation
  invitedBy  String
  createdAt  DateTime         @default(now())
  updatedAt  DateTime         @updatedAt
  business   Business         @relation(...)
}
```

### TeamAuditLog Model (New)
```prisma
model TeamAuditLog {
  id         String          @id
  businessId String
  actorId    String          // Who performed the action
  actorEmail String
  action     TeamAuditAction // MEMBER_INVITED, ROLE_CHANGED, REMOVED, etc.
  targetId   String?         // Affected user ID
  targetEmail String?        // Affected user email
  details    String?         // JSON with additional context
  ipAddress  String?
  userAgent  String?
  createdAt  DateTime
}
```

### Enums
- `BusinessRole`: OWNER, MANAGER, STAFF
- `InvitationStatus`: PENDING, ACCEPTED, EXPIRED, CANCELLED
- `TeamAuditAction`: MEMBER_INVITED, MEMBER_ROLE_CHANGED, MEMBER_REMOVED, INVITATION_RESENT, INVITATION_CANCELLED, INVITATION_ACCEPTED

---

## API Endpoints

### Team Members

| Method | Endpoint | Description | Required Role |
|--------|----------|-------------|---------------|
| GET | `/api/admin/stores/[businessId]/team/members` | List all team members | Any member |
| POST | `/api/admin/stores/[businessId]/team/members` | Invite new member | OWNER, MANAGER |
| PATCH | `/api/admin/stores/[businessId]/team/members/[userId]` | Update member role | OWNER |
| DELETE | `/api/admin/stores/[businessId]/team/members/[userId]` | Remove member | OWNER |

### Invitations

| Method | Endpoint | Description | Required Role |
|--------|----------|-------------|---------------|
| GET | `/api/admin/stores/[businessId]/team/invitations` | List invitations | Any member |
| POST | `/api/admin/stores/[businessId]/team/invitations/[invitationId]` | Resend invitation | OWNER, MANAGER |
| DELETE | `/api/admin/stores/[businessId]/team/invitations/[invitationId]` | Cancel invitation | OWNER, MANAGER |

### Public Invitation
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET/POST | `/api/team/invite/[token]` | Validate/accept invitation (no auth) |

---

## UI Components

### Team Management Page
**Path**: `/admin/stores/[businessId]/team`  
**Access**: PRO plan required (SubscriptionGuard)

### Components (`src/components/admin/team/`)

1. **TeamManagement.tsx** - Main component
   - Lists active members and pending invitations
   - Search and role filter
   - Role permissions info panel
   - Actions: invite, resend, cancel, update roles, remove

2. **InviteMemberModal.tsx** - Invitation modal
   - Supports multiple email invites
   - Email validation
   - Role selection (MANAGER/STAFF only)

3. **TeamMemberCard.tsx** - Member display card
   - Shows name, email, role badge, join date, last active
   - Actions menu: change role, remove member
   - Prevents editing self or OWNER

4. **AcceptInvitation.tsx** (`src/components/team/`) - Public invitation page
   - Shows invitation details
   - Account creation form
   - Password strength validation
   - Auto-signs in after acceptance

---

## Invitation Flow

```
1. OWNER/MANAGER clicks "Invite Team Member"
         ↓
2. Modal: Enter email(s) + select role (MANAGER/STAFF)
         ↓
3. System creates TeamInvitation record
   - Generates unique token
   - Sets 7-day expiration
   - Sends email with link
         ↓
4. Invitee receives email with link: /team/invite/[token]
         ↓
5. Invitee clicks link:
   - If existing user → adds to business
   - If new user → creates account + adds to business
         ↓
6. TeamInvitation marked as ACCEPTED
7. User auto-signed in and redirected to dashboard
```

---

## Security Features

### Built-in Protections
- ✅ Cannot change own role
- ✅ Cannot remove yourself from team
- ✅ Cannot remove the OWNER
- ✅ Cannot remove the last OWNER
- ✅ Cannot change OWNER's role
- ✅ Only OWNER can remove members
- ✅ Only OWNER can change roles
- ✅ Token-based invitation (secure `crypto.randomUUID()`) ✅ **Improved**
- ✅ Invitation expiration (7 days)
- ✅ Duplicate invitation prevention
- ✅ Rate limiting (max 10 invitations per hour) ✅ **New**
- ✅ Audit logging for all team actions ✅ **New**

### Access Control Implementation
```typescript
// API routes check permissions like this:
const businessUser = await prisma.businessUser.findFirst({
  where: { userId: session.user.id, businessId }
})

if (!businessUser || !canInviteMembers(businessUser.role)) {
  return NextResponse.json({ message: 'Access denied' }, { status: 403 })
}
```

---

## Permission Helpers

**Location**: `src/lib/permissions.ts`

```typescript
// Role checks
hasPermission(userRole, permission)
canInviteMembers(role)      // OWNER, MANAGER
canRemoveMembers(role)      // OWNER only
canUpdateMemberRoles(role)  // OWNER only

// Validation helpers
canManageUserRole(currentUserRole, targetRole, newRole)
canRemoveUser(currentUserRole, targetRole)
```

---

## Email Notifications

The system sends emails for:
- ✅ New team invitation
- ✅ Role change notification
- ✅ Member removal notification
- ✅ Invitation resend

---

## What's Not Implemented

### Not Built Yet
1. Bulk invitation operations (UI sends sequentially)
2. ~~Invitation history/audit log~~ ✅ **Now implemented with TeamAuditLog**
3. ~~Role change history~~ ✅ **Now tracked in TeamAuditLog**
4. Detailed team member activity tracking
5. Transfer ownership functionality
6. Role-based feature flags within admin
7. Team member onboarding flow

### Potential Security Improvements
1. ~~Use `crypto.randomBytes` for token generation~~ ✅ **Now using crypto.randomUUID()**
2. ~~Rate limiting on invitation creation~~ ✅ **Now limited to 10/hour per business**
3. ~~Audit logging for sensitive operations~~ ✅ **Now implemented**
4. 2FA requirement for OWNER role changes

---

## Potential Future Improvements

### Team Management
- Configurable invitation expiration
- Invitation limits (max team size per plan)
- Custom roles / role templates
- Granular permissions (permission matrix instead of roles)
- Team member profiles (avatar, bio)
- Soft delete (deactivate vs remove)

### Analytics & Tracking
- Invitation analytics (acceptance rate, time to accept)
- Team member activity logs
- Role change audit trail

### User Experience
- Bulk role updates
- Better error messages for permission denials
- Team member search across all stores (for multi-store)

---

## Plan Limits

| Plan | Team Members |
|------|--------------|
| Starter | 1 (owner only) |
| Pro | 5 users |
| Business | Unlimited |

---

## Files Reference

```
src/
├── lib/
│   └── permissions.ts          # Permission helpers
├── components/
│   ├── admin/team/
│   │   ├── TeamManagement.tsx
│   │   ├── InviteMemberModal.tsx
│   │   └── TeamMemberCard.tsx
│   └── team/
│       └── AcceptInvitation.tsx
├── app/
│   ├── admin/stores/[businessId]/team/
│   │   └── page.tsx
│   ├── api/admin/stores/[businessId]/team/
│   │   ├── members/route.ts
│   │   ├── members/[userId]/route.ts
│   │   ├── invitations/route.ts
│   │   └── invitations/[invitationId]/route.ts
│   └── api/team/invite/[token]/
│       └── route.ts
└── (site)/team/invite/[token]/
    └── page.tsx
```

---

## Conclusion

**Rating: 4/5** (upgraded from 3/5) - The team access system is now more robust with:
- ✅ Three-tier role system working correctly
- ✅ Full invitation workflow with emails
- ✅ Permission checks on API and UI
- ✅ Security protections against common issues
- ✅ **Secure token generation** (crypto.randomUUID)
- ✅ **Rate limiting** (10 invitations/hour)
- ✅ **Audit logging** for all team actions

Room for improvement in:
- ~~Audit logging and activity tracking~~ ✅ Done
- Ownership transfer
- More granular permissions
- Bulk operations
- ~~Rate limiting on invitations~~ ✅ Done
