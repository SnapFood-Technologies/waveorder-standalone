// src/lib/permissions.ts
import { BusinessRole } from '@prisma/client'

export const PERMISSIONS = {
  // Team Management
  INVITE_TEAM_MEMBERS: ['OWNER', 'MANAGER'],
  REMOVE_TEAM_MEMBERS: ['OWNER'],
  UPDATE_MEMBER_ROLES: ['OWNER'],
  
  // Business Settings
  UPDATE_BUSINESS_SETTINGS: ['OWNER', 'MANAGER'],
  UPDATE_BILLING: ['OWNER'],
  
  // Products & Inventory
  MANAGE_PRODUCTS: ['OWNER', 'MANAGER'],  // STAFF should only view/manage orders, not products
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
} as const

export type PermissionKey = keyof typeof PERMISSIONS

export function hasPermission(
  userRole: BusinessRole | null,
  permission: PermissionKey
): boolean {
  // @ts-ignore
  if (!userRole) return false
  // @ts-ignore
  return PERMISSIONS[permission].includes(userRole)
}

export function canManageTeam(role: BusinessRole | null): boolean {
  return role === 'OWNER' || role === 'MANAGER'
}

export function canInviteMembers(role: BusinessRole | null): boolean {
  return role === 'OWNER' || role === 'MANAGER'
}

export function canRemoveMembers(role: BusinessRole | null): boolean {
  return role === 'OWNER'
}

export function canUpdateMemberRoles(role: BusinessRole | null): boolean {
  return role === 'OWNER'
}

export function canUpdateBilling(role: BusinessRole | null): boolean {
  return role === 'OWNER'
}

export function canManageInventory(role: BusinessRole | null): boolean {
  return role === 'OWNER' || role === 'MANAGER'
}

export function canViewAnalytics(role: BusinessRole | null): boolean {
  return role === 'OWNER' || role === 'MANAGER'
}

export function canManageAppearance(role: BusinessRole | null): boolean {
  return role === 'OWNER' || role === 'MANAGER'
}

export function canManageMarketing(role: BusinessRole | null): boolean {
  return role === 'OWNER' || role === 'MANAGER'
}

// Role hierarchy helpers
export function isHigherRole(role1: BusinessRole, role2: BusinessRole): boolean {
  const hierarchy: Record<BusinessRole, number> = {
    'OWNER': 3,
    'MANAGER': 2,
    'STAFF': 1
  }
  
  return hierarchy[role1] > hierarchy[role2]
}

export function isSameOrHigherRole(role1: BusinessRole, role2: BusinessRole): boolean {
  const hierarchy: Record<BusinessRole, number> = {
    'OWNER': 3,
    'MANAGER': 2,
    'STAFF': 1
  }
  
  return hierarchy[role1] >= hierarchy[role2]
}

export function getRoleDisplayName(role: BusinessRole): string {
  switch (role) {
    case 'OWNER':
      return 'Owner'
    case 'MANAGER':
      return 'Manager'
    case 'STAFF':
      return 'Staff'
    default:
      return role
  }
}

export function getRoleDescription(role: BusinessRole): string {
  switch (role) {
    case 'OWNER':
      return 'Full access to all features, can manage team and billing'
    case 'MANAGER':
      return 'Can manage products, orders, and invite staff members'
    case 'STAFF':
      return 'Can view and manage orders only'
    default:
      return 'Limited access'
  }
}

export function getRoleBadgeColor(role: BusinessRole): string {
  switch (role) {
    case 'OWNER':
      return 'bg-blue-100 text-blue-800'
    case 'MANAGER':
      return 'bg-purple-100 text-purple-800'
    case 'STAFF':
      return 'bg-gray-100 text-gray-800'
    default:
      return 'bg-gray-100 text-gray-800'
  }
}

// Permission validation for team management
export function canManageUserRole(
  managerRole: BusinessRole,
  targetRole: BusinessRole,
  targetUserId: string,
  currentUserId: string
): { canManage: boolean; reason?: string } {
  // Cannot change your own role
  if (targetUserId === currentUserId) {
    return { canManage: false, reason: 'You cannot change your own role' }
  }
  
  // Only OWNER can manage roles
  if (managerRole !== 'OWNER') {
    return { canManage: false, reason: 'Only business owners can change roles' }
  }
  
  // Cannot change OWNER role
  if (targetRole === 'OWNER') {
    return { canManage: false, reason: 'Cannot change owner role' }
  }
  
  return { canManage: true }
}

export function canRemoveUser(
  managerRole: BusinessRole,
  targetRole: BusinessRole,
  targetUserId: string,
  currentUserId: string
): { canRemove: boolean; reason?: string } {
  // Cannot remove yourself
  if (targetUserId === currentUserId) {
    return { canRemove: false, reason: 'You cannot remove yourself from the team' }
  }
  
  // Only OWNER can remove members
  if (managerRole !== 'OWNER') {
    return { canRemove: false, reason: 'Only business owners can remove team members' }
  }
  
  // Cannot remove OWNER
  if (targetRole === 'OWNER') {
    return { canRemove: false, reason: 'Cannot remove business owner' }
  }
  
  return { canRemove: true }
}
