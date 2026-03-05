// Sync contact totalOrders and lastOrderAt from Order/Appointment/ServiceRequest
// Business plan only. Sources vary by business type: Order (restaurant/retail/salon), ServiceRequest (services)

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
    select: { subscriptionPlan: true, businessType: true }
  })
  if (!business || business.subscriptionPlan !== 'BUSINESS') {
    return { ok: false as const, response: NextResponse.json({ message: 'WaveOrder Flows requires Business plan' }, { status: 403 }) }
  }
  return { ok: true as const, business }
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
    const business = access.business
    const businessType = business?.businessType?.toUpperCase()

    const byPhone = new Map<string, { totalOrders: number; lastOrderAt: Date }>()

    // SERVICES: sync from ServiceRequest (phone field)
    if (businessType === 'SERVICES') {
      const requests = await prisma.serviceRequest.findMany({
        where: { businessId },
        select: { phone: true, createdAt: true }
      })
      for (const r of requests) {
        const phone = r.phone || ''
        const digits = normalizePhone(phone)
        if (!digits || digits.length < 10) continue
        const existing = byPhone.get(digits)
        if (existing) {
          existing.totalOrders++
          if (r.createdAt > existing.lastOrderAt) existing.lastOrderAt = r.createdAt
        } else {
          byPhone.set(digits, { totalOrders: 1, lastOrderAt: r.createdAt })
        }
      }
    } else {
      // RESTAURANT, CAFE, RETAIL, GROCERY, SALON, OTHER: sync from Order (via customer)
      const orders = await prisma.order.findMany({
        where: { businessId },
        include: { customer: { select: { phone: true } } }
      })
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
