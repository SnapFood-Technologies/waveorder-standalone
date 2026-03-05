// WaveOrder Flows - Agent presence (Phase 8)
// Heartbeat + who's online

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { checkBusinessAccess } from '@/lib/api-helpers'

const ONLINE_THRESHOLD_MS = 5 * 60 * 1000 // 5 minutes

async function requireFlowsAccess(businessId: string) {
  const access = await checkBusinessAccess(businessId)
  if (!access.authorized) {
    return { ok: false as const, response: NextResponse.json({ message: access.error }, { status: access.status }), session: null }
  }
  const business = await prisma.business.findUnique({
    where: { id: businessId },
    select: { subscriptionPlan: true }
  })
  if (!business || business.subscriptionPlan !== 'BUSINESS') {
    return { ok: false as const, response: NextResponse.json({ message: 'WaveOrder Flows requires Business plan' }, { status: 403 }), session: null }
  }
  return { ok: true as const, response: null, session: access.session }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ businessId: string }> }
) {
  try {
    const { businessId } = await params
    const access = await requireFlowsAccess(businessId)
    if (!access.ok) return access.response!
    if (!access.session?.user?.id) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })

    await prisma.whatsAppAgentPresence.upsert({
      where: {
        userId_businessId: { userId: access.session.user.id, businessId }
      },
      create: {
        userId: access.session.user.id,
        businessId,
        lastSeenAt: new Date()
      },
      update: { lastSeenAt: new Date() }
    })
    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error('[whatsapp-flows] presence POST:', error)
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 })
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ businessId: string }> }
) {
  try {
    const { businessId } = await params
    const access = await requireFlowsAccess(businessId)
    if (!access.ok) return access.response!

    const cutoff = new Date(Date.now() - ONLINE_THRESHOLD_MS)
    const presences = await prisma.whatsAppAgentPresence.findMany({
      where: { businessId, lastSeenAt: { gte: cutoff } }
    })

    const userIds = [...new Set(presences.map((p) => p.userId as string))]
    const users = userIds.length
      ? await prisma.user.findMany({
          where: { id: { in: userIds } },
          select: { id: true, name: true, email: true }
        })
      : []

    const online = users.map((u) => ({
      userId: u.id,
      name: u.name || u.email,
      lastSeenAt: presences.find((p) => p.userId === u.id)?.lastSeenAt
    }))

    return NextResponse.json({ online })
  } catch (error) {
    console.error('[whatsapp-flows] presence GET:', error)
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 })
  }
}
