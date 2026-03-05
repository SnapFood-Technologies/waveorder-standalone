// Sync contact totalOrders and lastOrderAt from Order/Customer data
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
  return phone.replace(/\D/g, '').slice(-10)
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ businessId: string }> }
) {
  try {
    const { businessId } = await params
    const access = await requireFlowsAccess(businessId)
    if (!access.ok) return access.response

    const orders = await prisma.order.findMany({
      where: { businessId },
      include: { customer: { select: { phone: true } } }
    })

    const byPhone = new Map<string, { totalOrders: number; lastOrderAt: Date }>()
    for (const o of orders) {
      const phone = o.customer?.phone || ''
      const digits = normalizePhone(phone)
      if (!digits) continue
      const existing = byPhone.get(digits)
      if (existing) {
        existing.totalOrders++
        if (o.createdAt > existing.lastOrderAt) existing.lastOrderAt = o.createdAt
      } else {
        byPhone.set(digits, { totalOrders: 1, lastOrderAt: o.createdAt })
      }
    }

    const contacts = await prisma.whatsAppContact.findMany({ where: { businessId } })
    let synced = 0
    for (const contact of contacts) {
      const digits = normalizePhone(contact.phone)
      const stats = byPhone.get(digits)
      if (stats) {
        await prisma.whatsAppContact.update({
          where: { id: contact.id },
          data: { totalOrders: stats.totalOrders, lastOrderAt: stats.lastOrderAt }
        })
        synced++
      }
    }

    return NextResponse.json({ synced })
  } catch (error) {
    console.error('[whatsapp-flows] contacts sync-orders:', error)
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 })
  }
}
