// WaveOrder Flows - Templates (Phase 7 Broadcast)
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

    const templates = await prisma.whatsAppTemplate.findMany({
      where: { businessId },
      orderBy: { name: 'asc' }
    })
    return NextResponse.json({ templates })
  } catch (error) {
    console.error('[whatsapp-flows] templates GET:', error)
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
    const { name, contentSid, language, category, bodyPreview, variableCount, sampleVariables } = body

    if (!name || typeof name !== 'string' || !name.trim()) {
      return NextResponse.json({ message: 'Template name is required' }, { status: 400 })
    }
    if (!contentSid || typeof contentSid !== 'string' || !contentSid.trim()) {
      return NextResponse.json({ message: 'Content SID is required' }, { status: 400 })
    }

    const template = await prisma.whatsAppTemplate.create({
      data: {
        businessId,
        name: name.trim(),
        contentSid: contentSid.trim(),
        language: typeof language === 'string' ? language : 'en',
        category: ['MARKETING', 'UTILITY', 'AUTHENTICATION'].includes(category) ? category : 'MARKETING',
        bodyPreview: typeof bodyPreview === 'string' ? bodyPreview : null,
        variableCount: typeof variableCount === 'number' ? variableCount : 0,
        sampleVariables: sampleVariables && typeof sampleVariables === 'object' ? sampleVariables : null
      }
    })
    return NextResponse.json({ template })
  } catch (error) {
    console.error('[whatsapp-flows] templates POST:', error)
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 })
  }
}
