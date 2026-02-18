# Help & Support Module Implementation

> **STATUS: COMPLETED (Feb 2026)**
> - SupportTicket model: DONE
> - SupportMessage model: DONE
> - Tickets API (CRUD): DONE (/api/admin/stores/[businessId]/support/)
> - Messages API: DONE
> - SuperAdmin support management: DONE (/superadmin/support/tickets, /superadmin/support/messages)

## Overview
This document outlines the complete implementation of the Help & Support module for the WaveOrder application, including FAQs, ticketing system, messaging system, and notifications.

## Table of Contents
1. [Database Schema Changes](#database-schema-changes)
2. [API Endpoints](#api-endpoints)
3. [Admin Components](#admin-components)
4. [SuperAdmin Components](#superadmin-components)
5. [Email Notifications](#email-notifications)
6. [Navigation Updates](#navigation-updates)
7. [Bug Fixes and Improvements](#bug-fixes-and-improvements)

## Database Schema Changes

### New Models Added to `prisma/schema.prisma`

#### SupportTicket Model
```prisma
model SupportTicket {
  id          String   @id @default(auto()) @map("_id") @db.ObjectId
  ticketNumber String  @unique
  subject     String
  description String
  status      TicketStatus @default(OPEN)
  priority    TicketPriority @default(MEDIUM)
  type        TicketType @default(GENERAL)
  businessId  String   @db.ObjectId
  createdById String   @db.ObjectId
  assignedToId String? @db.ObjectId
  business    Business @relation(fields: [businessId], references: [id], onDelete: Cascade)
  createdBy   User     @relation(fields: [createdById], references: [id], onDelete: Cascade)
  assignedTo  User?    @relation(fields: [assignedToId], references: [id], onDelete: SetNull)
  comments    TicketComment[]
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
}
```

#### TicketComment Model
```prisma
model TicketComment {
  id        String   @id @default(auto()) @map("_id") @db.ObjectId
  content   String
  isInternal Boolean @default(false)
  ticketId  String   @db.ObjectId
  authorId  String   @db.ObjectId
  ticket    SupportTicket @relation(fields: [ticketId], references: [id], onDelete: Cascade)
  author    User     @relation(fields: [authorId], references: [id], onDelete: Cascade)
  createdAt DateTime @default(now())
}
```

#### SupportMessage Model
```prisma
model SupportMessage {
  id        String   @id @default(auto()) @map("_id") @db.ObjectId
  threadId  String
  content   String
  businessId String  @db.ObjectId
  senderId  String  @db.ObjectId
  recipientId String @db.ObjectId
  isRead    Boolean @default(false)
  business  Business @relation(fields: [businessId], references: [id], onDelete: Cascade)
  sender    User     @relation(fields: [senderId], references: [id], onDelete: Cascade)
  recipient User     @relation(fields: [recipientId], references: [id], onDelete: Cascade)
  createdAt DateTime @default(now())
}
```

#### Notification Model
```prisma
model Notification {
  id        String         @id @default(auto()) @map("_id") @db.ObjectId
  type      NotificationType
  title     String
  message   String
  link      String?
  isRead    Boolean        @default(false)
  userId    String         @db.ObjectId
  user      User           @relation(fields: [userId], references: [id], onDelete: Cascade)
  createdAt DateTime       @default(now())
}
```

#### SuperAdminSettings Model
```prisma
model SuperAdminSettings {
  id String @id @default(auto()) @map("_id") @db.ObjectId
  
  // Email settings
  primaryEmail   String
  backupEmails   String[]
  emailFrequency EmailFrequency @default(IMMEDIATE)
  emailDigest    Boolean        @default(false)
  urgentOnly     Boolean        @default(false)
  
  // Support settings
  autoAssignTickets     Boolean        @default(false)
  defaultTicketPriority TicketPriority @default(MEDIUM)
  responseTimeSLA       Int            @default(24) // hours
  workingHours          WorkingHours?
  
  // Notification preferences
  emailNotificationsTicketCreated   Boolean @default(true)
  emailNotificationsTicketUpdated   Boolean @default(true)
  emailNotificationsTicketResolved  Boolean @default(true)
  emailNotificationsMessageReceived Boolean @default(true)
  
  businessNotificationsTicketCreated   Boolean @default(true)
  businessNotificationsTicketUpdated   Boolean @default(true)
  businessNotificationsTicketResolved  Boolean @default(true)
  businessNotificationsMessageReceived Boolean @default(true)
  
  // Support contact settings
  supportEmail     String @default("support@waveorder.app")
  supportPhone     String @default("+1 (555) 123-4567")
  supportWebsite   String @default("https://waveorder.app/support")
  supportHours     String @default("Monday - Friday, 9:00 AM - 6:00 PM EST")
  responseTime     String @default("Within 24 hours")
  emergencyContact String @default("emergency@waveorder.app")
  supportMessage   String @default("We're here to help! Contact us anytime for support with your WaveOrder store.")
  supportTeamName  String @default("WaveOrder Support Team")
  
  userId String @unique @db.ObjectId
  user   User   @relation(fields: [userId], references: [id], onDelete: Cascade)
  
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}
```

#### WorkingHours Model
```prisma
model WorkingHours {
  id        String  @id @default(auto()) @map("_id") @db.ObjectId
  enabled   Boolean @default(false)
  startTime String  @default("09:00")
  endTime   String  @default("17:00")
  timezone  String  @default("UTC")
  settingsId String @unique @db.ObjectId
  settings  SuperAdminSettings @relation(fields: [settingsId], references: [id], onDelete: Cascade)
}
```

### New Enums
```prisma
enum TicketStatus {
  OPEN
  IN_PROGRESS
  WAITING_RESPONSE
  RESOLVED
  CLOSED
}

enum TicketPriority {
  LOW
  MEDIUM
  HIGH
  URGENT
}

enum TicketType {
  GENERAL
  TECHNICAL
  BILLING
  FEATURE_REQUEST
  BUG_REPORT
}

enum NotificationType {
  TICKET_CREATED
  TICKET_UPDATED
  TICKET_RESOLVED
  MESSAGE_RECEIVED
  SYSTEM_UPDATE
}

enum EmailFrequency {
  IMMEDIATE
  DAILY
  WEEKLY
  NEVER
}
```

## API Endpoints

### Admin Support APIs

#### Ticket Management
- `GET /api/admin/stores/[businessId]/support/tickets` - List tickets
- `POST /api/admin/stores/[businessId]/support/tickets` - Create ticket
- `GET /api/admin/stores/[businessId]/support/tickets/[ticketId]` - Get ticket details
- `GET /api/admin/stores/[businessId]/support/tickets/[ticketId]/comments` - Get ticket comments
- `POST /api/admin/stores/[businessId]/support/tickets/[ticketId]/comments` - Add comment

#### Message Management
- `GET /api/admin/stores/[businessId]/support/messages` - List message threads
- `POST /api/admin/stores/[businessId]/support/messages` - Create new thread
- `GET /api/admin/stores/[businessId]/support/messages/[threadId]` - Get thread details
- `PUT /api/admin/stores/[businessId]/support/messages/[threadId]` - Mark as read
- `POST /api/admin/stores/[businessId]/support/messages/[threadId]/reply` - Reply to thread

#### Notifications
- `GET /api/admin/stores/[businessId]/notifications` - List notifications
- `PUT /api/admin/stores/[businessId]/notifications/[notificationId]/read` - Mark as read
- `PUT /api/admin/stores/[businessId]/notifications/mark-all-read` - Mark all as read
- `GET /api/admin/stores/[businessId]/notifications/unread-count` - Get unread count

### SuperAdmin Support APIs

#### Ticket Management
- `GET /api/superadmin/support/tickets` - List all tickets
- `GET /api/superadmin/support/tickets/[ticketId]` - Get ticket details
- `PUT /api/superadmin/support/tickets/[ticketId]` - Update ticket status/priority
- `GET /api/superadmin/support/tickets/[ticketId]/comments` - Get ticket comments
- `POST /api/superadmin/support/tickets/[ticketId]/comments` - Add comment

#### Message Management
- `GET /api/superadmin/support/messages` - List all message threads
- `POST /api/superadmin/support/messages` - Initiate new thread
- `GET /api/superadmin/support/messages/[threadId]` - Get thread details
- `PUT /api/superadmin/support/messages/[threadId]` - Mark as read
- `POST /api/superadmin/support/messages/[threadId]/reply` - Reply to thread

#### Settings
- `GET /api/superadmin/settings` - Get SuperAdmin settings
- `GET /api/superadmin/support/settings` - Get support settings
- `PUT /api/superadmin/support/settings` - Update support settings

#### Notifications
- `GET /api/superadmin/notifications` - List notifications
- `PUT /api/superadmin/notifications/[notificationId]/read` - Mark as read
- `PUT /api/superadmin/notifications/mark-all-read` - Mark all as read
- `GET /api/superadmin/notifications/unread-count` - Get unread count

## Admin Components

### Help Center
- **File**: `src/components/admin/help/HelpCenter.tsx`
- **Features**: Search functionality, category filtering, FAQ display
- **Page**: `/admin/stores/[businessId]/help`

### FAQ Section
- **File**: `src/components/admin/help/FAQSection.tsx`
- **Features**: Accordion-style FAQ display, search filtering, empty states
- **Content**: Domain logic for free vs paid plans, custom domain setup

### Ticket Management
- **File**: `src/components/admin/support/TicketList.tsx`
- **Features**: Ticket listing, filtering, create ticket button
- **Page**: `/admin/stores/[businessId]/support/tickets`

- **File**: `src/components/admin/support/TicketCard.tsx`
- **Features**: Individual ticket display with status, priority, type
- **UI**: Rounded cards with hover effects

- **File**: `src/components/admin/support/TicketDetails.tsx`
- **Features**: Full ticket details, created by info with "(You)" labels
- **Page**: `/admin/stores/[businessId]/support/tickets/[ticketId]`

- **File**: `src/components/admin/support/CreateTicketModal.tsx`
- **Features**: Modal form for creating new tickets
- **Fields**: Subject, description, type, priority

- **File**: `src/components/admin/support/TicketComments.tsx`
- **Features**: Comment display and creation, "(You)" labels for current user
- **Integration**: Real-time comment updates

### Message Management
- **File**: `src/components/admin/support/MessageThreadList.tsx`
- **Features**: Thread listing, search, unread indicators, "(You)" labels
- **Page**: `/admin/stores/[businessId]/support/messages`

- **File**: `src/components/admin/support/MessageThread.tsx`
- **Features**: Individual thread display, message history, "(You)" labels
- **Page**: `/admin/stores/[businessId]/support/messages/[threadId]`

- **File**: `src/components/admin/support/ComposeMessageModal.tsx`
- **Features**: Modal for composing new messages to SuperAdmin
- **Integration**: Business selection, message composition

### Notifications
- **File**: `src/components/admin/notifications/NotificationCenter.tsx`
- **Features**: Notification listing, pagination, filtering, mark as read
- **Page**: `/admin/stores/[businessId]/notifications`

- **File**: `src/components/admin/notifications/NotificationItem.tsx`
- **Features**: Individual notification display, type-based styling
- **UI**: Color-coded notification types

## SuperAdmin Components

### Ticket Management
- **File**: `src/components/superadmin/support/TicketManagement.tsx`
- **Features**: All tickets overview, filtering, search, "Reported by" section
- **Page**: `/superadmin/support/tickets`

- **File**: `src/components/superadmin/support/SuperAdminTicketDetails.tsx`
- **Features**: Ticket details, status updates, toast notifications, comment management
- **Page**: `/superadmin/support/tickets/[ticketId]`

- **File**: `src/components/superadmin/support/SuperAdminTicketComments.tsx`
- **Features**: Comment display and creation, support team name display
- **Integration**: Real-time updates, "(You)" labels

### Message Management
- **File**: `src/components/superadmin/support/MessageManagement.tsx`
- **Features**: All message threads, filtering, search, "(You)" labels
- **Page**: `/superadmin/support/messages`

- **File**: `src/components/superadmin/support/SuperAdminMessageThread.tsx`
- **Features**: Thread display, message history, "(You)" labels
- **Page**: `/superadmin/support/messages/[threadId]`

- **File**: `src/components/superadmin/support/InitiateMessageModal.tsx`
- **Features**: Modal for initiating new messages to admin users
- **Integration**: Business and user selection

### Notifications
- **File**: `src/components/superadmin/notifications/SuperAdminNotificationCenter.tsx`
- **Features**: Notification listing, pagination, filtering, mark as read
- **Page**: `/superadmin/notifications`

## Email Notifications

### Email Functions Added to `src/lib/email.ts`

#### Support Ticket Created Email
```typescript
export async function sendSupportTicketCreatedEmail({
  to,
  recipientName,
  ticketNumber,
  subject,
  description,
  businessName,
  ticketUrl
}: SupportTicketCreatedEmailParams)
```

#### Support Ticket Updated Email
```typescript
export async function sendSupportTicketUpdatedEmail({
  to,
  recipientName,
  ticketNumber,
  subject,
  status,
  updatedBy,
  businessName,
  ticketUrl
}: SupportTicketUpdatedEmailParams)
```

#### Support Ticket Comment Email
```typescript
export async function sendSupportTicketCommentEmail({
  to,
  recipientName,
  ticketNumber,
  subject,
  comment,
  commentAuthor,
  businessName,
  ticketUrl
}: SupportTicketCommentEmailParams)
```

#### Support Message Received Email
```typescript
export async function sendSupportMessageReceivedEmail({
  to,
  recipientName,
  senderName,
  subject,
  content,
  businessName,
  messageUrl
}: SupportMessageReceivedEmailParams)
```

### Email Triggers
- **Ticket Creation**: Admin creates ticket → SuperAdmin receives email
- **Ticket Updates**: SuperAdmin updates ticket → Admin receives email
- **Ticket Comments**: Admin/SuperAdmin adds comment → Other party receives email
- **Message Replies**: Admin/SuperAdmin replies to message → Other party receives email

## Navigation Updates

### Admin Sidebar
- **File**: `src/components/admin/layout/AdminSidebar.tsx`
- **Added**: "Help & Support" menu item with submenus:
  - Help Center
  - Support Tickets
  - Messages
- **Conditional**: Hidden when SuperAdmin is impersonating

### SuperAdmin Sidebar
- **File**: `src/components/superadmin/layout/SuperAdminSidebar.tsx`
- **Added**: "Support" menu item with submenus:
  - Tickets
  - Messages
  - Settings

### Header Updates
- **Admin Header**: `src/components/admin/layout/AdminHeader.tsx`
- **SuperAdmin Header**: `src/components/superadmin/layout/SuperAdminHeader.tsx`
- **Features**: Notification bell, unread count, dropdown with notifications
- **Integration**: Real-time polling, cache-busting, event listeners

## Bug Fixes and Improvements

### Email Notification Issues
1. **Fixed**: SuperAdmin email settings not existing
   - **Solution**: Auto-create default settings when sending emails
   - **Files**: All email-sending API endpoints

2. **Fixed**: Business name reference errors
   - **Solution**: Added separate business fetch in APIs
   - **Files**: Message reply, ticket creation APIs

3. **Fixed**: Thread participant lookup errors
   - **Solution**: Improved participant detection logic
   - **File**: `src/app/api/admin/stores/[businessId]/support/messages/[threadId]/reply/route.ts`

### UI/UX Improvements
1. **Added**: "(You)" labels for current user in all components
   - **Admin Components**: TicketDetails, MessageThreadList, MessageThread
   - **SuperAdmin Components**: MessageManagement, SuperAdminMessageThread

2. **Improved**: Empty states with better design
   - **Features**: White background, larger icons, better typography, smart actions
   - **Components**: All list components

3. **Enhanced**: Notification system
   - **Features**: Pagination, real stats, mark as read functionality
   - **Components**: NotificationCenter, SuperAdminNotificationCenter

4. **Fixed**: Notification colors
   - **Change**: TICKET_UPDATED from yellow to purple to avoid confusion
   - **File**: `src/components/admin/notifications/NotificationItem.tsx`

### Performance Improvements
1. **Added**: Cache-busting for real-time updates
   - **Implementation**: `?t=${Date.now()}` and `cache: 'no-store'`
   - **Files**: All notification and message APIs

2. **Added**: Event listeners for auto-refresh
   - **Events**: `focus`, `pageshow`, `visibilitychange`
   - **Files**: All list components

3. **Added**: Comprehensive logging for debugging
   - **Features**: Email sending logs, API parameter logs, error details
   - **Files**: All email-sending APIs and components

## Utility Functions

### Support Helpers
- **File**: `src/lib/support-helpers.ts`
- **Functions**:
  - `generateTicketNumber()` - Generate unique ticket numbers
  - `generateThreadId()` - Generate unique thread IDs
  - `getTicketStatusColor()` - Get status color classes
  - `getTicketPriorityColor()` - Get priority color classes
  - `getTicketTypeDisplayName()` - Get type display names

## Security Considerations

1. **Access Control**: All APIs check business access and user permissions
2. **Impersonation**: Support module is excluded from SuperAdmin impersonation
3. **Data Validation**: All inputs are validated and sanitized
4. **Email Security**: Email addresses are validated before sending

## Testing Recommendations

1. **Email Notifications**: Test all email triggers with different scenarios
2. **Real-time Updates**: Test notification polling and cache-busting
3. **User Experience**: Test "(You)" labels and empty states
4. **Performance**: Test with large numbers of tickets and messages
5. **Security**: Test access control and impersonation exclusions

## Future Enhancements

1. **File Attachments**: Add support for file uploads in tickets and messages
2. **Advanced Filtering**: Add more sophisticated filtering options
3. **Email Templates**: Customizable email templates
4. **Analytics**: Support ticket and message analytics
5. **Mobile App**: Mobile-specific components and optimizations

## Conclusion

The Help & Support module is now fully functional with:
- ✅ Complete FAQ system
- ✅ Full ticketing system with comments
- ✅ Admin-SuperAdmin messaging
- ✅ Real-time notifications
- ✅ Email notifications for all actions
- ✅ Proper UI/UX with "(You)" labels
- ✅ SuperAdmin settings and configuration
- ✅ No impersonation in support module
- ✅ Comprehensive error handling and logging

The module follows existing design patterns and integrates seamlessly with the WaveOrder application architecture.
