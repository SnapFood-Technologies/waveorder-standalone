// WaveOrder Flows - List assignable agents (filtered by agentUserIds when configured)
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { checkBusinessAccess } from '@/lib/api-helpers'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ businessId: string }> }
) {
  try {
    const { businessId } = await params
    const access = await checkBusinessAccess(businessId)
    if (!access.authorized) {
      return NextResponse.json({ message: access.error }, { status: access.status })
    }
    const business = await prisma.business.findUnique({
      where: { id: businessId },
      select: { subscriptionPlan: true }
    })
    if (!business || !['PRO', 'BUSINESS'].includes(business.subscriptionPlan)) {
      return NextResponse.json({ message: 'WaveOrder Flows requires Pro or Business plan' }, { status: 403 })
    }

    const settings = await prisma.whatsAppSettings.findUnique({
      where: { businessId },
      select: { agentUserIds: true }
    })
    const agentIds = settings?.agentUserIds
    const whereClause = agentIds && agentIds.length > 0
      ? { businessId, userId: { in: agentIds } }
      : { businessId }

    const members = await prisma.businessUser.findMany({
      where: whereClause,
      include: { user: { select: { id: true, name: true, email: true } } },
      orderBy: { createdAt: 'asc' }
    })

    const agents = members.map((m) => ({
      userId: m.userId,
      name: m.user.name || m.user.email || 'Unknown'
    }))

    return NextResponse.json({ agents })
  } catch (error) {
    console.error('[whatsapp-flows] agents:', error)
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 })
  }
}
