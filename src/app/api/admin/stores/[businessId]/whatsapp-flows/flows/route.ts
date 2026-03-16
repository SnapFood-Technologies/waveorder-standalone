// WaveOrder Flows - List flows, Create flow
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

    const flows = await prisma.whatsAppFlow.findMany({
      where: { businessId },
      orderBy: [{ priority: 'desc' }, { createdAt: 'asc' }]
    })

    return NextResponse.json({ flows })
  } catch (error) {
    console.error('[whatsapp-flows] flows GET:', error)
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ businessId: string }> }
) {
  try {
    const { businessId } = await params
    const access = await requireFlowsAccess(businessId)
    if (!access.ok) return access.response

    const body = await request.json().catch(() => ({}))
    const { name, type, trigger, steps, editorType, canvasData } = body

    if (!name || typeof name !== 'string' || !name.trim()) {
      return NextResponse.json({ message: 'Flow name is required' }, { status: 400 })
    }
    const validTypes = ['welcome', 'away', 'keyword', 'button_reply']
    const flowType = validTypes.includes(type) ? type : 'keyword'
    const triggerObj = trigger && typeof trigger === 'object' ? trigger : { type: 'keyword', keywords: [] }
    const stepsArr = Array.isArray(steps) ? steps : []
    const isVisual = editorType === 'visual'
    const canvas = isVisual && canvasData && typeof canvasData === 'object' ? canvasData : undefined

    const flow = await prisma.whatsAppFlow.create({
      data: {
        businessId,
        name: name.trim(),
        type: flowType,
        isActive: true,
        priority: 50,
        trigger: triggerObj as object,
        steps: stepsArr as object,
        editorType: isVisual ? 'visual' : 'form',
        canvasData: canvas ?? undefined
      }
    })

    return NextResponse.json({ flow })
  } catch (error) {
    console.error('[whatsapp-flows] flows POST:', error)
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 })
  }
}
