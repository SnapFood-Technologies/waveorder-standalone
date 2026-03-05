// WaveOrder Flows - FAQ CRUD
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

    const faqs = await prisma.whatsAppFaq.findMany({
      where: { businessId },
      orderBy: { order: 'asc' }
    })
    return NextResponse.json({ faqs })
  } catch (error) {
    console.error('[whatsapp-flows] faqs GET:', error)
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
    const { question, answer } = body
    if (!question || typeof question !== 'string' || !question.trim()) {
      return NextResponse.json({ message: 'Question is required' }, { status: 400 })
    }
    if (!answer || typeof answer !== 'string' || !answer.trim()) {
      return NextResponse.json({ message: 'Answer is required' }, { status: 400 })
    }

    const count = await prisma.whatsAppFaq.count({ where: { businessId } })
    const faq = await prisma.whatsAppFaq.create({
      data: {
        businessId,
        question: question.trim(),
        answer: answer.trim(),
        order: count
      }
    })
    return NextResponse.json({ faq })
  } catch (error) {
    console.error('[whatsapp-flows] faqs POST:', error)
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 })
  }
}
