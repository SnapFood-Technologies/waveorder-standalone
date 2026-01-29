// src/lib/team-audit.ts
import { prisma } from '@/lib/prisma'

type TeamAuditAction = 
  | 'MEMBER_INVITED'
  | 'MEMBER_ROLE_CHANGED'
  | 'MEMBER_REMOVED'
  | 'INVITATION_RESENT'
  | 'INVITATION_CANCELLED'
  | 'INVITATION_ACCEPTED'

interface AuditLogParams {
  businessId: string
  actorId: string
  actorEmail: string
  action: TeamAuditAction
  targetId?: string
  targetEmail?: string
  details?: Record<string, unknown>
  ipAddress?: string
  userAgent?: string
}

/**
 * Logs a team-related action for audit purposes
 */
export async function logTeamAudit(params: AuditLogParams) {
  try {
    await (prisma as any).teamAuditLog.create({
      data: {
        businessId: params.businessId,
        actorId: params.actorId,
        actorEmail: params.actorEmail,
        action: params.action,
        targetId: params.targetId,
        targetEmail: params.targetEmail,
        details: params.details ? JSON.stringify(params.details) : null,
        ipAddress: params.ipAddress,
        userAgent: params.userAgent
      }
    })
  } catch (error) {
    // Log error but don't throw - audit logging should not break the main operation
    console.error('Failed to create audit log:', error)
  }
}

/**
 * Retrieves audit logs for a business
 */
export async function getTeamAuditLogs(
  businessId: string,
  options?: {
    limit?: number
    offset?: number
    action?: TeamAuditAction
    actorId?: string
  }
) {
  const { limit = 50, offset = 0, action, actorId } = options || {}

  const where: Record<string, unknown> = { businessId }
  if (action) where.action = action
  if (actorId) where.actorId = actorId

  const logs = await (prisma as any).teamAuditLog.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    take: limit,
    skip: offset
  })

  return logs.map((log: any) => ({
    ...log,
    details: log.details ? JSON.parse(log.details) : null
  }))
}
