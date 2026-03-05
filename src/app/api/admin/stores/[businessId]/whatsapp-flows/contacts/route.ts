// WaveOrder Flows - Contacts (Phase 7 Broadcast)
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

function normalizePhone(phone: string): string {
  let cleaned = phone.replace(/\D/g, '')
  if (!cleaned.startsWith('+')) cleaned = '+' + cleaned
  return cleaned
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
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10))
    const limit = Math.min(100, Math.max(10, parseInt(searchParams.get('limit') || '50', 10)))
    const search = searchParams.get('search')?.trim()
    const optedOutOnly = searchParams.get('optedOut') === 'true'
    const tag = searchParams.get('tag')?.trim()

    const where: { businessId: string; optedOut?: boolean; tags?: { has: string }; OR?: object[] } = { businessId }
    if (optedOutOnly) where.optedOut = true
    if (tag) where.tags = { has: tag }
    if (search) {
      where.OR = [
        { phone: { contains: search } },
        { name: { contains: search } }
      ]
    }

    const [contacts, total] = await Promise.all([
      prisma.whatsAppContact.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit
      }),
      prisma.whatsAppContact.count({ where })
    ])

    const optedOutCount = await prisma.whatsAppContact.count({
      where: { businessId, optedOut: true }
    })

    return NextResponse.json({
      contacts,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
      optedOutCount
    })
  } catch (error) {
    console.error('[whatsapp-flows] contacts GET:', error)
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
    const { phone, name, tags } = body

    if (!phone || typeof phone !== 'string' || !phone.trim()) {
      return NextResponse.json({ message: 'Phone is required' }, { status: 400 })
    }

    const normalizedPhone = normalizePhone(phone.trim())
    const tagsArr = Array.isArray(tags) ? tags.filter((t: unknown) => typeof t === 'string') : []

    const contact = await prisma.whatsAppContact.upsert({
      where: { businessId_phone: { businessId, phone: normalizedPhone } },
      create: {
        businessId,
        phone: normalizedPhone,
        name: typeof name === 'string' ? name.trim() || null : null,
        tags: tagsArr,
        source: 'manual'
      },
      update: {
        name: typeof name === 'string' ? name.trim() || null : undefined,
        tags: tagsArr.length ? tagsArr : undefined,
        optedOut: false,
        optedOutAt: null
      }
    })

    return NextResponse.json({ contact })
  } catch (error) {
    console.error('[whatsapp-flows] contacts POST:', error)
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 })
  }
}
