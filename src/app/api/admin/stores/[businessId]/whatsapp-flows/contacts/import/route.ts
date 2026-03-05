// WaveOrder Flows - Import contacts from conversations or CSV
// Business plan only

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { checkBusinessAccess } from '@/lib/api-helpers'
import { normalizePhone } from '@/lib/whatsapp-utils'

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

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ businessId: string }> }
) {
  try {
    const { businessId } = await params
    const access = await requireFlowsAccess(businessId)
    if (!access.ok) return access.response

    const body = await request.json().catch(() => ({}))
    const { source, rows } = body // source: "conversations" | "csv", rows: [{phone, name?}]

    if (source === 'conversations') {
      const convos = await prisma.whatsAppConversation.findMany({
        where: { businessId },
        select: { customerPhone: true, customerName: true }
      })
      let created = 0
      for (const c of convos) {
        const phone = normalizePhone(c.customerPhone)
        if (!phone) continue
        await prisma.whatsAppContact.upsert({
          where: { businessId_phone: { businessId, phone } },
          create: {
            businessId,
            phone,
            name: c.customerName,
            source: 'conversation'
          },
          update: {}
        })
        created++
      }
      return NextResponse.json({ imported: created, source: 'conversations' })
    }

    if (source === 'csv' && Array.isArray(rows)) {
      let imported = 0
      for (const row of rows.slice(0, 5000)) {
        const phone = normalizePhone(String(row.phone || row.Phone || row.PHONE || ''))
        if (!phone || phone.length < 10) continue
        const name = row.name || row.Name || row.NAME
        await prisma.whatsAppContact.upsert({
          where: { businessId_phone: { businessId, phone } },
          create: {
            businessId,
            phone,
            name: typeof name === 'string' ? name.trim() || null : null,
            source: 'import'
          },
          update: { name: typeof name === 'string' ? name.trim() || null : undefined }
        })
        imported++
      }
      return NextResponse.json({ imported, source: 'csv' })
    }

    return NextResponse.json({ message: 'Invalid import source or rows' }, { status: 400 })
  } catch (error) {
    console.error('[whatsapp-flows] contacts import:', error)
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 })
  }
}
