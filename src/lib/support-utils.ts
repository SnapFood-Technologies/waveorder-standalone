// src/lib/support-utils.ts
// Client-safe utilities for support system (no server-side imports)

/**
 * Check if support module should be shown
 */
export function shouldShowSupportModule(session: any, pathname: string): boolean {
  const isImpersonating = session?.user?.role === 'SUPER_ADMIN' && pathname.startsWith('/admin')
  return !isImpersonating
}

/**
 * Get ticket status badge color
 */
export function getTicketStatusColor(status: string): string {
  switch (status) {
    case 'OPEN':
      return 'bg-blue-100 text-blue-800'
    case 'IN_PROGRESS':
      return 'bg-yellow-100 text-yellow-800'
    case 'WAITING_RESPONSE':
      return 'bg-orange-100 text-orange-800'
    case 'RESOLVED':
      return 'bg-green-100 text-green-800'
    case 'CLOSED':
      return 'bg-gray-100 text-gray-800'
    default:
      return 'bg-gray-100 text-gray-800'
  }
}

/**
 * Get ticket priority badge color
 */
export function getTicketPriorityColor(priority: string): string {
  switch (priority) {
    case 'LOW':
      return 'bg-gray-100 text-gray-800'
    case 'MEDIUM':
      return 'bg-blue-100 text-blue-800'
    case 'HIGH':
      return 'bg-orange-100 text-orange-800'
    case 'URGENT':
      return 'bg-red-100 text-red-800'
    default:
      return 'bg-gray-100 text-gray-800'
  }
}

/**
 * Get ticket type display name
 */
export function getTicketTypeDisplayName(type: string): string {
  switch (type) {
    case 'GENERAL':
      return 'General'
    case 'TECHNICAL':
      return 'Technical'
    case 'BILLING':
      return 'Billing'
    case 'FEATURE_REQUEST':
      return 'Feature Request'
    case 'BUG_REPORT':
      return 'Bug Report'
    default:
      return type
  }
}

/**
 * Notification type enum (matching Prisma)
 */
export type NotificationType = 
  | 'TICKET_CREATED'
  | 'TICKET_UPDATED'
  | 'TICKET_RESOLVED'
  | 'MESSAGE_RECEIVED'
  | 'SYSTEM_UPDATE'

/**
 * Get notification type display name
 */
export function getNotificationTypeDisplayName(type: NotificationType | string): string {
  switch (type) {
    case 'TICKET_CREATED':
      return 'Ticket Created'
    case 'TICKET_UPDATED':
      return 'Ticket Updated'
    case 'TICKET_RESOLVED':
      return 'Ticket Resolved'
    case 'MESSAGE_RECEIVED':
      return 'Message Received'
    case 'SYSTEM_UPDATE':
      return 'System Update'
    default:
      return type
  }
}
