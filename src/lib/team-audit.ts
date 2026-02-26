// src/lib/team-audit.ts
import { prisma } from '@/lib/prisma'
import { logSystemEvent, extractIPAddress, getActualRequestUrl } from '@/lib/systemLog'

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
  /** When provided, also logs to systemLog for SuperAdmin visibility */
  request?: Request
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

    // Also log to systemLog for SuperAdmin visibility
    if (params.request) {
      logSystemEvent({
        logType: 'team_action',
        severity: 'info',
        endpoint: '/api/admin/stores/[businessId]/team',
        method: 'POST',
        statusCode: 200,
        url: getActualRequestUrl(params.request),
        businessId: params.businessId,
        errorMessage: params.action.replace(/_/g, ' ').toLowerCase(),
        ipAddress: params.ipAddress ?? extractIPAddress(params.request),
        userAgent: params.userAgent ?? ((params.request as any).headers?.get?.('user-agent') || undefined),
        metadata: {
          actorId: params.actorId,
          actorEmail: params.actorEmail,
          action: params.action,
          targetId: params.targetId,
          targetEmail: params.targetEmail,
          details: params.details,
        },
      }).catch(() => {})
    }
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
