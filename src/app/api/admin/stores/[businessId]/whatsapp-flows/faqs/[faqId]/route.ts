// WaveOrder Flows - FAQ update/delete
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

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ businessId: string; faqId: string }> }
) {
  try {
    const { businessId, faqId } = await params
    const access = await requireFlowsAccess(businessId)
    if (!access.ok) return access.response

    const body = await request.json().catch(() => ({}))
    const { question, answer, order } = body
    const updateData: Record<string, unknown> = {}
    if (typeof question === 'string' && question.trim()) updateData.question = question.trim()
    if (typeof answer === 'string' && answer.trim()) updateData.answer = answer.trim()
    if (typeof order === 'number') updateData.order = order

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json({ message: 'No valid updates' }, { status: 400 })
    }

    const faq = await prisma.whatsAppFaq.updateMany({
      where: { id: faqId, businessId },
      data: updateData
    })
    if (faq.count === 0) return NextResponse.json({ message: 'FAQ not found' }, { status: 404 })
    const updated = await prisma.whatsAppFaq.findFirst({ where: { id: faqId, businessId } })
    return NextResponse.json({ faq: updated })
  } catch (error) {
    console.error('[whatsapp-flows] faq PUT:', error)
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ businessId: string; faqId: string }> }
) {
  try {
    const { businessId, faqId } = await params
    const access = await requireFlowsAccess(businessId)
    if (!access.ok) return access.response

    const result = await prisma.whatsAppFaq.deleteMany({
      where: { id: faqId, businessId }
    })
    if (result.count === 0) return NextResponse.json({ message: 'FAQ not found' }, { status: 404 })
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[whatsapp-flows] faq DELETE:', error)
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 })
  }
}
