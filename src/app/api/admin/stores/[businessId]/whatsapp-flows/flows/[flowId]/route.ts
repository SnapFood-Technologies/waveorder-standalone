// WaveOrder Flows - Get, Update, Delete flow
// Business plan only

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
  if (!business || business.subscriptionPlan !== 'BUSINESS') {
    return { ok: false as const, response: NextResponse.json({ message: 'WaveOrder Flows requires Business plan' }, { status: 403 }) }
  }
  return { ok: true as const }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ businessId: string; flowId: string }> }
) {
  try {
    const { businessId, flowId } = await params
    const access = await requireFlowsAccess(businessId)
    if (!access.ok) return access.response

    const flow = await prisma.whatsAppFlow.findFirst({
      where: { id: flowId, businessId }
    })

    if (!flow) {
      return NextResponse.json({ message: 'Flow not found' }, { status: 404 })
    }

    return NextResponse.json({ flow })
  } catch (error) {
    console.error('[whatsapp-flows] flow GET:', error)
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 })
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ businessId: string; flowId: string }> }
) {
  try {
    const { businessId, flowId } = await params
    const access = await requireFlowsAccess(businessId)
    if (!access.ok) return access.response

    const body = await request.json().catch(() => ({}))
    const { name, type, trigger, steps, priority } = body

    const updateData: Record<string, unknown> = {}
    if (typeof name === 'string' && name.trim()) updateData.name = name.trim()
    if (['welcome', 'away', 'keyword', 'button_reply'].includes(type)) updateData.type = type
    if (trigger && typeof trigger === 'object') updateData.trigger = trigger
    if (Array.isArray(steps)) updateData.steps = steps
    if (typeof priority === 'number') updateData.priority = priority

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json({ message: 'No valid updates' }, { status: 400 })
    }

    const flow = await prisma.whatsAppFlow.updateMany({
      where: { id: flowId, businessId },
      data: updateData
    })

    if (flow.count === 0) {
      return NextResponse.json({ message: 'Flow not found' }, { status: 404 })
    }

    const updated = await prisma.whatsAppFlow.findFirst({
      where: { id: flowId, businessId }
    })
    return NextResponse.json({ flow: updated })
  } catch (error) {
    console.error('[whatsapp-flows] flow PUT:', error)
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ businessId: string; flowId: string }> }
) {
  try {
    const { businessId, flowId } = await params
    const access = await requireFlowsAccess(businessId)
    if (!access.ok) return access.response

    const result = await prisma.whatsAppFlow.deleteMany({
      where: { id: flowId, businessId }
    })

    if (result.count === 0) {
      return NextResponse.json({ message: 'Flow not found' }, { status: 404 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[whatsapp-flows] flow DELETE:', error)
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 })
  }
}
