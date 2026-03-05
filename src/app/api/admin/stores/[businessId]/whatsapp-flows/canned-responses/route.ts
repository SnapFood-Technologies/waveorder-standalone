// WaveOrder Flows - Canned responses (Phase 8)
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
  { params }: { params: Promise<{ businessId: string }> }
) {
  try {
    const { businessId } = await params
    const access = await requireFlowsAccess(businessId)
    if (!access.ok) return access.response

    const responses = await prisma.whatsAppCannedResponse.findMany({
      where: { businessId },
      orderBy: { title: 'asc' }
    })
    return NextResponse.json({ responses })
  } catch (error) {
    console.error('[whatsapp-flows] canned-responses GET:', error)
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
    const { title, body: responseBody, shortcut, category } = body
    if (!title || typeof title !== 'string' || !title.trim()) {
      return NextResponse.json({ message: 'Title is required' }, { status: 400 })
    }
    if (!responseBody || typeof responseBody !== 'string' || !responseBody.trim()) {
      return NextResponse.json({ message: 'Body is required' }, { status: 400 })
    }

    const response = await prisma.whatsAppCannedResponse.create({
      data: {
        businessId,
        title: title.trim(),
        body: responseBody.trim(),
        shortcut: typeof shortcut === 'string' && shortcut.trim() ? shortcut.trim() : null,
        category: ['greeting', 'support', 'order', 'general'].includes(category) ? category : null
      }
    })
    return NextResponse.json({ response })
  } catch (error) {
    console.error('[whatsapp-flows] canned-responses POST:', error)
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 })
  }
}
