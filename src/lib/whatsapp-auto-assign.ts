/**
 * WaveOrder Flows - Round-robin auto-assignment (Phase 8)
 */

import { prisma } from '@/lib/prisma'

export async function roundRobinAssign(businessId: string): Promise<string | null> {
  const members = await prisma.businessUser.findMany({
    where: { businessId },
    select: { userId: true },
    orderBy: { createdAt: 'asc' }
  })
  if (members.length === 0) return null

  const state = await prisma.whatsAppAssignmentState.findUnique({
    where: { businessId }
  })

  const lastId = state?.lastAssignedUserId ?? null
  const idx = lastId ? members.findIndex((m) => m.userId === lastId) + 1 : 0
  const next = members[idx % members.length]!
  const nextUserId = next.userId

  await prisma.whatsAppAssignmentState.upsert({
    where: { businessId },
    create: { businessId, lastAssignedUserId: nextUserId },
    update: { lastAssignedUserId: nextUserId }
  })

  return nextUserId
}
