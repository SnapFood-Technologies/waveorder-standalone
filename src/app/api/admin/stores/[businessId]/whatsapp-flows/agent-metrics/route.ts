// WaveOrder Flows - Per-agent metrics (Phase 8)
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { checkBusinessAccess } from '@/lib/api-helpers'

async function requireFlowsAccess(businessId: string) {
  const access = await checkBusinessAccess(businessId)
  if (!access.authorized) {
    return { ok: false as const, response: NextResponse.json({ message: access.error }, { status: access.status }) }
  }
  const business = await prisma.business.findUnique({
    where: { id: businessId },
    select: { subscriptionPlan: true }
  })
  if (!business || !['PRO', 'BUSINESS'].includes(business.subscriptionPlan)) {
    return { ok: false as const, response: NextResponse.json({ message: 'WaveOrder Flows requires Pro or Business plan' }, { status: 403 }) }
  }
  return { ok: true as const }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ businessId: string }> }
) {
  try {
    const { businessId } = await params
    const access = await requireFlowsAccess(businessId)
    if (!access.ok) return access.response

    const { searchParams } = new URL(request.url)
    const days = Math.min(90, Math.max(1, parseInt(searchParams.get('days') || '30', 10)))

    const since = new Date()
    since.setDate(since.getDate() - days)

    const settings = await prisma.whatsAppSettings.findUnique({
      where: { businessId },
      select: { agentUserIds: true }
    })
    const agentIds = settings?.agentUserIds
    const memberWhere = agentIds && agentIds.length > 0
      ? { businessId, userId: { in: agentIds } }
      : { businessId }
    const members = await prisma.businessUser.findMany({
      where: memberWhere,
      include: { user: { select: { id: true, name: true, email: true } } },
      orderBy: { createdAt: 'asc' }
    })

    const metrics = await Promise.all(
      members.map(async (m) => {
        const assigned = await prisma.whatsAppConversation.count({
          where: {
            businessId,
            assignedTo: m.userId
          }
        })
        const resolved = await prisma.whatsAppConversation.count({
          where: {
            businessId,
            assignedTo: m.userId,
            status: 'resolved'
          }
        })
        const resolvedSince = await prisma.whatsAppConversation.count({
          where: {
            businessId,
            assignedTo: m.userId,
            status: 'resolved',
            resolvedAt: { gte: since }
          }
        })

        const convosWithFirstResponse = await prisma.whatsAppConversation.findMany({
          where: {
            businessId,
            assignedTo: m.userId,
            firstResponseAt: { not: null },
            createdAt: { gte: since }
          },
          select: { id: true, createdAt: true, firstResponseAt: true }
        })

        let avgResponseMs = 0
        if (convosWithFirstResponse.length > 0) {
          const totalMs = convosWithFirstResponse.reduce((sum, c) => {
            const resp = c.firstResponseAt
            if (!resp) return sum
            return sum + (resp.getTime() - c.createdAt.getTime())
          }, 0)
          avgResponseMs = Math.round(totalMs / convosWithFirstResponse.length)
        }

        return {
          userId: m.userId,
          name: m.user.name || m.user.email || 'Unknown',
          assigned,
          resolved,
          resolvedSince,
          resolutionRate: assigned > 0 ? Math.round((resolved / assigned) * 100) : 0,
          avgResponseMinutes: avgResponseMs > 0 ? Math.round(avgResponseMs / 60000) : null
        }
      })
    )

    return NextResponse.json({ metrics })
  } catch (error) {
    console.error('[whatsapp-flows] agent-metrics:', error)
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 })
  }
}
